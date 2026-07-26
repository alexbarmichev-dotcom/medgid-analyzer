import json
import os
import time
import hmac
import hashlib
import base64
import random
import re
import urllib.request
import urllib.parse
from typing import Dict, Any

# Простое in-memory хранилище кодов (живёт в рамках тёплого контейнера функции)
_CODES: Dict[str, Dict[str, Any]] = {}

CODE_TTL = 300          # код действителен 5 минут
RESEND_COOLDOWN = 60    # не чаще одного кода в минуту
MAX_ATTEMPTS = 5        # попыток ввода кода


def _norm_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    if len(digits) == 10:
        digits = "7" + digits
    return digits


def _sign_token(phone: str, secret: str) -> str:
    payload = {"phone": phone, "iat": int(time.time())}
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{body}.{sig}"


def _send_sms(phone: str, code: str) -> Dict[str, Any]:
    """Отправка SMS через sms.ru. Возвращает {ok, error}."""
    api_id = os.environ.get("SMSRU_API_ID")
    if not api_id:
        return {"ok": False, "error": "no_api_key"}
    try:
        params = urllib.parse.urlencode({
            "api_id": api_id,
            "to": phone,
            "msg": f"MedGid: kod dlya vhoda {code}",
            "json": 1,
        })
        url = "https://sms.ru/sms/send?" + params
        with urllib.request.urlopen(url, timeout=10) as resp:
            raw = resp.read().decode()
            data = json.loads(raw)
            print(f"sms.ru response: {raw}")

            if data.get("status") != "OK":
                return {
                    "ok": False,
                    "error": f"{data.get('status_code')} {data.get('status_text', '')}".strip(),
                }

            sms_info = ((data.get("sms") or {}).get(phone)) or {}
            if sms_info.get("status") != "OK":
                return {
                    "ok": False,
                    "error": f"{sms_info.get('status_code')} {sms_info.get('status_text', '')}".strip(),
                }

            return {"ok": True, "error": None}
    except Exception as e:
        print(f"sms.ru send exception: {e}")
        return {"ok": False, "error": str(e)}


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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: SMS-авторизация по телефону для входа в личный кабинет МедГид.
    Args: event с httpMethod, body {action: 'request'|'verify', phone, code}
    Returns: HTTP-ответ с результатом отправки кода или токеном сессии
    """
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    action = body.get("action")
    phone = _norm_phone(body.get("phone", ""))
    secret = os.environ.get("AUTH_SECRET", "medgid-dev-secret")
    dev_mode = not os.environ.get("SMSRU_API_ID")

    if len(phone) != 11:
        return _resp(400, {"error": "Введите корректный номер телефона"})

    now = int(time.time())

    if action == "request":
        existing = _CODES.get(phone)
        if existing and now - existing["sent_at"] < RESEND_COOLDOWN:
            wait = RESEND_COOLDOWN - (now - existing["sent_at"])
            return _resp(429, {"error": f"Запросить новый код можно через {wait} с"})

        code = f"{random.randint(0, 9999):04d}"
        _CODES[phone] = {"code": code, "sent_at": now, "attempts": 0}

        sms_result = _send_sms(phone, code)

        if not dev_mode and not sms_result["ok"]:
            # Провайдер настроен, но отправка не удалась — сообщаем честно,
            # но код всё равно оставляем активным, чтобы можно было запросить заново.
            return _resp(502, {"error": f"Не удалось отправить SMS: {sms_result['error']}"})

        out: Dict[str, Any] = {"ok": True, "message": "Код отправлен на ваш номер"}
        if dev_mode:
            # Без подключённого SMS-провайдера показываем код прямо в ответе,
            # чтобы вход работал в тестовом режиме.
            out["dev_code"] = code
        return _resp(200, out)

    if action == "verify":
        code = re.sub(r"\D", "", body.get("code", ""))
        rec = _CODES.get(phone)
        if not rec:
            return _resp(400, {"error": "Сначала запросите код"})
        if now - rec["sent_at"] > CODE_TTL:
            _CODES.pop(phone, None)
            return _resp(400, {"error": "Код истёк, запросите новый"})
        if rec["attempts"] >= MAX_ATTEMPTS:
            _CODES.pop(phone, None)
            return _resp(429, {"error": "Слишком много попыток, запросите новый код"})

        rec["attempts"] += 1
        if code != rec["code"]:
            left = MAX_ATTEMPTS - rec["attempts"]
            return _resp(400, {"error": f"Неверный код. Осталось попыток: {max(left, 0)}"})

        _CODES.pop(phone, None)
        token = _sign_token(phone, secret)
        return _resp(200, {"ok": True, "token": token, "phone": phone})

    return _resp(400, {"error": "Неизвестное действие"})