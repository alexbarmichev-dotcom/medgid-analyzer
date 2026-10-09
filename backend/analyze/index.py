import json
import os
import re
import hmac
import hashlib
import base64
import uuid
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.header import Header
from typing import Dict, Any, List, Optional

import psycopg2

import uploads

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

POLZA_URL = "https://polza.ai/api/v1/chat/completions"
POLZA_MODEL = "anthropic/claude-sonnet-5"

YOOKASSA_API = "https://api.yookassa.ru/v3"
PRICE_RUB = "150.00"

SMTP_HOST = "smtp.mail.ru"
SMTP_PORT = 465

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
                    payment_id: Optional[str], payment_status: str, amount: str,
                    email: Optional[str] = None) -> int:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO analyses (login, gender, age, complaints, conditions, meds, "
                "file_urls, ai_result, status, payment_id, payment_status, amount, email) VALUES ("
                "%s, %s, %s, %s, %s, %s, %s::jsonb, %s, 'done', %s, %s, %s, %s) RETURNING id",
                (
                    login, gender, age, complaints, conditions, meds,
                    json.dumps(file_urls), ai_result, payment_id, payment_status, amount, email,
                ),
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        return new_id
    finally:
        conn.close()


def _send_result_email(email: str, ai_result: str) -> None:
    smtp_login = os.environ.get("MAILRU_SMTP_LOGIN")
    smtp_password = os.environ.get("MAILRU_SMTP_PASSWORD")
    if not smtp_login or not smtp_password:
        return

    html = (
        "<h2>Ваша расшифровка анализа готова</h2>"
        "<p>Результат также доступен в личном кабинете ЛабГид.</p>"
        f"<div style='white-space:pre-wrap'>{ai_result[:5000]}</div>"
    )
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = Header("ЛабГид — расшифровка анализа готова", "utf-8")
    msg["From"] = smtp_login
    msg["To"] = email

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.login(smtp_login, smtp_password)
            server.sendmail(smtp_login, [email], msg.as_string())
    except Exception:
        pass


def _is_user_free(dsn: str, login: str) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT is_free FROM users WHERE login = %s", (login,))
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
        "description": "Разбор анализа — ЛабГид",
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
                "UPDATE pending_analyses SET status = %s WHERE payment_id = %s",
                (status, payment_id),
            )
        conn.commit()
    finally:
        conn.close()


def _mark_one_time_used(dsn: str, login: str) -> None:
    """Фиксирует тариф 'Разовая оплата' как использованный, не трогая активную подписку."""
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT current_tariff_id, tariff_status FROM users WHERE login = %s",
                (login,),
            )
            row = cur.fetchone()
            if row and row[0] in ("sub_3m", "sub_12m") and row[1] == "active":
                return
            cur.execute(
                "UPDATE users SET current_tariff_id = 'one_time', tariff_started_at = now(), "
                "tariff_expires_at = NULL, tariff_status = 'one_time_used' WHERE login = %s",
                (login,),
            )
        conn.commit()
    finally:
        conn.close()


def _load_ready_session(login: str, body: Dict[str, Any]):
    session_id = str(body.get("sessionId") or "")
    if not session_id:
        return None, _resp(400, {"error": "Сначала загрузите файлы анализа"})
    session = uploads.get_session(session_id, login)
    if not session:
        return None, _resp(404, {"error": "Загрузка не найдена"})
    if session["status"] not in ("ready", "awaiting_payment"):
        return None, _resp(409, {
            "error": "Файлы этой загрузки недоступны — загрузите анализ заново",
            "code": "reupload_required",
        })
    if len(session["files"]) != session["file_count"]:
        uploads.fail_session(session, "failed", "Загрузились не все файлы — файлы удалены",
                             notify=True)
        return None, _resp(409, {
            "error": "Загрузились не все файлы. Мы удалили их — загрузите анализ заново",
            "code": "reupload_required",
        })
    return session, None


