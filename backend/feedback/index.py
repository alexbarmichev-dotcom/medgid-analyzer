import json
import os
import uuid
import base64
from typing import Dict, Any, List, Optional

import psycopg2
import boto3

ALLOWED_TYPES = {"question", "suggestion", "wish", "problem"}
ALLOWED_STATUSES = {"new", "in_progress", "done", "rejected"}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "isBase64Encoded": False,
        "body": json.dumps(body),
    }


def esc(v: Optional[str]) -> str:
    return "'" + v.replace("'", "''") + "'" if v is not None else "NULL"


def _upload_screenshot(data_b64: str, mime: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    raw = base64.b64decode(data_b64)
    ext = (mime.split("/")[-1].split(";")[0] or "png")
    key = f"feedback/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _create_feedback(dsn: str, f_type: str, subject: str, message: str,
                      screenshot_url: Optional[str]) -> int:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            sql = (
                "INSERT INTO feedback (type, subject, message, screenshot_url, status) "
                f"VALUES ({esc(f_type)}, {esc(subject)}, {esc(message)}, "
                f"{esc(screenshot_url)}, 'new') RETURNING id"
            )
            cur.execute(sql)
            new_id = cur.fetchone()[0]
        conn.commit()
        return new_id
    finally:
        conn.close()


def _list_feedback(dsn: str, f_type: Optional[str], status: Optional[str]) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            where = []
            if f_type and f_type in ALLOWED_TYPES:
                where.append(f"type = {esc(f_type)}")
            if status and status in ALLOWED_STATUSES:
                where.append(f"status = {esc(status)}")
            clause = ("WHERE " + " AND ".join(where)) if where else ""
            cur.execute(
                "SELECT id, type, subject, message, screenshot_url, status, created_at "
                f"FROM feedback {clause} ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "type": r[1],
                    "subject": r[2],
                    "message": r[3],
                    "screenshotUrl": r[4],
                    "status": r[5],
                    "createdAt": r[6].isoformat(),
                }
                for r in rows
            ]
    finally:
        conn.close()


def _update_status(dsn: str, item_id: int, status: str) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE feedback SET status = {esc(status)} WHERE id = {int(item_id)}"
            )
            updated = cur.rowcount > 0
        conn.commit()
        return updated
    finally:
        conn.close()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: приём и просмотр обращений пользователей МедГид (вопрос, предложение,
    пожелание, критика/проблема) для раздела обратной связи и админ-панели.
    Args: event с httpMethod, queryStringParameters {type, status} для GET,
          body {type, subject, message, screenshot: {data(base64), mime}} для POST,
          body {status} и queryStringParameters {id} для PATCH
    Returns: HTTP-ответ с созданным обращением, списком обращений или статусом обновления
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    dsn = os.environ["DATABASE_URL"]

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        items = _list_feedback(dsn, params.get("type"), params.get("status"))
        return _resp(200, {"ok": True, "items": items})

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})

        f_type = body.get("type", "")
        subject = (body.get("subject") or "").strip()
        message = (body.get("message") or "").strip()

        if f_type not in ALLOWED_TYPES:
            return _resp(400, {"error": "Некорректный тип обращения"})
        if not subject:
            return _resp(400, {"error": "Укажите тему сообщения"})
        if len(message) < 20:
            return _resp(400, {"error": "Сообщение должно содержать не менее 20 символов"})

        screenshot_url = None
        screenshot = body.get("screenshot")
        if screenshot and screenshot.get("data"):
            try:
                screenshot_url = _upload_screenshot(
                    screenshot["data"], screenshot.get("mime", "image/png")
                )
            except Exception:
                return _resp(502, {"error": "Не удалось загрузить скриншот"})

        try:
            new_id = _create_feedback(dsn, f_type, subject, message, screenshot_url)
        except Exception:
            return _resp(502, {"error": "Не удалось отправить сообщение, попробуйте ещё раз"})

        return _resp(200, {"ok": True, "id": new_id})

    if method == "PATCH":
        params = event.get("queryStringParameters") or {}
        item_id = params.get("id")
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})
        status = body.get("status", "")
        if not item_id or status not in ALLOWED_STATUSES:
            return _resp(400, {"error": "Некорректные параметры"})
        try:
            updated = _update_status(dsn, int(item_id), status)
        except Exception:
            return _resp(502, {"error": "Не удалось обновить статус"})
        if not updated:
            return _resp(404, {"error": "Обращение не найдено"})
        return _resp(200, {"ok": True})

    return _resp(405, {"error": "Метод не поддерживается"})
