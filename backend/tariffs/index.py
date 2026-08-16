import json
import os
import hmac
import hashlib
import base64
import uuid
import urllib.request
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

import psycopg2
import psycopg2.extras

YOOKASSA_API = "https://api.yookassa.ru/v3"
SUBSCRIPTION_TARIFF_IDS = {"sub_3m", "sub_12m"}
CHAT_PERIOD_DAYS = 30


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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


def _get_login(event: Dict[str, Any]) -> Optional[str]:
    headers = event.get("headers") or {}
    token = headers.get("X-Authorization") or headers.get("x-authorization") or ""
    token = token.replace("Bearer ", "").strip()
    secret = os.environ.get("AUTH_SECRET")
    if not token or not secret:
        return None
    return _verify_token(token, secret)


def _list_tariffs(dsn: str) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, name, description, price, duration_days, features, "
                "chat_question_limit FROM tariffs WHERE is_active = true ORDER BY sort_order"
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "price": str(r["price"]),
            "durationDays": r["duration_days"],
            "features": r["features"],
            "chatQuestionLimit": r["chat_question_limit"],
        }
        for r in rows
    ]


def _ensure_expiry(cur, login: str, current_tariff_id, tariff_status, tariff_expires_at) -> str:
    """При истечении срока помечает подписку expired. Возвращает актуальный статус."""
    if (
        tariff_status == "active"
        and tariff_expires_at is not None
        and tariff_expires_at < datetime.utcnow()
    ):
        cur.execute(
            "UPDATE users SET tariff_status = 'expired' WHERE login = %s",
            (login,),
        )
        return "expired"
    return tariff_status


def _ensure_chat_period(cur, login: str, questions_limit: int) -> Dict[str, Any]:
    """Возвращает текущий расчётный период AI-чата, создавая новый при истечении предыдущего."""
    cur.execute(
        "SELECT id, period_start, period_end, questions_used, questions_limit "
        "FROM chat_usage WHERE user_login = %s ORDER BY period_start DESC LIMIT 1",
        (login,),
    )
    row = cur.fetchone()
    now = datetime.utcnow()
    if not row or row[2] < now:
        period_start = now
        period_end = now + timedelta(days=CHAT_PERIOD_DAYS)
        cur.execute(
            "INSERT INTO chat_usage (user_login, period_start, period_end, questions_used, "
            "questions_limit) VALUES (%s, %s, %s, 0, %s) RETURNING id, period_start, period_end, "
            "questions_used, questions_limit",
            (login, period_start, period_end, questions_limit),
        )
        row = cur.fetchone()
    return {
        "periodStart": row[1].isoformat(),
        "periodEnd": row[2].isoformat(),
        "questionsUsed": row[3],
        "questionsLimit": row[4],
    }


def _handle_me(dsn: str, login: str) -> Dict[str, Any]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT current_tariff_id, tariff_started_at, tariff_expires_at, tariff_status "
                "FROM users WHERE login = %s",
                (login,),
            )
            row = cur.fetchone()
            if not row:
                conn.commit()
                return _resp(404, {"error": "Пользователь не найден"})

            tariff_id, started_at, expires_at, status = row
            status = _ensure_expiry(cur, login, tariff_id, status, expires_at)

            chat_info = None
            if tariff_id == "sub_12m" and status == "active":
                cur.execute("SELECT chat_question_limit FROM tariffs WHERE id = %s", (tariff_id,))
                limit_row = cur.fetchone()
                limit = limit_row[0] if limit_row and limit_row[0] else 15
                chat_info = _ensure_chat_period(cur, login, limit)
        conn.commit()
    finally:
        conn.close()

    return _resp(200, {
        "ok": True,
        "tariffId": tariff_id,
        "tariffStartedAt": started_at.isoformat() if started_at else None,
        "tariffExpiresAt": expires_at.isoformat() if expires_at else None,
        "tariffStatus": status,
        "chatUsage": chat_info,
    })


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