def _handle_create_payment(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    session, err = _load_ready_session(login, body)
    if err:
        return err
    gender = session["gender"] or ""
    age = session["age"]
    complaints = session["complaints"] or ""
    conditions = session["conditions"] or ""
    meds = session["meds"] or ""
    email = session["email"]
    uploaded = uploads.session_files_for_ai(session)
    return_url = body.get("returnUrl") or "https://poehali.dev"

    if session["status"] == "awaiting_payment" and session["payment_id"]:
        try:
            old = _get_payment(session["payment_id"])
        except Exception:
            old = {}
        if old.get("status") in ("succeeded", "waiting_for_capture"):
            return _resp(200, {"ok": True, "paymentId": session["payment_id"], "alreadyPaid": True})

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
            cur.execute(
                "INSERT INTO pending_analyses (payment_id, login, gender, age, complaints, "
                "conditions, meds, files, amount, status, email, session_id) VALUES "
                "(%s, %s, %s, %s, %s, %s, %s::jsonb, %s, 'pending', %s, %s)",
                (
                    payment_id, login, gender, age, complaints, conditions,
                    meds, json.dumps(uploaded), PRICE_RUB, email, session["id"],
                ),
            )
        conn.commit()
    finally:
        conn.close()

    uploads.set_status(session["id"], "awaiting_payment", payment_id=payment_id)

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
                "SELECT id, ai_result FROM analyses WHERE payment_id = %s AND login = %s",
                (payment_id, login),
            )
            done_row = cur.fetchone()
            if done_row:
                return _resp(200, {"ok": True, "status": "done", "id": done_row[0], "result": done_row[1]})

            cur.execute(
                "SELECT login, gender, age, complaints, conditions, meds, files, status, email, "
                "session_id FROM pending_analyses WHERE payment_id = %s",
                (payment_id,),
            )
            pending = cur.fetchone()
    finally:
        conn.close()

    if not pending:
        return _resp(404, {"error": "Платёж не найден"})

    (p_login, gender, age, complaints, conditions, meds, files_json, p_status, email,
     session_id) = pending
    if p_login != login:
        return _resp(403, {"error": "Нет доступа к этому платежу"})

    if p_status == "canceled":
        return _resp(200, {"ok": True, "status": "canceled", "code": "reupload_required"})

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
            [f["url"] for f in uploaded], ai_result, payment_id, "paid", PRICE_RUB, email,
        )
        _mark_pending(dsn, payment_id, "done")
        if session_id:
            uploads.set_status(session_id, "done")
        _mark_one_time_used(dsn, login)
        if email:
            _send_result_email(email, ai_result)
        return _resp(200, {"ok": True, "status": "done", "id": analysis_id, "result": ai_result})

    if yk_status == "canceled":
        _mark_pending(dsn, payment_id, "canceled")
        if session_id:
            session = uploads.get_session(session_id, login)
            if session:
                uploads.fail_session(session, "canceled",
                                     "Оплата не прошла — файлы удалены, загрузите анализ заново",
                                     notify=True)
        return _resp(200, {"ok": True, "status": "canceled", "code": "reupload_required"})

    return _resp(200, {"ok": True, "status": "pending"})


