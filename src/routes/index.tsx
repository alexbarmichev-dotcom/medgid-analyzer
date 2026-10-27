import { createFileRoute } from '@tanstack/react-router';
import Index from '@/pages/Index';
import { fetchArticles } from '@/lib/articlesApi';

export const Route = createFileRoute('/')({
  loader: async () => ({ articles: await fetchArticles().catch(() => undefined) }),
  head: () => ({ links: [{ rel: 'canonical', href: 'https://лаб-гид.рф/' }] }),
  component: IndexRoute,
});

function IndexRoute() {
  const { articles } = Route.useLoaderData();
  return <Index articles={articles} />;
}
