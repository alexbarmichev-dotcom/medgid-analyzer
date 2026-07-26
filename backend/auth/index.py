import json
import os
import time
import hmac
import hashlib
import base64
import re
from typing import Dict, Any

import psycopg2


def _norm_login(raw: str) -> str:
    return re.sub(r"\s+", " ", (raw or "").strip())[:64]


def _sign_token(login: str, secret: str) -> str:
    payload = {"login": login, "iat": int(time.time())}
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{body}.{sig}"


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "isBase64Encoded": False,
        "body": json.dumps(body),
    }


def _get_or_create_user(dsn: str, login: str) -> None:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            escaped = login.replace("'", "''")
            cur.execute(
                f"INSERT INTO users (login) VALUES ('{escaped}') "
                f"ON CONFLICT (login) DO NOTHING"
            )
        conn.commit()
    finally:
        conn.close()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: регистрация/вход в личный кабинет МедГид по логину без подтверждения.
    Args: event с httpMethod, body {login}
    Returns: HTTP-ответ с токеном сессии
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    login = _norm_login(body.get("login", ""))
    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")

    if len(login) < 2:
        return _resp(400, {"error": "Введите логин от 2 символов"})

    try:
        _get_or_create_user(os.environ["DATABASE_URL"], login)
    except Exception:
        return _resp(502, {"error": "Не удалось сохранить пользователя, попробуйте ещё раз"})

    token = _sign_token(login, secret)
    return _resp(200, {"ok": True, "token": token, "login": login})
