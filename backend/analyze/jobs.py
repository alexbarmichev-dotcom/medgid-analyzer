import os
from typing import Any, Dict, Optional, Tuple

import psycopg2

STALE_SECONDS = 240

COLUMNS = "job_key, login, status, analysis_id, result, error, EXTRACT(EPOCH FROM (NOW() - started_at))"


def _row_to_dict(row) -> Dict[str, Any]:
    return {
        "key": row[0],
        "login": row[1],
        "status": row[2],
        "analysis_id": row[3],
        "result": row[4],
        "error": row[5],
        "age": float(row[6] or 0),
    }


def get(key: str, login: str) -> Optional[Dict[str, Any]]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT {COLUMNS} FROM analysis_jobs WHERE job_key = %s AND login = %s", (key, login))
            row = cur.fetchone()
        return _row_to_dict(row) if row else None
    finally:
        conn.close()


def claim(key: str, login: str) -> Tuple[Optional[Dict[str, Any]], bool]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO analysis_jobs (job_key, login, status) VALUES (%s, %s, 'running') "
                "ON CONFLICT (job_key) DO NOTHING RETURNING job_key",
                (key, login),
            )
            if cur.fetchone():
                conn.commit()
                return None, True
            cur.execute(
                "UPDATE analysis_jobs SET status = 'running', error = NULL, started_at = NOW(), "
                "finished_at = NULL WHERE job_key = %s AND login = %s AND status <> 'done' "
                f"AND (status = 'error' OR started_at < NOW() - INTERVAL '{STALE_SECONDS} seconds') "
                "RETURNING job_key",
                (key, login),
            )
            if cur.fetchone():
                conn.commit()
                return None, True
            cur.execute(f"SELECT {COLUMNS} FROM analysis_jobs WHERE job_key = %s AND login = %s", (key, login))
            row = cur.fetchone()
        conn.commit()
        return (_row_to_dict(row) if row else None), False
    finally:
        conn.close()


def finish(key: str, status: str, analysis_id: Optional[int] = None,
           result: Optional[str] = None, error: Optional[str] = None) -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE analysis_jobs SET status = %s, analysis_id = %s, result = %s, error = %s, "
                "finished_at = NOW() WHERE job_key = %s",
                (status, analysis_id, result, error, key),
            )
        conn.commit()
    finally:
        conn.close()


def view(job: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not job:
        return {"ok": True, "status": "none"}
    status = job["status"]
    if status == "running" and job["age"] > STALE_SECONDS:
        return {"ok": True, "status": "error", "error": "Разбор занял слишком долго, попробуйте ещё раз"}
    if status == "done":
        return {"ok": True, "status": "done", "id": job["analysis_id"], "result": job["result"]}
    if status == "error":
        return {"ok": True, "status": "error", "error": job["error"] or "Не удалось получить расшифровку"}
    return {"ok": True, "status": "running"}
