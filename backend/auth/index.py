import json
import os
import time
import hmac
import hashlib
import base64
import re
from typing import Dict, Any, Optional

import psycopg2

LOGIN_RE = re.compile(r"^[a-zа-яё]{2,20}-[a-zа-яё]{2,20}$", re.IGNORECASE)


def _norm_login(raw: str) -> str:
    value = re.sub(r"\s+", "-", (raw or "").strip().lower())
    return value[:64]


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


def _find_user(dsn: str, login: str) -> Optional[bool]:
    """Возвращает is_free пользователя, если он найден, иначе None."""
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            escaped = login.replace("'", "''")
            cur.execute(f"SELECT is_free FROM users WHERE login = '{escaped}'")
            row = cur.fetchone()
            return bool(row[0]) if row else None
    finally:
        conn.close()


def _create_user(dsn: str, login: str) -> bool:
    """Возвращает True, если пользователь создан, False — если логин уже занят."""
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            escaped = login.replace("'", "''")
            cur.execute(
                f"INSERT INTO users (login) VALUES ('{escaped}') "
                f"ON CONFLICT (login) DO NOTHING"
            )
            created = cur.rowcount > 0
        conn.commit()
        return created
    finally:
        conn.close()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: регистрация и вход в личный кабинет МедГид по логину из двух слов
    через дефис, без пароля и подтверждения.
    Args: event с httpMethod, body {action: 'register'|'login', login}
    Returns: HTTP-ответ с токеном сессии
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    action = body.get("action", "login")
    login = _norm_login(body.get("login", ""))
    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")

    if not LOGIN_RE.match(login):
        return _resp(
            400,
            {"error": "Логин должен состоять из двух слов через дефис, например yasnyi-rassvet"},
        )

    dsn = os.environ["DATABASE_URL"]

    if action == "register":
        try:
            created = _create_user(dsn, login)
        except Exception:
            return _resp(502, {"error": "Не удалось зарегистрировать логин, попробуйте ещё раз"})
        if not created:
            return _resp(409, {"error": "Такой логин уже занят, придумайте другой"})
        token = _sign_token(login, secret)
        return _resp(200, {"ok": True, "token": token, "login": login})

    if action == "login":
        try:
            is_free = _find_user(dsn, login)
        except Exception:
            return _resp(502, {"error": "Не удалось выполнить вход, попробуйте ещё раз"})
        if is_free is None:
            return _resp(404, {"error": "Такой логин не найден, зарегистрируйтесь"})
        token = _sign_token(login, secret)
        return _resp(200, {"ok": True, "token": token, "login": login, "isFree": is_free})

    return _resp(400, {"error": "Неизвестное действие"})