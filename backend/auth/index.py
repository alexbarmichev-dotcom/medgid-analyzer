import json
import os
import re
import time
import random
import hmac
import hashlib
import base64
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from typing import Dict, Any, Optional

import psycopg2

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
LOGIN_RE = re.compile(r"^[A-Za-zА-Яа-яЁё0-9_-]{2,32}$")
PASSWORD_RE = re.compile(r"^\d{4}$")
DEVICE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{6,64}$")
CODE_TTL_SECONDS = 600
RESEND_COOLDOWN_SECONDS = 60
MAX_ATTEMPTS = 5

SMTP_HOST = "smtp.mail.ru"
SMTP_PORT = 465


def _normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()[:255]


def _hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${digest}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(_hash_password(password, salt), stored)


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


def _send_email_code(email: str, code: str) -> None:
    smtp_login = os.environ["MAILRU_SMTP_LOGIN"]
    smtp_password = os.environ["MAILRU_SMTP_PASSWORD"]

    html = (
        "<h2>Код входа в ЛабГид</h2>"
        f"<p style='font-size:28px;font-weight:700;letter-spacing:4px'>{code}</p>"
        "<p>Код действителен 10 минут. Если вы не запрашивали вход — проигнорируйте письмо.</p>"
    )
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = Header("ЛабГид — код для входа", "utf-8")
    msg["From"] = smtp_login
    msg["To"] = email

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.login(smtp_login, smtp_password)
        server.sendmail(smtp_login, [email], msg.as_string())


def _find_or_create_user(dsn: str, email: str) -> bool:
    """Возвращает is_free пользователя, создаёт при отсутствии."""
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT is_free FROM users WHERE login = %s", (email,))
            row = cur.fetchone()
            if row:
                return bool(row[0])
            cur.execute(
                "INSERT INTO users (login) VALUES (%s) ON CONFLICT (login) DO NOTHING",
                (email,),
            )
        conn.commit()
        return False
    finally:
        conn.close()


def _handle_anonymous(dsn: str, body: Dict[str, Any], secret: str) -> Dict[str, Any]:
    device_id = (body.get("deviceId") or "").strip()
    if not DEVICE_ID_RE.match(device_id):
        return _resp(400, {"error": "Некорректный идентификатор устройства"})

    login = f"guest:{device_id}"
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (login, is_free) VALUES (%s, false) "
                "ON CONFLICT (login) DO NOTHING",
                (login,),
            )
        conn.commit()
    finally:
        conn.close()

    token = _sign_token(login, secret)
    return _resp(200, {"ok": True, "token": token, "login": login, "isFree": False})


def _handle_password_login(dsn: str, body: Dict[str, Any], secret: str) -> Dict[str, Any]:
    raw_login = (body.get("login") or "").strip()
    password = str(body.get("password") or "").strip()
    if not LOGIN_RE.match(raw_login):
        return _resp(400, {"error": "Логин: от 2 до 32 букв, цифр, _ или -"})
    if not PASSWORD_RE.match(password):
        return _resp(400, {"error": "Пароль должен состоять ровно из 4 цифр"})

    login = f"acct:{raw_login.lower()}"
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT password_hash, is_free FROM users WHERE login = %s", (login,))
            row = cur.fetchone()
            if row:
                stored_hash, is_free = row
                if not stored_hash or not _verify_password(password, stored_hash):
                    return _resp(401, {"error": "Неверный логин или пароль"})
            else:
                password_hash = _hash_password(password)
                cur.execute(
                    "INSERT INTO users (login, password_hash, is_free) VALUES (%s, %s, false)",
                    (login, password_hash),
                )
                is_free = False
        conn.commit()
    finally:
        conn.close()

    token = _sign_token(login, secret)
    return _resp(200, {"ok": True, "token": token, "login": login, "isFree": bool(is_free)})


def _handle_send_code(dsn: str, body: Dict[str, Any]) -> Dict[str, Any]:
    email = _normalize_email(body.get("email", ""))
    if not EMAIL_RE.match(email):
        return _resp(400, {"error": "Введите корректный email"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT created_at FROM sms_codes WHERE phone = %s "
                "ORDER BY created_at DESC LIMIT 1",
                (email,),
            )
            last = cur.fetchone()
            if last:
                elapsed = time.time() - last[0].timestamp()
                if elapsed < RESEND_COOLDOWN_SECONDS:
                    wait = int(RESEND_COOLDOWN_SECONDS - elapsed)
                    return _resp(429, {"error": f"Повторите через {wait} сек"})

            code = f"{random.randint(0, 9999):04d}"
            cur.execute(
                "INSERT INTO sms_codes (phone, code) VALUES (%s, %s)",
                (email, code),
            )
        conn.commit()
    finally:
        conn.close()

    try:
        _send_email_code(email, code)
    except Exception:
        return _resp(502, {"error": "Не удалось отправить код на почту, попробуйте ещё раз"})

    return _resp(200, {"ok": True})


def _handle_verify_code(dsn: str, body: Dict[str, Any], secret: str) -> Dict[str, Any]:
    email = _normalize_email(body.get("email", ""))
    code = str(body.get("code", "")).strip()
    if not EMAIL_RE.match(email):
        return _resp(400, {"error": "Введите корректный email"})
    if not code:
        return _resp(400, {"error": "Введите код из письма"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, code, attempts, created_at FROM sms_codes "
                "WHERE phone = %s AND used = false ORDER BY created_at DESC LIMIT 1",
                (email,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(400, {"error": "Код не найден, запросите новый"})

            code_id, real_code, attempts, created_at = row
            if time.time() - created_at.timestamp() > CODE_TTL_SECONDS:
                return _resp(400, {"error": "Код устарел, запросите новый"})
            if attempts >= MAX_ATTEMPTS:
                return _resp(429, {"error": "Слишком много попыток, запросите новый код"})

            if real_code != code:
                cur.execute(
                    "UPDATE sms_codes SET attempts = attempts + 1 WHERE id = %s",
                    (code_id,),
                )
                conn.commit()
                return _resp(400, {"error": "Неверный код"})

            cur.execute("UPDATE sms_codes SET used = true WHERE id = %s", (code_id,))
        conn.commit()
    finally:
        conn.close()

    is_free = _find_or_create_user(dsn, email)
    token = _sign_token(email, secret)
    return _resp(200, {"ok": True, "token": token, "login": email, "email": email, "isFree": is_free})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: вход в личный кабинет ЛабГид. Для разового бесплатного доступа —
    anonymous (создаёт/находит гостевой аккаунт по deviceId браузера, без
    какой-либо верификации). Для подписки — на выбор: send_code/verify_code
    (вход по email через 4-значный код на почту) либо password_login (вход
    по произвольному логину и 4-значному цифровому паролю, аккаунт создаётся
    автоматически при первом входе).
    Args: event с httpMethod, body {action: 'anonymous'|'send_code'|'verify_code'|
          'password_login', deviceId?, email?, code?, login?, password?}
    Returns: HTTP-ответ с токеном сессии либо подтверждением отправки кода
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    action = body.get("action", "")
    dsn = os.environ["DATABASE_URL"]
    secret = os.environ.get("AUTH_SECRET")
    if not secret:
        return _resp(500, {"error": "Сервис временно недоступен, попробуйте позже"})

    if action == "anonymous":
        return _handle_anonymous(dsn, body, secret)

    if action == "password_login":
        return _handle_password_login(dsn, body, secret)

    if action == "send_code":
        return _handle_send_code(dsn, body)

    if action == "verify_code":
        return _handle_verify_code(dsn, body, secret)

    return _resp(400, {"error": "Неизвестное действие"})