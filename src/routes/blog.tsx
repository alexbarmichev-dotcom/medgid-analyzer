import { createFileRoute } from '@tanstack/react-router';
import Blog from '@/pages/Blog';
import { fetchArticles } from '@/lib/articlesApi';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/blog')({
  loader: async () => ({ articles: await fetchArticles().catch(() => undefined) }),
  head: () =>
    pageHead({
      title: 'Блог о здоровье и анализах — ЛабГид',
      description:
        'Статьи о здоровье, лабораторных анализах и разговоре с врачом: простым языком о том, как понимать свои результаты.',
      path: '/blog',
    }),
  component: BlogRoute,
});

function BlogRoute() {
  const { articles } = Route.useLoaderData();
  return <Blog initialArticles={articles} />;
}
