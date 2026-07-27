import json
import os
import hmac
import hashlib
import base64
from typing import Dict, Any, Optional

import psycopg2
import psycopg2.extras


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: возвращает историю запросов пользователя (расшифровок анализов)
    личного кабинета МедГид с порядковым номером и датой обращения.
    Args: event с httpMethod, headers.X-Authorization (токен логина)
    Returns: HTTP-ответ со списком {number, id, date, gender, age, result, status}
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

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
            escaped = login.replace("'", "''")
            cur.execute(
                "SELECT id, created_at, gender, age, complaints, conditions, meds, "
                "ai_result, status FROM analyses "
                f"WHERE login = '{escaped}' ORDER BY created_at ASC"
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
