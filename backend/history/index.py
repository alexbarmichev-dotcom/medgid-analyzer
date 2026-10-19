import json
import os
import re
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
# security review: fallback auth secret removed


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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

    secret = os.environ.get("AUTH_SECRET")
    login = _verify_token(token, secret) if token and secret else None
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


MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024  # 5 МБ
ALLOWED_SCREENSHOT_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif"}


class UploadValidationError(Exception):
    pass


def _upload_screenshot(data_b64: str, mime: str) -> str:
    mime = (mime or "").split(";")[0].strip().lower()
    if mime not in ALLOWED_SCREENSHOT_MIME:
        raise UploadValidationError("Недопустимый тип файла")
    try:
        raw = base64.b64decode(data_b64, validate=True)
    except Exception:
        raise UploadValidationError("Не удалось прочитать файл")
    if not raw:
        raise UploadValidationError("Пустой файл")
    if len(raw) > MAX_SCREENSHOT_BYTES:
        raise UploadValidationError("Файл больше 5 МБ")

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    ext = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif"}[mime]
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


ALLOWED_REVIEW_STATUSES = {"pending", "approved", "rejected"}


def _list_reviews(dsn: str, status: Optional[str]) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if status and status in ALLOWED_REVIEW_STATUSES:
                cur.execute(
                    "SELECT id, author, role, rating, text, status, created_at "
                    "FROM reviews WHERE status = %s ORDER BY created_at DESC",
                    (status,),
                )
            else:
                cur.execute(
                    "SELECT id, author, role, rating, text, status, created_at "
                    "FROM reviews ORDER BY created_at DESC"
                )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {
            "id": r["id"],
            "author": r["author"],
            "role": r["role"],
            "rating": r["rating"],
            "text": r["text"],
            "status": r["status"],
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


def _create_review(dsn: str, author: str, role: str, rating: int, text: str) -> int:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO reviews (author, role, rating, text, status) "
                "VALUES (%s, %s, %s, %s, 'pending') RETURNING id",
                (author, role, rating, text),
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        return new_id
    finally:
        conn.close()


def _update_review_status(dsn: str, item_id: int, status: str) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE reviews SET status = %s WHERE id = %s",
                (status, item_id),
            )
            updated = cur.rowcount > 0
        conn.commit()
        return updated
    finally:
        conn.close()


def _delete_review(dsn: str, item_id: int) -> bool:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM reviews WHERE id = %s", (item_id,))
            deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    finally:
        conn.close()


def _handle_reviews(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get("httpMethod", "GET")
    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        items = _list_reviews(dsn, "approved")
        return _resp(200, {"ok": True, "items": items})

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})

        author = (body.get("author") or "").strip()
        role = (body.get("role") or "").strip()
        rating = body.get("rating")
        text = (body.get("text") or "").strip()

        if not author:
            return _resp(400, {"error": "Укажите имя"})
        if len(author) > 120:
            return _resp(400, {"error": "Слишком длинное имя"})
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return _resp(400, {"error": "Оценка должна быть от 1 до 5"})
        if len(text) < 20:
            return _resp(400, {"error": "Отзыв должен содержать не менее 20 символов"})
        if len(text) > 2000:
            return _resp(400, {"error": "Слишком длинный текст отзыва"})

        try:
            new_id = _create_review(dsn, author, role or None, rating, text)
        except Exception:
            return _resp(502, {"error": "Не удалось отправить отзыв, попробуйте ещё раз"})

        return _resp(200, {"ok": True, "id": new_id})

    if method == "PATCH":
        if not _check_admin_auth(event):
            return _resp(401, {"error": "Неверный пароль администратора"})
        item_id = params.get("id")
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return _resp(400, {"error": "Некорректный запрос"})
        status = body.get("status", "")
        if not item_id or status not in ALLOWED_REVIEW_STATUSES:
            return _resp(400, {"error": "Некорректные параметры"})
        try:
            updated = _update_review_status(dsn, int(item_id), status)
        except Exception:
            return _resp(502, {"error": "Не удалось обновить статус"})
        if not updated:
            return _resp(404, {"error": "Отзыв не найден"})
        return _resp(200, {"ok": True})

    if method == "DELETE":
        if not _check_admin_auth(event):
            return _resp(401, {"error": "Неверный пароль администратора"})
        item_id = params.get("id")
        if not item_id:
            return _resp(400, {"error": "Не указан id"})
        try:
            deleted = _delete_review(dsn, int(item_id))
        except Exception:
            return _resp(502, {"error": "Не удалось удалить отзыв"})
        if not deleted:
            return _resp(404, {"error": "Отзыв не найден"})
        return _resp(200, {"ok": True})

    return _resp(405, {"error": "Метод не поддерживается"})


def _handle_admin_reviews(event: Dict[str, Any]) -> Dict[str, Any]:
    if not _check_admin_auth(event):
        return _resp(401, {"error": "Неверный пароль администратора"})
    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}
    items = _list_reviews(dsn, params.get("status"))
    return _resp(200, {"ok": True, "items": items})


ARTICLE_STATUSES = {"draft", "published"}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_COVER_BYTES = 5 * 1024 * 1024


def _article_row(r: Dict[str, Any], with_body: bool) -> Dict[str, Any]:
    item = {
        "id": r["id"],
        "slug": r["slug"],
        "title": r["title"],
        "excerpt": r["excerpt"],
        "author": r["author"],
        "cover": r["cover_url"],
        "seoTitle": r["seo_title"],
        "seoDescription": r["seo_description"],
        "status": r["status"],
        "publishedAt": r["published_at"],
        "updatedAt": r["updated_at"],
    }
    if with_body:
        item["body"] = r["body"]
    return item


def _articles_query(dsn: str, where: str, args: tuple) -> List[Dict[str, Any]]:
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, slug, title, excerpt, body, author, cover_url, seo_title, seo_description, "
                "status, published_at, updated_at FROM articles " + where, args
            )
            return list(cur.fetchall())
    finally:
        conn.close()


def _upload_article_cover(body: Dict[str, Any]) -> Dict[str, Any]:
    mime = (body.get("mime") or "").lower()
    data_b64 = body.get("data") or ""
    if mime not in ("image/png", "image/jpeg", "image/webp"):
        return _resp(400, {"error": "Обложка должна быть в формате JPG, PNG или WebP"})
    try:
        raw = base64.b64decode(data_b64, validate=True)
    except Exception:
        return _resp(400, {"error": "Не удалось прочитать файл"})
    if not raw:
        return _resp(400, {"error": "Пустой файл"})
    if len(raw) > MAX_COVER_BYTES:
        return _resp(400, {"error": "Файл больше 5 МБ"})
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    ext = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}[mime]
    key = f"articles/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime)
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return _resp(200, {"ok": True, "url": url})


def _validate_article(body: Dict[str, Any]) -> Any:
    title = (body.get("title") or "").strip()
    slug = (body.get("slug") or "").strip().lower()
    excerpt = (body.get("excerpt") or "").strip()
    text = (body.get("body") or "").strip()
    author = (body.get("author") or "").strip() or "Команда ЛабГид"
    cover = (body.get("cover") or "").strip() or None
    seo_title = (body.get("seoTitle") or "").strip() or None
    seo_description = (body.get("seoDescription") or "").strip() or None
    status = body.get("status") or "draft"
    if not title or len(title) > 300:
        return None, "Укажите заголовок (до 300 символов)"
    if not slug or len(slug) > 160 or not SLUG_RE.match(slug):
        return None, "Адрес статьи: только латинские буквы, цифры и дефисы"
    if not excerpt:
        return None, "Напишите короткое описание для карточки статьи"
    if status not in ARTICLE_STATUSES:
        return None, "Некорректный статус"
    if status == "published" and len(text) < 50:
        return None, "Для публикации напишите текст статьи"
    if cover and not cover.startswith("https://"):
        return None, "Некорректная ссылка на обложку"
    return {
        "title": title, "slug": slug, "excerpt": excerpt, "body": text, "author": author,
        "cover": cover, "seo_title": seo_title, "seo_description": seo_description, "status": status,
    }, None


def _handle_articles(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get("httpMethod", "GET")
    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        if params.get("all"):
            if not _check_admin_auth(event):
                return _resp(401, {"error": "Неверный пароль администратора"})
            rows = _articles_query(dsn, "ORDER BY updated_at DESC", ())
            return _resp(200, {"ok": True, "items": [_article_row(r, True) for r in rows]})
        slug = params.get("slug")
        if slug:
            rows = _articles_query(dsn, "WHERE slug = %s AND status = 'published'", (slug,))
            if not rows:
                return _resp(404, {"error": "Статья не найдена"})
            return _resp(200, {"ok": True, "item": _article_row(rows[0], True)})
        rows = _articles_query(dsn, "WHERE status = 'published' ORDER BY published_at DESC", ())
        return _resp(200, {"ok": True, "items": [_article_row(r, False) for r in rows]})

    if not _check_admin_auth(event):
        return _resp(401, {"error": "Неверный пароль администратора"})

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _resp(400, {"error": "Некорректный запрос"})

    if method == "POST" and params.get("action") == "cover":
        return _upload_article_cover(body)

    if method == "DELETE":
        item_id = params.get("id")
        if not item_id:
            return _resp(400, {"error": "Не указан id"})
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM articles WHERE id = %s", (int(item_id),))
                deleted = cur.rowcount > 0
            conn.commit()
        finally:
            conn.close()
        if not deleted:
            return _resp(404, {"error": "Статья не найдена"})
        return _resp(200, {"ok": True})

    if method in ("POST", "PUT"):
        data, error = _validate_article(body)
        if error:
            return _resp(400, {"error": error})
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                if method == "POST":
                    cur.execute("SELECT 1 FROM articles WHERE slug = %s", (data["slug"],))
                    if cur.fetchone():
                        return _resp(409, {"error": "Статья с таким адресом уже есть, измените адрес"})
                    cur.execute(
                        "INSERT INTO articles (slug, title, excerpt, body, author, cover_url, seo_title, "
                        "seo_description, status, published_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,"
                        "CASE WHEN %s = 'published' THEN now() ELSE NULL END) RETURNING id",
                        (data["slug"], data["title"], data["excerpt"], data["body"], data["author"],
                         data["cover"], data["seo_title"], data["seo_description"], data["status"], data["status"]),
                    )
                    new_id = cur.fetchone()[0]
                else:
                    item_id = params.get("id")
                    if not item_id:
                        return _resp(400, {"error": "Не указан id"})
                    cur.execute("SELECT 1 FROM articles WHERE slug = %s AND id <> %s", (data["slug"], int(item_id)))
                    if cur.fetchone():
                        return _resp(409, {"error": "Статья с таким адресом уже есть, измените адрес"})
                    cur.execute(
                        "UPDATE articles SET slug=%s, title=%s, excerpt=%s, body=%s, author=%s, cover_url=%s, "
                        "seo_title=%s, seo_description=%s, status=%s, "
                        "published_at = CASE WHEN %s = 'published' THEN COALESCE(published_at, now()) ELSE NULL END, "
                        "updated_at = now() WHERE id = %s",
                        (data["slug"], data["title"], data["excerpt"], data["body"], data["author"],
                         data["cover"], data["seo_title"], data["seo_description"], data["status"], data["status"],
                         int(item_id)),
                    )
                    if cur.rowcount == 0:
                        return _resp(404, {"error": "Статья не найдена"})
                    new_id = int(item_id)
            conn.commit()
        finally:
            conn.close()
        return _resp(200, {"ok": True, "id": new_id})

    return _resp(405, {"error": "Метод не поддерживается"})


MAX_ADMIN_FAILS = 5
ADMIN_LOCK_MINUTES = 15


class AdminLocked(Exception):
    def __init__(self, seconds: int):
        self.seconds = seconds


def _client_ip(event: Dict[str, Any]) -> str:
    identity = (event.get("requestContext") or {}).get("identity") or {}
    return str(identity.get("sourceIp") or "unknown")[:64]


def _notify_admin_lock(ip: str) -> None:
    login = os.environ.get("MAILRU_SMTP_LOGIN")
    password = os.environ.get("MAILRU_SMTP_PASSWORD")
    if not login or not password:
        return
    try:
        import smtplib
        from email.header import Header
        from email.mime.text import MIMEText
        body = (
            "<div style='font-family:Arial,sans-serif;font-size:15px;line-height:1.6'>"
            "<h3>Кто-то подбирает пароль администратора ЛабГид</h3>"
            "<p>5 неверных попыток подряд. Вход с этого адреса заблокирован на "
            + str(ADMIN_LOCK_MINUTES) + " минут.</p>"
            "<p>Адрес: <b>" + ip + "</b></p>"
            "<p>Если это были вы, ничего делать не нужно. Если нет, рекомендуем сменить пароль ADMIN_PASSWORD.</p></div>"
        )
        msg = MIMEText(body, "html", "utf-8")
        msg["Subject"] = Header("ЛабГид: заблокирован подбор пароля администратора", "utf-8")
        msg["From"] = login
        msg["To"] = login
        with smtplib.SMTP_SSL("smtp.mail.ru", 465, timeout=3) as server:
            server.login(login, password)
            server.sendmail(login, [login], msg.as_string())
    except Exception as e:
        print("admin lock notify failed: " + str(e))


def _check_admin_auth(event: Dict[str, Any]) -> bool:
    headers = event.get("headers") or {}
    provided = headers.get("X-Admin-Password") or headers.get("x-admin-password") or ""
    expected = os.environ.get("ADMIN_PASSWORD", "")
    ip = _client_ip(event).replace("'", "")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT failed_count, GREATEST(0, CEIL(EXTRACT(EPOCH FROM (locked_until - now())))) "
                "FROM admin_login_attempts WHERE ip = '" + ip + "'"
            )
            row = cur.fetchone()
            if row and row[1] and row[1] > 0:
                raise AdminLocked(int(row[1]))
            ok = bool(expected) and hmac.compare_digest(provided, expected)
            if ok:
                if row:
                    cur.execute("DELETE FROM admin_login_attempts WHERE ip = '" + ip + "'")
                    conn.commit()
                return True
            if provided and expected:
                cur.execute(
                    "INSERT INTO admin_login_attempts (ip, failed_count, updated_at) VALUES ('" + ip + "', 1, now()) "
                    "ON CONFLICT (ip) DO UPDATE SET failed_count = CASE WHEN (admin_login_attempts.locked_until IS NOT NULL "
                    "AND admin_login_attempts.locked_until <= now()) "
                    "OR admin_login_attempts.updated_at < now() - interval '15 minutes' THEN 1 ELSE admin_login_attempts.failed_count + 1 END, "
                    "locked_until = NULL, updated_at = now() RETURNING failed_count"
                )
                count = cur.fetchone()[0]
                if count >= MAX_ADMIN_FAILS:
                    cur.execute(
                        "UPDATE admin_login_attempts SET locked_until = now() + interval '"
                        + str(ADMIN_LOCK_MINUTES) + " minutes' WHERE ip = '" + ip + "'"
                    )
                    conn.commit()
                    _notify_admin_lock(ip)
                    raise AdminLocked(ADMIN_LOCK_MINUTES * 60)
                conn.commit()
            return False
    finally:
        conn.close()


def _locked_resp(seconds: int) -> Dict[str, Any]:
    minutes = max(1, (seconds + 59) // 60)
    return _resp(429, {
        "error": "Слишком много неверных попыток. Вход заблокирован, попробуйте через " + str(minutes) + " мин.",
        "retryAfterSeconds": seconds,
    })


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

    if admin_resource == "reviews":
        return _resp(200, {"ok": True, "items": _list_reviews(dsn, params.get("status"))})

    return _resp(400, {"error": "Неизвестный ресурс"})


def _handle_feedback(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get("httpMethod", "GET")
    dsn = os.environ["DATABASE_URL"]
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        if not _check_admin_auth(event):
            return _resp(401, {"error": "Неверный пароль администратора"})
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
            except UploadValidationError as e:
                return _resp(400, {"error": str(e)})
            except Exception:
                return _resp(502, {"error": "Не удалось загрузить скриншот"})

        try:
            new_id = _create_feedback(dsn, f_type, subject, message, screenshot_url)
        except Exception:
            return _resp(502, {"error": "Не удалось отправить сообщение, попробуйте ещё раз"})

        return _resp(200, {"ok": True, "id": new_id})

    if method == "PATCH":
        if not _check_admin_auth(event):
            return _resp(401, {"error": "Неверный пароль администратора"})
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


STATS_BASE = 156
STATS_DB_OFFSET = 12


def _handle_stats() -> Dict[str, Any]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM analyses WHERE status = 'done'")
            done = cur.fetchone()[0]
            cur.execute("SELECT avg(rating), count(*) FROM reviews WHERE status = 'approved'")
            avg_rating, reviews_count = cur.fetchone()
    finally:
        conn.close()
    rating = round(float(avg_rating), 1) if avg_rating is not None else 5.0
    return _resp(200, {
        "analyses": STATS_BASE + max(0, done - STATS_DB_OFFSET),
        "rating": rating,
        "reviews": reviews_count,
    })


def _handle(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: возвращает историю запросов пользователя (расшифровок анализов) личного
    кабинета ЛабГид, принимает и отдаёт обращения пользователей (resource=feedback),
    принимает и отдаёт отзывы клиентов (resource=reviews), а также отдаёт закрытую
    админ-панель со списком платежей, пользователей и отзывов на модерации
    (resource=admin, admin=payments|users|reviews) по паролю в заголовке X-Admin-Password.
    Args: event с httpMethod, queryStringParameters {resource: 'feedback'|'reviews'|'admin',
          type, status, id, admin}, headers.X-Authorization (токен логина) для истории,
          headers.X-Admin-Password для админ-панели и модерации отзывов,
          body {type, subject, message, screenshot} для создания обращения,
          body {author, role, rating, text} для отправки отзыва,
          body {status} для обновления статуса обращения/отзыва администратором
    Returns: HTTP-ответ со списком истории анализов, обращений, отзывов или платежей/пользователей
    """
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    params = event.get("queryStringParameters") or {}
    if params.get("resource") == "stats":
        return _handle_stats()
    if params.get("resource") == "feedback":
        return _handle_feedback(event)
    if params.get("resource") == "reviews":
        return _handle_reviews(event)
    if params.get("resource") == "articles":
        return _handle_articles(event)
    if params.get("resource") == "admin":
        return _handle_admin(event)

    return _handle_history(event)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Точка входа: ограничивает перебор пароля администратора (5 попыток, блок на 15 минут)."""
    try:
        return _handle(event, context)
    except AdminLocked as e:
        return _locked_resp(e.seconds)
