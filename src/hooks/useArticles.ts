import { useQuery } from '@tanstack/react-query';
import { fetchArticle, fetchArticles } from '@/lib/articlesApi';

export const useArticles = () =>
  useQuery({ queryKey: ['articles'], queryFn: fetchArticles, staleTime: 5 * 60 * 1000 });

export const useArticle = (slug?: string) =>
  useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
