import json
import os
import uuid
import base64
import hmac
import hashlib
from typing import Dict, Any, List, Optional

import psycopg2
import psycopg2.extras
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
            "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-Admin-Password",
        },
        "isBase64Encoded": False,
        "body": json.dumps(body, default=str),
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


def _handle_history(event: Dict[str, Any]) -> Dict[str, Any]:
    headers = event.get("headers") or {}
    token = headers.get("X-Authorization") or headers.get("x-authorization") or ""
    token = token.replace("Bearer ", "").strip()

    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")
    login = _verify_token(token, secret) if token else None
    if not login:
        return _resp(401, {"error": "Требуется вход в личный кабинет"})

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, created_at, gender, age, complaints, conditions, meds, "
                "ai_result, status FROM analyses "
                "WHERE login = %s ORDER BY created_at ASC",
                (login,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    items = []
    for i, row in enumerate(rows, start=1):
        items.append({
            "number": i,
            "id": row["id"],
            "date": row["created_at"].isoformat() if row["created_at"] else None,
            "gender": row["gender"],
            "age": row["age"],
            "complaints": row["complaints"],
            "conditions": row["conditions"],
            "meds": row["meds"],
            "result": row["ai_result"],
            "status": row["status"],
        })

    items.reverse()  # новые обращения сверху
    return _resp(200, {"ok": True, "items": items})


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
            cur.execute(
                "INSERT INTO feedback (type, subject, message, screenshot_url, status) "
                "VALUES (%s, %s, %s, %s, 'new') RETURNING id",
                (f_type, subject, message, screenshot_url),
            )
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
            args: List[Any] = []
            if f_type and f_type in ALLOWED_TYPES:
                where.append("type = %s")
                args.append(f_type)
            if status and status in ALLOWED_STATUSES:
                where.append("status = %s")
                args.append(status)
            clause = ("WHERE " + " AND ".join(where)) if where else ""
            cur.execute(
                "SELECT id, type, subject, message, screenshot_url, status, created_at "
                f"FROM feedback {clause} ORDER BY created_at DESC",
                tuple(args),
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


def _update_feedback_status(dsn: str, item_id: int, status: str) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE feedback SET status = %s WHERE id = %s",
                (status, item_id),
            )
            updated = cur.rowcount > 0
        conn.commit()
        return updated
    finally:
        conn.close()


def _check_admin_auth(event: Dict[str, Any]) -> bool:
    headers = event.get("headers") or {}
    provided = headers.get("X-Admin-Password") or headers.get("x-admin-password") or ""
    expected = os.environ.get("ADMIN_PASSWORD", "")
    return bool(expected) and hmac.compare_digest(provided, expected)


def _list_admin_payments(dsn: str) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, login, email, gender, age, payment_id, payment_status, "
                "amount, status, created_at FROM analyses ORDER BY created_at DESC LIMIT 500"
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {
            "id": r["id"],
            "login": r["login"],
            "email": r["email"],
            "gender": r["gender"],
            "age": r["age"],
            "paymentId": r["payment_id"],
            "paymentStatus": r["payment_status"],
            "amount": r["amount"],
            "status": r["status"],
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


def _list_admin_users(dsn: str) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT u.id, u.login, u.phone, u.is_free, u.created_at, "
                "COUNT(a.id) AS analyses_count, "
                "COALESCE(SUM(CASE WHEN a.payment_status = 'paid' THEN a.amount ELSE 0 END), 0) AS total_paid "
                "FROM users u LEFT JOIN analyses a ON a.login = u.login "
                "GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500"
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {
            "id": r["id"],
            "login": r["login"],
            "phone": r["phone"],
            "isFree": r["is_free"],
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            "analysesCount": r["analyses_count"],
            "totalPaid": str(r["total_paid"]),
        }
        for r in rows
    ]


def _handle_admin(event: Dict[str, Any]) -> Dict[str, Any]:
    if not _check_admin_auth(event):
        return _resp(401, {"error": "Неверный пароль администратора"})

    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}
    admin_resource = params.get("admin", "payments")

    if admin_resource == "payments":
        return _resp(200, {"ok": True, "items": _list_admin_payments(dsn)})

    if admin_resource == "users":
        return _resp(200, {"ok": True, "items": _list_admin_users(dsn)})

    return _resp(400, {"error": "Неизвестный ресурс"})


def _handle_feedback(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get("httpMethod", "GET")
    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}

    if method == "GET":
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
        item_id = params.get("id")
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})
        status = body.get("status", "")
        if not item_id or status not in ALLOWED_STATUSES:
            return _resp(400, {"error": "Некорректные параметры"})
        try:
            updated = _update_feedback_status(dsn, int(item_id), status)
        except Exception:
            return _resp(502, {"error": "Не удалось обновить статус"})
        if not updated:
            return _resp(404, {"error": "Обращение не найдено"})
        return _resp(200, {"ok": True})

    return _resp(405, {"error": "Метод не поддерживается"})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: возвращает историю запросов пользователя (расшифровок анализов) личного
    кабинета ЛабГид, принимает и отдаёт обращения пользователей (resource=feedback),
    а также отдаёт закрытую админ-панель со списком платежей и пользователей
    (resource=admin, admin=payments|users) по паролю в заголовке X-Admin-Password.
    Args: event с httpMethod, queryStringParameters {resource: 'feedback'|'admin', type,
          status, id, admin}, headers.X-Authorization (токен логина) для истории,
          headers.X-Admin-Password для админ-панели,
          body {type, subject, message, screenshot} для создания обращения,
          body {status} для обновления статуса обращения администратором
    Returns: HTTP-ответ со списком истории анализов, обращений или платежей/пользователей
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    params = event.get("queryStringParameters") or {}
    if params.get("resource") == "feedback":
        return _handle_feedback(event)
    if params.get("resource") == "admin":
        return _handle_admin(event)

    return _handle_history(event)
