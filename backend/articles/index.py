import json
import os
from typing import Any, Dict, List

import psycopg2
import psycopg2.extras

CARD_COLS = (
    "slug, title, subtitle, excerpt, author, cover_url, cover_web, seo_title, seo_description, "
    "ref_slugs, old_slugs, hide_on_home, published_at"
)


def _resp(status: int, body: Any, cache: str = "no-store") -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": cache,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "isBase64Encoded": False,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def _card(r: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "slug": r["slug"],
        "title": r["title"],
        "subtitle": r["subtitle"],
        "excerpt": r["excerpt"],
        "author": r["author"],
        "cover": r["cover_url"],
        "coverWeb": r["cover_web"],
        "seoTitle": r["seo_title"],
        "seoDescription": r["seo_description"],
        "refSlugs": r["ref_slugs"] or [],
        "oldSlugs": r["old_slugs"] or [],
        "hideOnHome": r["hide_on_home"],
        "datePublished": r["published_at"].date().isoformat() if r["published_at"] else None,
    }


def _full(r: Dict[str, Any]) -> Dict[str, Any]:
    item = _card(r)
    item["paragraphs"] = [p for p in (r["body"] or "").split("\n\n") if p.strip()]
    return item


def _seed(cur) -> int:
    cur.execute("SELECT count(*) AS n FROM articles")
    if cur.fetchone()["n"] > 0:
        return 0
    from seed_data import ITEMS as items
    for i, a in enumerate(items):
        cur.execute(
            "INSERT INTO articles (slug, title, subtitle, excerpt, body, author, cover_url, cover_web, "
            "seo_title, seo_description, ref_slugs, old_slugs, hide_on_home, status, published_at, sort_order) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'published',%s,%s)",
            (
                a["slug"], a["title"], a.get("subtitle"), a.get("excerpt", ""), "\n\n".join(a["paragraphs"]),
                a.get("author", "Команда ЛабГид"), a.get("cover"), a.get("coverWeb"),
                a.get("seoTitle"), a.get("seoDescription"), a.get("refSlugs", []), a.get("oldSlugs", []),
                bool(a.get("hideOnHome")), a.get("datePublished"), i,
            ),
        )
    return len(items)


def handler(event: dict, context) -> dict:
    """Отдаёт статьи сайта из базы: список для карточек, одну статью по адресу, полный набор для сборки."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }
    if event.get("httpMethod") != "GET":
        return _resp(405, {"error": "method not allowed"})

    qs = event.get("queryStringParameters") or {}
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if qs.get("action") == "seed":
                return _resp(200, {"inserted": _seed(cur)})

            if qs.get("slug"):
                slug = qs["slug"]
                cur.execute(
                    f"SELECT {CARD_COLS}, body FROM articles WHERE status = 'published' "
                    "AND (slug = %s OR %s = ANY(old_slugs)) ORDER BY (slug = %s) DESC LIMIT 1",
                    (slug, slug, slug),
                )
                row = cur.fetchone()
                if not row:
                    return _resp(404, {"error": "not found"})
                item = _full(row)
                item["redirectTo"] = row["slug"] if row["slug"] != slug else None
                return _resp(200, {"item": item}, "public, max-age=60")

            if qs.get("full") == "1":
                cur.execute(
                    f"SELECT {CARD_COLS}, body FROM articles WHERE status = 'published' "
                    "ORDER BY sort_order, published_at DESC"
                )
                return _resp(200, {"items": [_full(r) for r in cur.fetchall()]})

            cur.execute(
                f"SELECT {CARD_COLS} FROM articles WHERE status = 'published' "
                "ORDER BY sort_order, published_at DESC"
            )
            return _resp(200, {"items": [_card(r) for r in cur.fetchall()]}, "public, max-age=60")
    finally:
        conn.close()
