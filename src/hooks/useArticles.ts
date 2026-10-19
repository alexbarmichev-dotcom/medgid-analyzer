import { useEffect, useState } from 'react';
import { ARTICLES, type Article } from '@/data/articles';

export const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

export const bodyToParagraphs = (body: string): string[] =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

interface ApiArticle {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  cover: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  body?: string;
}

export const fromApi = (a: ApiArticle): Article => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  author: a.author,
  cover: a.cover || undefined,
  seoTitle: a.seoTitle || undefined,
  seoDescription: a.seoDescription || undefined,
  paragraphs: bodyToParagraphs(a.body || ''),
});

export const useArticles = (): Article[] => {
  const [remote, setRemote] = useState<Article[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(`${HISTORY_URL}?resource=articles`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.items) setRemote((data.items as ApiArticle[]).map(fromApi));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const staticSlugs = new Set(ARTICLES.map((a) => a.slug));
  return [...remote.filter((a) => !staticSlugs.has(a.slug)), ...ARTICLES];
};

export const fetchArticleBySlug = async (slug: string): Promise<Article | null> => {
  try {
    const res = await fetch(`${HISTORY_URL}?resource=articles&slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.item ? fromApi(data.item) : null;
  } catch {
    return null;
  }
};
