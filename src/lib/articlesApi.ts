import type { Article } from '@/data/articles';

export const ARTICLES_URL = 'https://functions.poehali.dev/3880b1fb-4c27-45f0-9c29-db096014e097';

type ApiArticle = Omit<Article, 'subtitle' | 'cover' | 'coverWeb' | 'seoTitle' | 'seoDescription' | 'datePublished' | 'paragraphs'> & {
  subtitle: string | null;
  cover: string | null;
  coverWeb: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  datePublished: string | null;
  paragraphs?: string[];
  redirectTo?: string | null;
};

export type ArticleFull = Article & { redirectTo?: string | null };

const nn = <T,>(v: T | null): T | undefined => (v === null ? undefined : v);

const fromApi = (a: ApiArticle): ArticleFull => ({
  ...a,
  subtitle: nn(a.subtitle),
  cover: nn(a.cover),
  coverWeb: nn(a.coverWeb),
  seoTitle: nn(a.seoTitle),
  seoDescription: nn(a.seoDescription),
  datePublished: nn(a.datePublished),
  paragraphs: a.paragraphs ?? [],
});

export const fetchArticles = async (): Promise<Article[]> => {
  const res = await fetch(ARTICLES_URL);
  if (!res.ok) throw new Error('articles list failed');
  const data = await res.json();
  return (data.items as ApiArticle[]).map(fromApi);
};

export const fetchArticle = async (slug: string): Promise<ArticleFull | null> => {
  const res = await fetch(`${ARTICLES_URL}?slug=${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('article failed');
  const data = await res.json();
  return fromApi(data.item as ApiArticle);
};
