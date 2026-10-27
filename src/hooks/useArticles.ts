import { useQuery } from '@tanstack/react-query';
import { fetchArticle, fetchArticles, type ArticleFull } from '@/lib/articlesApi';
import type { Article } from '@/data/articles';

export const useArticles = (initialData?: Article[]) =>
  useQuery({ queryKey: ['articles'], queryFn: fetchArticles, staleTime: 5 * 60 * 1000, initialData });

export const useArticle = (slug?: string, initialData?: ArticleFull | null) =>
  useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });