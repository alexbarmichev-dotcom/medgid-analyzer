import base64
import json
import os
import tempfile
import uuid
from typing import Any, Dict, List, Optional, Tuple

import boto3
import psycopg2

MAX_FILES = 12
MAX_TOTAL_BYTES = 50 * 1024 * 1024
MAX_CHUNK_BYTES = 2 * 1024 * 1024
STALE_UPLOAD_MINUTES = 30
STALE_READY_HOURS = 24

ALLOWED_UPLOAD_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/pdf": "pdf",
}

LIMIT_MESSAGE = "Можно загрузить не больше 12 файлов общим объёмом до 50 МБ"


class UploadError(Exception):
    def __init__(self, message: str, code: str = "invalid"):
        super().__init__(message)
        self.code = code


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def normalize_mime(mime: str) -> str:
    return (mime or "").split(";")[0].strip().lower()


def _connect():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _load_files(raw: Any) -> List[Dict[str, Any]]:
    if isinstance(raw, list):
        return raw
    return json.loads(raw or "[]")


def get_session(session_id: str, login: str) -> Optional[Dict[str, Any]]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, login, status, file_count, declared_bytes, uploaded_bytes, files, "
                "gender, age, complaints, conditions, meds, email, payment_id "
                "FROM upload_sessions WHERE id = %s",
                (session_id,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row or row[1] != login:
        return None
    keys = ["id", "login", "status", "file_count", "declared_bytes", "uploaded_bytes", "files",
            "gender", "age", "complaints", "conditions", "meds", "email", "payment_id"]
    data = dict(zip(keys, row))
    data["files"] = _load_files(data["files"])
    return data


def set_status(session_id: str, status: str, error: Optional[str] = None,
               payment_id: Optional[str] = None) -> None:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET status = %s, error = COALESCE(%s, error), "
                "payment_id = COALESCE(%s, payment_id), updated_at = now() WHERE id = %s",
                (status, error, payment_id, session_id),
            )
        conn.commit()
    finally:
        conn.close()


def _delete_keys(s3, keys: List[str]) -> None:
    for k in keys:
        try:
            s3.delete_object(Bucket="files", Key=k)
        except Exception as e:
            print(f"delete failed {k}: {e}")


def delete_session_files(session_id: str, files: List[Dict[str, Any]]) -> None:
    """Удаляет из хранилища все файлы сессии и временные части."""
    keys = [f["key"] for f in files if f.get("key")]
    for file_index, next_chunk in _load_progress(session_id).items():
        keys.extend(f"uploads/{session_id}/{file_index}/{n}" for n in range(int(next_chunk)))
    _delete_keys(s3_client(), keys)


def fail_session(session: Dict[str, Any], status: str, error: str) -> None:
    delete_session_files(session["id"], session["files"])
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET status = %s, error = %s, files = '[]'::jsonb, "
                "uploaded_bytes = 0, updated_at = now() WHERE id = %s",
                (status, error, session["id"]),
            )
        conn.commit()
    finally:
        conn.close()


def start_session(login: str, body: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    files_meta = body.get("files") or []
    if not files_meta:
        raise UploadError("Загрузите фото или скан анализа")
    if len(files_meta) > MAX_FILES:
        raise UploadError(LIMIT_MESSAGE, "limit_exceeded")
    total = 0
    for f in files_meta:
        if normalize_mime(f.get("type")) not in ALLOWED_UPLOAD_MIME:
            raise UploadError("Можно загружать только фото (JPG, PNG, HEIC, WEBP) и PDF")
        size = int(f.get("size") or 0)
        if size <= 0:
            raise UploadError("Один из файлов пустой")
        total += size
    if total > MAX_TOTAL_BYTES:
        raise UploadError(LIMIT_MESSAGE, "limit_exceeded")

    age_raw = body.get("age", "")
    session_id = str(uuid.uuid4())
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO upload_sessions (id, login, status, file_count, declared_bytes, "
                "gender, age, complaints, conditions, meds, email) VALUES "
                "(%s, %s, 'uploading', %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    session_id, login, len(files_meta), total,
                    (body.get("gender") or "")[:1] or None,
                    int(age_raw) if str(age_raw).isdigit() else None,
                    body.get("complaints") or "",
                    body.get("conditions") or "",
                    body.get("meds") or "",
                    body.get("email"),
                ),
            )
        conn.commit()
    finally:
        conn.close()
    return session_id, {"maxChunkBytes": MAX_CHUNK_BYTES}


def _load_progress(session_id: str) -> Dict[str, Any]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT multipart FROM upload_sessions WHERE id = %s", (session_id,))
            row = cur.fetchone()
    finally:
        conn.close()
    raw = row[0] if row else {}
    return raw if isinstance(raw, dict) else json.loads(raw or "{}")


def _next_chunk(session_id: str, file_index: int) -> int:
    return int(_load_progress(session_id).get(str(file_index), 0))


def _set_next_chunk(session_id: str, file_index: int, value: int) -> None:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET multipart = multipart || %s::jsonb, updated_at = now() "
                "WHERE id = %s",
                (json.dumps({str(file_index): value}), session_id),
            )
        conn.commit()
    finally:
        conn.close()


def upload_chunk(session: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    if session["status"] != "uploading":
        raise UploadError("Эта загрузка уже завершена или отменена", "session_closed")

    file_index = int(body.get("fileIndex", -1))
    chunk_index = int(body.get("chunkIndex", -1))
    total_chunks = int(body.get("totalChunks", 0))
    mime = normalize_mime(body.get("type"))
    name = (body.get("name") or "file")[:200]

    if file_index < 0 or file_index >= session["file_count"]:
        raise UploadError(LIMIT_MESSAGE, "limit_exceeded")
    if total_chunks <= 0 or chunk_index < 0 or chunk_index >= total_chunks:
        raise UploadError("Некорректная часть файла")
    if mime not in ALLOWED_UPLOAD_MIME:
        raise UploadError("Можно загружать только фото (JPG, PNG, HEIC, WEBP) и PDF")
    try:
        raw = base64.b64decode(body.get("data") or "", validate=True)
    except Exception:
        raise UploadError("Не удалось прочитать файл")
    if not raw:
        raise UploadError("Пустой файл")
    if len(raw) > MAX_CHUNK_BYTES:
        raise UploadError("Слишком большая часть файла")

    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET uploaded_bytes = uploaded_bytes + %s, updated_at = now() "
                "WHERE id = %s RETURNING uploaded_bytes",
                (len(raw), session["id"]),
            )
            uploaded_bytes = cur.fetchone()[0]
        conn.commit()
    finally:
        conn.close()
    if uploaded_bytes > MAX_TOTAL_BYTES:
        raise UploadError(LIMIT_MESSAGE, "limit_exceeded")

    s3 = s3_client()
    is_last = chunk_index == total_chunks - 1

    if total_chunks == 1:
        final_key = f"analyses/{uuid.uuid4()}.{ALLOWED_UPLOAD_MIME[mime]}"
        s3.put_object(Bucket="files", Key=final_key, Body=raw, ContentType=mime)
    else:
        expected = _next_chunk(session["id"], file_index)
        if chunk_index != expected:
            raise UploadError("Части файла пришли не по порядку, повторите загрузку")
        s3.put_object(Bucket="files", Key=f"uploads/{session['id']}/{file_index}/{chunk_index}",
                      Body=raw, ContentType="application/octet-stream")
        _set_next_chunk(session["id"], file_index, chunk_index + 1)
        if not is_last:
            return {"fileDone": False, "sessionReady": False}
        final_key = f"analyses/{uuid.uuid4()}.{ALLOWED_UPLOAD_MIME[mime]}"
        part_keys = [f"uploads/{session['id']}/{file_index}/{n}" for n in range(total_chunks)]
        with tempfile.TemporaryFile() as tmp:
            for k in part_keys:
                tmp.write(s3.get_object(Bucket="files", Key=k)["Body"].read())
            tmp.seek(0)
            s3.put_object(Bucket="files", Key=final_key, Body=tmp, ContentType=mime)
        _delete_keys(s3, part_keys)
        _set_next_chunk(session["id"], file_index, 0)

    entry = {"index": file_index, "name": name, "mime": mime, "key": final_key,
             "url": cdn_url(final_key)}
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE upload_sessions SET files = files || %s::jsonb, updated_at = now() "
                "WHERE id = %s RETURNING jsonb_array_length(files), file_count",
                (json.dumps([entry]), session["id"]),
            )
            done_count, file_count = cur.fetchone()
            ready = done_count >= file_count
            if ready:
                cur.execute(
                    "UPDATE upload_sessions SET status = 'ready', updated_at = now() WHERE id = %s",
                    (session["id"],),
                )
        conn.commit()
    finally:
        conn.close()
    return {"fileDone": True, "sessionReady": ready}


def session_files_for_ai(session: Dict[str, Any]) -> List[Dict[str, str]]:
    files = sorted(session["files"], key=lambda f: f.get("index", 0))
    return [{"url": f["url"], "mime": f["mime"], "key": f.get("key", "")} for f in files]


def cleanup_stale(login: str) -> None:
    """Подчищает зависшие загрузки (клиент закрыл вкладку посреди загрузки)."""
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, files FROM upload_sessions WHERE login = %s AND ("
                f"(status = 'uploading' AND updated_at < now() - interval '{STALE_UPLOAD_MINUTES} minutes') "
                f"OR (status = 'ready' AND updated_at < now() - interval '{STALE_READY_HOURS} hours'))",
                (login,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    for sid, files in rows:
        fail_session({"id": sid, "files": _load_files(files)}, "failed",
                     "Заказ не был завершён — файлы удалены")


def list_incomplete(login: str) -> List[Dict[str, Any]]:
    cleanup_stale(login)
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, status, file_count, gender, age, complaints, conditions, meds, email, "
                "payment_id, error, created_at FROM upload_sessions "
                "WHERE login = %s AND status IN ('uploading', 'ready', 'awaiting_payment', "
                "'failed', 'canceled') AND created_at > now() - interval '30 days' "
                "ORDER BY created_at DESC LIMIT 20",
                (login,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "status": r[1],
            "fileCount": r[2],
            "gender": r[3] or "",
            "age": r[4],
            "complaints": r[5] or "",
            "conditions": r[6] or "",
            "meds": r[7] or "",
            "email": r[8] or "",
            "paymentId": r[9],
            "error": r[10],
            "date": r[11].isoformat() if r[11] else None,
        })
    return items