def _handle_create_payment(dsn: str, login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    tariff_id = body.get("tariffId", "")
    return_url = body.get("returnUrl") or "https://poehali.dev"

    if tariff_id not in SUBSCRIPTION_TARIFF_IDS:
        return _resp(400, {"error": "Оплата через этот метод доступна только для подписок"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT name, price FROM tariffs WHERE id = %s AND is_active = true",
                (tariff_id,),
            )
            tariff = cur.fetchone()
    finally:
        conn.close()

    if not tariff:
        return _resp(404, {"error": "Тариф не найден"})

    name, price = tariff
    price_str = f"{price:.2f}"

    try:
        payment = _yookassa_request(
            "POST",
            "/payments",
            {
                "amount": {"value": price_str, "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "capture": True,
                "description": f"Подписка «{name}» — ЛабГид",
                "metadata": {"login": login, "tariffId": tariff_id},
            },
            idempotence_key=str(uuid.uuid4()),
        )
    except Exception:
        return _resp(502, {"error": "Не удалось создать платёж, попробуйте ещё раз"})

    payment_id = payment.get("id")
    confirmation_url = (payment.get("confirmation") or {}).get("confirmation_url")
    if not payment_id or not confirmation_url:
        return _resp(502, {"error": "Платёжная система вернула некорректный ответ"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO pending_subscriptions (payment_id, login, tariff_id, amount, status) "
                "VALUES (%s, %s, %s, %s, 'pending')",
                (payment_id, login, tariff_id, price_str),
            )
        conn.commit()
    finally:
        conn.close()

    return _resp(200, {
        "ok": True,
        "paymentId": payment_id,
        "confirmationUrl": confirmation_url,
        "amount": price_str,
    })


def _handle_check_payment(dsn: str, login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    payment_id = body.get("paymentId", "")
    if not payment_id:
        return _resp(400, {"error": "Не указан идентификатор платежа"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT login, tariff_id, status FROM pending_subscriptions WHERE payment_id = %s",
                (payment_id,),
            )
            pending = cur.fetchone()
    finally:
        conn.close()

    if not pending:
        return _resp(404, {"error": "Платёж не найден"})

    p_login, tariff_id, p_status = pending
    if p_login != login:
        return _resp(403, {"error": "Нет доступа к этому платежу"})

    if p_status == "done":
        return _resp(200, {"ok": True, "status": "done", "tariffId": tariff_id})
    if p_status == "canceled":
        return _resp(200, {"ok": True, "status": "canceled"})

    try:
        payment = _yookassa_request("GET", f"/payments/{payment_id}")
    except Exception:
        return _resp(502, {"error": "Не удалось проверить статус оплаты"})

    yk_status = payment.get("status")

    if yk_status == "succeeded":
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT duration_days, chat_question_limit FROM tariffs WHERE id = %s",
                    (tariff_id,),
                )
                duration_days, chat_limit = cur.fetchone()
                now = datetime.utcnow()
                expires_at = now + timedelta(days=duration_days) if duration_days else None

                cur.execute(
                    "UPDATE users SET current_tariff_id = %s, tariff_started_at = %s, "
                    "tariff_expires_at = %s, tariff_status = 'active' WHERE login = %s",
                    (tariff_id, now, expires_at, login),
                )

                if tariff_id == "sub_12m" and chat_limit:
                    cur.execute(
                        "INSERT INTO chat_usage (user_login, period_start, period_end, "
                        "questions_used, questions_limit) VALUES (%s, %s, %s, 0, %s)",
                        (login, now, now + timedelta(days=CHAT_PERIOD_DAYS), chat_limit),
                    )

                cur.execute(
                    "UPDATE pending_subscriptions SET status = 'done' WHERE payment_id = %s",
                    (payment_id,),
                )
            conn.commit()
        finally:
            conn.close()

        return _resp(200, {"ok": True, "status": "done", "tariffId": tariff_id})

    if yk_status == "canceled":
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE pending_subscriptions SET status = 'canceled' WHERE payment_id = %s",
                    (payment_id,),
                )
            conn.commit()
        finally:
            conn.close()
        return _resp(200, {"ok": True, "status": "canceled"})

    return _resp(200, {"ok": True, "status": "pending"})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: управляет тарифами ЛабГид (разовая оплата, подписки 3 и 12 месяцев).
    resource=list — публичный список активных тарифов; resource=me — текущий тариф
    пользователя и статус лимита AI-чата (требует авторизации). action=create_payment
    создаёт платёж ЮKassa на подписку; action=check_payment проверяет оплату и при
    успехе активирует тариф пользователю (для sub_12m создаёт первый период AI-чата).
    Args: event с httpMethod, queryStringParameters {resource, action}, headers.X-Authorization,
          body {tariffId, returnUrl} для create_payment, body {paymentId} для check_payment
    Returns: HTTP-ответ со списком тарифов, статусом подписки или ссылкой на оплату
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}

    if method == "GET" and params.get("resource") == "list":
        return _resp(200, {"ok": True, "items": _list_tariffs(dsn)})

    login = _get_login(event)

    if method == "GET" and params.get("resource") == "me":
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})
        return _handle_me(dsn, login)

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})

        action = params.get("action", "")
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})

        if action == "create_payment":
            return _handle_create_payment(dsn, login, body)
        if action == "check_payment":
            return _handle_check_payment(dsn, login, body)
        return _resp(400, {"error": "Неизвестное действие"})

    return _resp(405, {"error": "Метод не поддерживается"})
