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

YOOKASSA_API = "https://api.yookassa.ru/v3"
PRICE_RUB = "190.00"

SYSTEM_PROMPT = (
    "Ты врач терапевт со стажем работы 35 лет. Посмотри присланные тебе анализы биохимических "
    "исследований, возраст, пол, недомогания пациента и объясни значение теста, укажи, насколько "
    "результат отличается от нормы с учетом возраста, пола, сопутствующих заболеваний и предложи "
    "общие рекомендации по обсуждению результата с врачом. Разбей ответ строго на три части и "
    "используй ТОЧНО такие заголовки (в формате markdown, каждый на отдельной строке):\n"
    "## ЧАСТЬ 1: Значение показателей и отклонения от нормы\n"
    "## ЧАСТЬ 2: Возможные дополнительные исследования\n"
    "## ЧАСТЬ 3: Вопросы, которые вы можете задать врачу\n"
    "В первой части расскажи значение теста, укажи, насколько результат отличается от нормы с "
    "учетом возраста, пола, сопутствующих заболеваний. Во второй части расскажи про вероятные "
    "дополнительные исследования, если они необходимы. В третьей части напиши возможные вопросы "
    "пациента к врачу, чтобы врачу было понятнее вести с пациентом диалог. Будь максимально "
    "дружелюбен и вежлив. Все ответы давай без диагнозов и жестких интерпретаций."
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
    """Проверяет токен, выданный функцией auth. Возвращает логин или None."""
    try:
        body_b64, sig = token.split(".")
        expected_sig = hmac.new(secret.encode(), body_b64.encode(), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = body_b64 + "=" * (-len(body_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        return payload.get("login")
    except Exception:
        return None


def _esc(v: Optional[str]) -> str:
    return "'" + v.replace("'", "''") + "'" if v else "NULL"


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
        "max_tokens": 4096,
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
    with urllib.request.urlopen(req, timeout=85) as res:
        data = json.loads(res.read().decode())
    return data["choices"][0]["message"]["content"]


def _save_analysis(dsn: str, login: str, gender: str, age: Optional[int], complaints: str,
                    conditions: str, meds: str, file_urls: List[str], ai_result: str,
                    payment_id: Optional[str], payment_status: str, amount: str) -> int:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            sql = (
                "INSERT INTO analyses (login, gender, age, complaints, conditions, meds, "
                "file_urls, ai_result, status, payment_id, payment_status, amount) VALUES ("
                f"{_esc(login)}, {_esc(gender)}, {age if age is not None else 'NULL'}, "
                f"{_esc(complaints)}, {_esc(conditions)}, {_esc(meds)}, "
                f"{_esc(json.dumps(file_urls))}::jsonb, {_esc(ai_result)}, 'done', "
                f"{_esc(payment_id)}, {_esc(payment_status)}, {amount}"
                ") RETURNING id"
            )
            cur.execute(sql)
            new_id = cur.fetchone()[0]
        conn.commit()
        return new_id
    finally:
        conn.close()


def _is_user_free(dsn: str, login: str) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT is_free FROM users WHERE login = {_esc(login)}")
            row = cur.fetchone()
            return bool(row and row[0])
    finally:
        conn.close()


def _yookassa_auth_header() -> str:
    shop_id = os.environ["YOOKASSA_SHOP_ID"]
    secret_key = os.environ["YOOKASSA_SECRET_KEY"]
    token = base64.b64encode(f"{shop_id.strip()}:{secret_key.strip()}".encode()).decode()
    return f"Basic {token}"


def _yookassa_request(method: str, path: str, body: Optional[dict] = None,
                       idempotence_key: Optional[str] = None) -> dict:
    req_headers = {
        "Authorization": _yookassa_auth_header(),
        "Content-Type": "application/json",
    }
    if idempotence_key:
        req_headers["Idempotence-Key"] = idempotence_key
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{YOOKASSA_API}{path}", data=data, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.loads(res.read().decode())


def _create_payment(login: str, return_url: str) -> dict:
    body = {
        "amount": {"value": PRICE_RUB, "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": return_url},
        "capture": True,
        "description": "Разбор анализа — МедГид",
        "metadata": {"login": login},
    }
    return _yookassa_request("POST", "/payments", body, idempotence_key=str(uuid.uuid4()))


def _get_payment(payment_id: str) -> dict:
    return _yookassa_request("GET", f"/payments/{payment_id}")


def _mark_pending(dsn: str, payment_id: str, status: str) -> None:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE pending_analyses SET status = {_esc(status)} "
                f"WHERE payment_id = {_esc(payment_id)}"
            )
        conn.commit()
    finally:
        conn.close()


def _handle_create_payment(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    gender = body.get("gender", "")
    age_raw = body.get("age", "")
    age = int(age_raw) if str(age_raw).isdigit() else None
    complaints = body.get("complaints", "")
    conditions = body.get("conditions", "")
    meds = body.get("meds", "")
    files = body.get("files") or []
    return_url = body.get("returnUrl") or "https://poehali.dev"

    if not files:
        return _resp(400, {"error": "Загрузите фото или скан анализа"})
    if len(files) > 6:
        return _resp(400, {"error": "Слишком много файлов, максимум 6"})

    try:
        uploaded = _upload_files(files)
    except Exception:
        return _resp(502, {"error": "Не удалось загрузить файлы"})

    try:
        payment = _create_payment(login, return_url)
    except Exception:
        return _resp(502, {"error": "Не удалось создать платёж, попробуйте ещё раз"})

    payment_id = payment.get("id")
    confirmation_url = (payment.get("confirmation") or {}).get("confirmation_url")
    if not payment_id or not confirmation_url:
        return _resp(502, {"error": "Платёжная система вернула некорректный ответ"})

    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            sql = (
                "INSERT INTO pending_analyses (payment_id, login, gender, age, complaints, "
                "conditions, meds, files, amount, status) VALUES ("
                f"{_esc(payment_id)}, {_esc(login)}, {_esc(gender)}, "
                f"{age if age is not None else 'NULL'}, {_esc(complaints)}, {_esc(conditions)}, "
                f"{_esc(meds)}, {_esc(json.dumps(uploaded))}::jsonb, {PRICE_RUB}, 'pending')"
            )
            cur.execute(sql)
        conn.commit()
    finally:
        conn.close()

    return _resp(200, {
        "ok": True,
        "paymentId": payment_id,
        "confirmationUrl": confirmation_url,
        "amount": PRICE_RUB,
    })


def _handle_check_payment(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    payment_id = body.get("paymentId", "")
    if not payment_id:
        return _resp(400, {"error": "Не указан идентификатор платежа"})

    dsn = os.environ["DATABASE_URL"]

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, ai_result FROM analyses WHERE payment_id = {_esc(payment_id)} "
                f"AND login = {_esc(login)}"
            )
            done_row = cur.fetchone()
            if done_row:
                return _resp(200, {"ok": True, "status": "done", "id": done_row[0], "result": done_row[1]})

            cur.execute(
                "SELECT login, gender, age, complaints, conditions, meds, files, status "
                f"FROM pending_analyses WHERE payment_id = {_esc(payment_id)}"
            )
            pending = cur.fetchone()
    finally:
        conn.close()

    if not pending:
        return _resp(404, {"error": "Платёж не найден"})

    p_login, gender, age, complaints, conditions, meds, files_json, p_status = pending
    if p_login != login:
        return _resp(403, {"error": "Нет доступа к этому платежу"})

    if p_status == "canceled":
        return _resp(200, {"ok": True, "status": "canceled"})

    try:
        payment = _get_payment(payment_id)
    except Exception:
        return _resp(502, {"error": "Не удалось проверить статус оплаты"})

    yk_status = payment.get("status")

    if yk_status == "succeeded":
        uploaded = files_json if isinstance(files_json, list) else json.loads(files_json)
        try:
            ai_result = _call_ai(uploaded, gender, str(age or ""), complaints, conditions, meds)
        except Exception:
            return _resp(502, {"error": "Не удалось получить расшифровку, попробуйте ещё раз"})

        analysis_id = _save_analysis(
            dsn, login, gender, age, complaints, conditions, meds,
            [f["url"] for f in uploaded], ai_result, payment_id, "paid", PRICE_RUB,
        )
        _mark_pending(dsn, payment_id, "done")
        return _resp(200, {"ok": True, "status": "done", "id": analysis_id, "result": ai_result})

    if yk_status == "canceled":
        _mark_pending(dsn, payment_id, "canceled")
        return _resp(200, {"ok": True, "status": "canceled"})

    return _resp(200, {"ok": True, "status": "pending"})


def _handle_free_analysis(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    dsn = os.environ["DATABASE_URL"]
    if not _is_user_free(dsn, login):
        return _resp(403, {"error": "Бесплатный доступ недоступен для этого аккаунта"})

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
            dsn, login, gender, age, complaints, conditions, meds,
            [f["url"] for f in uploaded], ai_result, None, "free", "0.00",
        )
    except Exception:
        analysis_id = None

    return _resp(200, {"ok": True, "id": analysis_id, "result": ai_result})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: обрабатывает платный разбор анализов личного кабинета МедГид через ЮKassa.
    Поддерживает три действия (?action=): create_payment — создаёт платёж на 190 руб.
    и сохраняет заявку на разбор; check_payment — проверяет статус оплаты, при успехе
    запускает ИИ-расшифровку (Claude через Polza AI) и сохраняет результат; free — прямой
    бесплатный разбор для аккаунтов с флагом is_free (минуя оплату).
    Args: event с httpMethod, queryStringParameters.action, headers.X-Authorization (токен
          логина), body {gender, age, complaints, conditions, meds, files, returnUrl} для
          create_payment/free, body {paymentId} для check_payment
    Returns: HTTP-ответ со статусом платежа/расшифровкой или ссылкой на оплату ЮKassa
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    headers = event.get("headers") or {}
    token = headers.get("X-Authorization") or headers.get("x-authorization") or ""
    token = token.replace("Bearer ", "").strip()

    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")
    login = _verify_token(token, secret) if token else None

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    if action == "create_payment":
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})
        return _handle_create_payment(login, body)

    if action == "check_payment":
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})
        return _handle_check_payment(login, body)

    if action == "free":
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})
        return _handle_free_analysis(login, body)

    return _resp(400, {"error": "Неизвестное действие"})