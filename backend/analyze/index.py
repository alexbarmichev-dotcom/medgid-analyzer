import json
import os
import hmac
import hashlib
import base64
import uuid
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

import boto3
import psycopg2

POLZA_URL = "https://polza.ai/api/v1/chat/completions"
POLZA_MODEL = "anthropic/claude-sonnet-5"

SYSTEM_PROMPT = (
    "Ты — медицинский ассистент сервиса МедГид. Пользователь прислал фото или скан "
    "лабораторного анализа. Разбери каждый показатель отдельно понятным языком: "
    "что это значит, в норме ли он с учётом пола и возраста пациента, если отклонён — "
    "что это может означать. В конце дай короткий список готовых вопросов, которые стоит "
    "задать врачу на приёме. Пиши по-русски, простыми словами, без сложных терминов без "
    "объяснения. Обязательно укажи, что ты не ставишь диагноз и результат не заменяет "
    "консультацию врача."
)


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
        },
        "isBase64Encoded": False,
        "body": json.dumps(body),
    }


def _verify_token(token: str, secret: str) -> Optional[str]:
    """Проверяет токен, выданный функцией auth. Возвращает телефон или None."""
    try:
        body_b64, sig = token.split(".")
        expected_sig = hmac.new(secret.encode(), body_b64.encode(), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = body_b64 + "=" * (-len(body_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        return payload.get("phone")
    except Exception:
        return None


def _upload_files(files: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Загружает base64-файлы в S3 и возвращает список {url, mime}."""
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    uploaded = []
    for f in files:
        raw = base64.b64decode(f["data"])
        mime = f.get("type") or "application/octet-stream"
        ext = mime.split("/")[-1].split(";")[0] or "bin"
        key = f"analyses/{uuid.uuid4()}.{ext}"
        s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        uploaded.append({"url": url, "mime": mime})
    return uploaded


def _call_ai(uploaded: List[Dict[str, str]], gender: str, age: str, complaints: str,
             conditions: str, meds: str) -> str:
    api_key = os.environ["POLZA_AI_API_KEY"]

    profile_lines = [
        f"Пол: {'мужской' if gender == 'm' else 'женский'}",
        f"Возраст: {age}",
    ]
    if complaints:
        profile_lines.append(f"Жалобы сейчас: {complaints}")
    if conditions:
        profile_lines.append(f"Сопутствующие заболевания: {conditions}")
    if meds:
        profile_lines.append(f"Постоянный приём лекарств: {meds}")

    content: List[Dict[str, Any]] = [
        {"type": "text", "text": "Данные пациента:\n" + "\n".join(profile_lines)},
    ]
    for f in uploaded:
        content.append({"type": "image_url", "image_url": {"url": f["url"]}})

    payload = {
        "model": POLZA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        "max_tokens": 2000,
    }

    req = urllib.request.Request(
        POLZA_URL,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=55) as res:
        data = json.loads(res.read().decode())
    return data["choices"][0]["message"]["content"]


def _save_analysis(dsn: str, phone: str, gender: str, age: Optional[int], complaints: str,
                    conditions: str, meds: str, file_urls: List[str], ai_result: str) -> int:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            def esc(v: Optional[str]) -> str:
                return "'" + v.replace("'", "''") + "'" if v else "NULL"

            sql = (
                "INSERT INTO analyses (phone, gender, age, complaints, conditions, meds, "
                "file_urls, ai_result, status) VALUES ("
                f"{esc(phone)}, {esc(gender)}, {age if age is not None else 'NULL'}, "
                f"{esc(complaints)}, {esc(conditions)}, {esc(meds)}, "
                f"{esc(json.dumps(file_urls))}::jsonb, {esc(ai_result)}, 'done'"
                ") RETURNING id"
            )
            cur.execute(sql)
            new_id = cur.fetchone()[0]
        conn.commit()
        return new_id
    finally:
        conn.close()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: принимает данные и сканы анализов из личного кабинета МедГид,
    сохраняет файлы в S3, отправляет их на ИИ-расшифровку (Claude через Polza AI)
    и сохраняет результат в базу данных.
    Args: event с httpMethod, headers.X-Authorization, body {gender, age, complaints,
          conditions, meds, files: [{name, type, data(base64)}]}
    Returns: HTTP-ответ с текстом расшифровки от нейросети
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    headers = event.get("headers") or {}
    token = headers.get("X-Authorization") or headers.get("x-authorization") or ""
    token = token.replace("Bearer ", "").strip()

    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")
    phone = _verify_token(token, secret) if token else None
    if not phone:
        return _resp(401, {"error": "Требуется вход в личный кабинет"})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    gender = body.get("gender", "")
    age_raw = body.get("age", "")
    age = int(age_raw) if str(age_raw).isdigit() else None
    complaints = body.get("complaints", "")
    conditions = body.get("conditions", "")
    meds = body.get("meds", "")
    files = body.get("files") or []

    if not files:
        return _resp(400, {"error": "Загрузите фото или скан анализа"})
    if len(files) > 6:
        return _resp(400, {"error": "Слишком много файлов, максимум 6"})

    try:
        uploaded = _upload_files(files)
    except Exception:
        return _resp(502, {"error": "Не удалось загрузить файлы"})

    try:
        ai_result = _call_ai(uploaded, gender, age_raw, complaints, conditions, meds)
    except urllib.error.HTTPError as e:
        return _resp(502, {"error": f"Ошибка нейросети: {e.code}"})
    except Exception:
        return _resp(502, {"error": "Не удалось получить расшифровку, попробуйте ещё раз"})

    try:
        analysis_id = _save_analysis(
            os.environ["DATABASE_URL"], phone, gender, age, complaints, conditions, meds,
            [f["url"] for f in uploaded], ai_result,
        )
    except Exception:
        analysis_id = None

    return _resp(200, {"ok": True, "id": analysis_id, "result": ai_result})