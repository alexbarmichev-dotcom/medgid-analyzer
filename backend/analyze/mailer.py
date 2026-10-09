import html
import os
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from typing import Optional

import psycopg2

SMTP_HOST = "smtp.mail.ru"
SMTP_PORT = 465

REASONS = {
    "failed": "загрузка файлов прервалась",
    "canceled": "оплата не прошла",
}


def _send(to: str, subject: str, html_body: str) -> bool:
    smtp_login = os.environ.get("MAILRU_SMTP_LOGIN")
    smtp_password = os.environ.get("MAILRU_SMTP_PASSWORD")
    if not smtp_login or not smtp_password:
        return False
    msg = MIMEText(html_body, "html", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = smtp_login
    msg["To"] = to
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.login(smtp_login, smtp_password)
            server.sendmail(smtp_login, [to], msg.as_string())
        return True
    except Exception as e:
        print(f"notify email failed: {e}")
        return False


def _resolve_email(cur, email: Optional[str], login: str) -> Optional[str]:
    if email:
        return email
    if "@" in login and not login.startswith(("guest:", "acct:")):
        return login
    return None


def _build_html(reason: str, link: str) -> str:
    safe_link = html.escape(link, quote=True)
    return (
        "<div style='font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;"
        "max-width:520px'>"
        "<h2 style='margin:0 0 12px'>Ваш анализ не дошёл до расшифровки</h2>"
        f"<p>К сожалению, {html.escape(reason)}. Чтобы не хранить ваши медицинские данные зря, "
        "мы удалили загруженные файлы.</p>"
        "<p>Анкету (пол, возраст, жалобы) мы сохранили — останется только заново прикрепить "
        "фото или сканы анализов.</p>"
        f"<p style='margin:24px 0'><a href='{safe_link}' style='display:inline-block;"
        "background:#2f7d6d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;"
        "font-weight:bold'>Загрузить анализ заново</a></p>"
        "<p style='font-size:13px;color:#777'>Если кнопка не открывается, скопируйте ссылку: "
        f"<br>{safe_link}</p>"
        "<p style='font-size:13px;color:#777'>Если вы уже получили расшифровку или передумали — "
        "просто проигнорируйте это письмо.</p>"
        "</div>"
    )


def notify_failed(session_id: str, status: str) -> None:
    """Однократно отправляет клиенту письмо со ссылкой для повторной загрузки."""
    reason = REASONS.get(status)
    if not reason:
        return
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET notified_at = now() "
                "WHERE id = %s AND notified_at IS NULL "
                "RETURNING login, email, site_url",
                (session_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.commit()
                return
            login, email, site_url = row
            to = _resolve_email(cur, email, login)
            if not to or not site_url:
                cur.execute("UPDATE upload_sessions SET notified_at = NULL WHERE id = %s",
                            (session_id,))
                conn.commit()
                return
        conn.commit()
    finally:
        conn.close()

    base = site_url.rstrip("/")
    link = f"{base}/?resume={session_id}#start"
    _send(to, "ЛабГид — загрузите анализ ещё раз", _build_html(reason, link))
