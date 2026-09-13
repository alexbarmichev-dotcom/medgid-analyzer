import json
import os
import hmac
import hashlib
import base64
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import psycopg2
import psycopg2.extras

POLZA_URL = "https://polza.ai/api/v1/chat/completions"
POLZA_MODEL = "anthropic/claude-sonnet-5"
CHAT_PERIOD_DAYS = 30
CHAT_TARIFF_ID = "sub_12m"
MAX_QUESTION_LEN = 2000

SYSTEM_PROMPT = (
    "Ответь на вопрос по теме разбора анализов клиента. Отвечай как опытный врач, но без "
    "диагнозов. Отвечай вежливо, доброжелательно. Если вопрос не связан с разбором анализов "
    "клиента или медицинской темой в целом — вежливо попроси переформулировать вопрос по теме "
    "анализов."
)


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


def _check_subscription(cur, login: str) -> Optional[str]:
    """Возвращает текст ошибки, если подписка sub_12m неактивна, иначе None."""
    cur.execute(
        "SELECT current_tariff_id, tariff_status, tariff_expires_at FROM users WHERE login = %s",
        (login,),
    )
    row = cur.fetchone()
    if not row:
        return "Пользователь не найден"
    tariff_id, status, expires_at = row
    if tariff_id != CHAT_TARIFF_ID or status != "active":
        return "AI-чат доступен только по подписке «12 месяцев»"
    if expires_at and expires_at < datetime.utcnow():
        return "Срок подписки истёк"
    return None


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
        "id": row[0],
        "periodStart": row[1],
        "periodEnd": row[2],
        "questionsUsed": row[3],
        "questionsLimit": row[4],
    }


def _handle_status(dsn: str, login: str) -> Dict[str, Any]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            error = _check_subscription(cur, login)
            if error:
                conn.commit()
                return _resp(403, {"error": error})

            cur.execute("SELECT chat_question_limit FROM tariffs WHERE id = %s", (CHAT_TARIFF_ID,))
            limit_row = cur.fetchone()
            limit = limit_row[0] if limit_row and limit_row[0] else 15
            usage = _ensure_chat_period(cur, login, limit)
        conn.commit()

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT role, content, created_at FROM chat_messages "
                "WHERE user_login = %s AND created_at >= %s ORDER BY created_at ASC",
                (login, usage["periodStart"]),
            )
            messages = [
                {"role": r["role"], "content": r["content"], "date": r["created_at"].isoformat()}
                for r in cur.fetchall()
            ]
    finally:
        conn.close()

    return _resp(200, {
        "ok": True,
        "questionsUsed": usage["questionsUsed"],
        "questionsLimit": usage["questionsLimit"],
        "periodEnd": usage["periodEnd"].isoformat(),
        "messages": messages,
    })


def _latest_analysis_context(cur, login: str) -> str:
    cur.execute(
        "SELECT gender, age, complaints, conditions, meds, ai_result FROM analyses "
        "WHERE login = %s AND ai_result IS NOT NULL ORDER BY created_at DESC LIMIT 1",
        (login,),
    )
    row = cur.fetchone()
    if not row:
        return "У клиента пока нет сохранённых разборов анализов."
    gender, age, complaints, conditions, meds, ai_result = row
    lines = [
        f"Пол: {'мужской' if gender == 'm' else 'женский' if gender == 'f' else 'не указан'}",
        f"Возраст: {age or 'не указан'}",
    ]
    if complaints:
        lines.append(f"Жалобы: {complaints}")
    if conditions:
        lines.append(f"Сопутствующие заболевания: {conditions}")
    if meds:
        lines.append(f"Приём лекарств: {meds}")
    lines.append("Разбор анализов нейросетью:\n" + (ai_result or ""))
    return "\n".join(lines)


def _call_ai(context: str, history: list, question: str) -> str:
    api_key = os.environ["POLZA_AI_API_KEY"]

    messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n\nДанные клиента:\n" + context}]
    for m in history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": question})

    payload = {"model": POLZA_MODEL, "messages": messages, "max_tokens": 1500}
    req = urllib.request.Request(
        POLZA_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        data = json.loads(res.read().decode())
    return data["choices"][0]["message"]["content"]


def _handle_ask(dsn: str, login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    question = (body.get("question") or "").strip()
    if not question:
        return _resp(400, {"error": "Введите вопрос"})
    if len(question) > MAX_QUESTION_LEN:
        return _resp(400, {"error": "Слишком длинный вопрос"})

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            error = _check_subscription(cur, login)
            if error:
                conn.commit()
                return _resp(403, {"error": error})

            cur.execute("SELECT chat_question_limit FROM tariffs WHERE id = %s", (CHAT_TARIFF_ID,))
            limit_row = cur.fetchone()
            limit = limit_row[0] if limit_row and limit_row[0] else 15
            usage = _ensure_chat_period(cur, login, limit)

            if usage["questionsUsed"] >= usage["questionsLimit"]:
                conn.commit()
                return _resp(429, {
                    "error": f"Лимит {usage['questionsLimit']} вопросов в этом периоде исчерпан",
                })

            context = _latest_analysis_context(cur, login)
        conn.commit()

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT role, content FROM chat_messages WHERE user_login = %s "
                "AND created_at >= %s ORDER BY created_at ASC",
                (login, usage["periodStart"]),
            )
            history = [{"role": r["role"], "content": r["content"]} for r in cur.fetchall()]

        try:
            answer = _call_ai(context, history, question)
        except urllib.error.HTTPError as e:
            return _resp(502, {"error": f"Ошибка нейросети: {e.code}"})
        except Exception:
            return _resp(502, {"error": "Не удалось получить ответ, попробуйте ещё раз"})

        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_messages (user_login, role, content) VALUES (%s, 'user', %s)",
                (login, question),
            )
            cur.execute(
                "INSERT INTO chat_messages (user_login, role, content) VALUES (%s, 'assistant', %s)",
                (login, answer),
            )
            cur.execute(
                "UPDATE chat_usage SET questions_used = questions_used + 1 WHERE id = %s",
                (usage["id"],),
            )
        conn.commit()
    finally:
        conn.close()

    return _resp(200, {
        "ok": True,
        "answer": answer,
        "questionsUsed": usage["questionsUsed"] + 1,
        "questionsLimit": usage["questionsLimit"],
    })


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: AI-чат по разбору анализов для подписчиков тарифа «12 месяцев».
    resource=status — текущий лимит вопросов, период и история сообщений.
    action=ask — задать вопрос нейросети (Claude Sonnet через Polza AI) в контексте
    последнего разбора анализов клиента; ведёт счётчик из 15 вопросов в месяц,
    сбрасывающийся каждые 30 дней с момента активации подписки.
    Args: event с httpMethod, queryStringParameters {resource|action}, headers.X-Authorization,
          body {question} для action=ask
    Returns: HTTP-ответ с ответом нейросети либо статусом использования чата
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    dsn = os.environ["DATABASE_URL"]
    login = _get_login(event)
    if not login:
        return _resp(401, {"error": "Требуется вход в личный кабинет"})

    params = event.get("queryStringParameters") or {}

    if method == "GET" and params.get("resource") == "status":
        return _handle_status(dsn, login)

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})

        if params.get("action") == "ask":
            return _handle_ask(dsn, login, body)
        return _resp(400, {"error": "Неизвестное действие"})

    return _resp(405, {"error": "Метод не поддерживается"})