def _handle_free_analysis(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    dsn = os.environ["DATABASE_URL"]
    if not _is_user_free(dsn, login):
        return _resp(403, {"error": "Бесплатный доступ недоступен для этого аккаунта"})

    session, err = _load_ready_session(login, body)
    if err:
        return err
    gender = session["gender"] or ""
    age = session["age"]
    age_raw = str(age or "")
    complaints = session["complaints"] or ""
    conditions = session["conditions"] or ""
    meds = session["meds"] or ""
    email = session["email"]
    uploaded = uploads.session_files_for_ai(session)

    try:
        ai_result = _call_ai(uploaded, gender, age_raw, complaints, conditions, meds)
    except urllib.error.HTTPError as e:
        return _resp(502, {"error": f"Ошибка нейросети: {e.code}"})
    except Exception:
        return _resp(502, {"error": "Не удалось получить расшифровку, попробуйте ещё раз"})

    try:
        analysis_id = _save_analysis(
            dsn, login, gender, age, complaints, conditions, meds,
            [f["url"] for f in uploaded], ai_result, None, "free", "0.00", email,
        )
    except Exception:
        analysis_id = None

    uploads.set_status(session["id"], "done")

    if email:
        _send_result_email(email, ai_result)

    return _resp(200, {"ok": True, "id": analysis_id, "result": ai_result})


def _handle_upload_start(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    email = (body.get("email") or "").strip()[:255] or None
    if email and not EMAIL_RE.match(email):
        return _resp(400, {"error": "Введите корректный email"})
    body["email"] = email
    try:
        session_id, info = uploads.start_session(login, body)
    except uploads.UploadError as e:
        return _resp(400, {"error": str(e), "code": e.code})
    return _resp(200, {"ok": True, "sessionId": session_id, **info})


def _handle_upload_chunk(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    session = uploads.get_session(str(body.get("sessionId") or ""), login)
    if not session:
        return _resp(404, {"error": "Загрузка не найдена", "code": "reupload_required"})
    try:
        result = uploads.upload_chunk(session, body)
    except uploads.UploadError as e:
        if e.code == "session_closed":
            return _resp(409, {"error": str(e), "code": "reupload_required"})
        fresh = uploads.get_session(session["id"], login) or session
        uploads.fail_session(fresh, "failed", f"{e} — файлы удалены, загрузите анализ заново",
                             notify=True)
        return _resp(400, {"error": f"{e}. Загруженные файлы удалены — повторите загрузку",
                           "code": "reupload_required"})
    except Exception as e:
        print(f"upload_chunk failed: {type(e).__name__}: {e}")
        fresh = uploads.get_session(session["id"], login) or session
        uploads.fail_session(fresh, "failed", "Сбой загрузки — файлы удалены, загрузите анализ заново",
                             notify=True)
        return _resp(502, {"error": "Не удалось загрузить файл. Загруженные файлы удалены — "
                                    "повторите загрузку", "code": "reupload_required"})
    return _resp(200, {"ok": True, **result})


def _handle_upload_abort(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    session = uploads.get_session(str(body.get("sessionId") or ""), login)
    if not session:
        return _resp(200, {"ok": True})
    if session["status"] in ("uploading", "ready", "failed", "canceled"):
        uploads.fail_session(session, "failed",
                             str(body.get("reason") or "Загрузка прервана — файлы удалены")[:200],
                             notify=bool(body.get("notify")))
    return _resp(200, {"ok": True})


def _refresh_awaiting(login: str, items: List[Dict[str, Any]]) -> bool:
    """Сверяет с ЮKassa заказы, ожидающие оплаты; отменённые — очищает."""
    changed = False
    for item in [i for i in items if i["status"] == "awaiting_payment" and i["paymentId"]][:5]:
        try:
            yk_status = _get_payment(item["paymentId"]).get("status")
        except Exception:
            continue
        if yk_status == "canceled":
            _mark_pending(os.environ["DATABASE_URL"], item["paymentId"], "canceled")
            session = uploads.get_session(item["id"], login)
            if session:
                uploads.fail_session(session, "canceled",
                                     "Оплата не прошла — файлы удалены, загрузите анализ заново",
                                     notify=True)
            changed = True
    return changed


def _handle_incomplete(login: str) -> Dict[str, Any]:
    items = uploads.list_incomplete(login)
    if _refresh_awaiting(login, items):
        items = uploads.list_incomplete(login)
    return _resp(200, {"ok": True, "items": items})


def _handle_resume(body: Dict[str, Any]) -> Dict[str, Any]:
    data = uploads.get_resume_data(str(body.get("sessionId") or "")[:36])
    if not data or data["status"] not in ("failed", "canceled"):
        return _resp(404, {"error": "Ссылка устарела — заполните анкету заново"})
    data.pop("status")
    return _resp(200, {"ok": True, **data})


def _handle_dismiss(login: str, body: Dict[str, Any]) -> Dict[str, Any]:
    session = uploads.get_session(str(body.get("sessionId") or ""), login)
    if not session:
        return _resp(200, {"ok": True})
    if session["status"] == "awaiting_payment":
        return _resp(409, {"error": "Заказ ожидает подтверждения оплаты — его нельзя удалить"})
    uploads.fail_session(session, "dismissed", "Удалено пользователем")
    return _resp(200, {"ok": True})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: обрабатывает платный разбор анализов личного кабинета ЛабГид через ЮKassa
    (тариф «Разовая оплата», 299 руб). Поддерживает три действия (?action=): create_payment —
    создаёт платёж и сохраняет заявку на разбор; check_payment — проверяет статус оплаты, при успехе
    запускает ИИ-расшифровку (Claude через Polza AI) и сохраняет результат; free — прямой
    бесплатный разбор для аккаунтов с флагом is_free (минуя оплату).
    Загрузка файлов идёт по частям: upload_start (проверка лимита 12 файлов / 50 МБ),
    upload_chunk (часть файла до 2 МБ), upload_abort (удаление файлов при ошибке), incomplete
    (незавершённые заказы для кабинета), dismiss (удалить незавершённый заказ).
    Args: event с httpMethod, queryStringParameters.action, headers.X-Authorization (токен
          логина), body {sessionId, returnUrl} для create_payment/free, body {paymentId} для
          check_payment
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

    secret = os.environ.get("AUTH_SECRET")
    login = _verify_token(token, secret) if token and secret else None

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    if action == "resume":
        return _handle_resume(body)

    upload_actions = {
        "upload_start": lambda: _handle_upload_start(login, body),
        "upload_chunk": lambda: _handle_upload_chunk(login, body),
        "upload_abort": lambda: _handle_upload_abort(login, body),
        "incomplete": lambda: _handle_incomplete(login),
        "dismiss": lambda: _handle_dismiss(login, body),
    }
    if action in upload_actions:
        if not login:
            return _resp(401, {"error": "Требуется вход в личный кабинет"})
        return upload_actions[action]()

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