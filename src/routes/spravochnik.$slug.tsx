import { createFileRoute, notFound } from '@tanstack/react-router';
import ReferencePage from '@/pages/ReferencePage';
import { getRefPage, refPath } from '@/data/reference';
import { fetchArticles } from '@/lib/articlesApi';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/spravochnik/$slug')({
  loader: async ({ params }) => {
    const page = getRefPage(params.slug);
    if (!page) throw notFound();
    return {
      title: `${page.seoTitle} — ЛабГид`,
      description: page.description,
      articles: await fetchArticles().catch(() => undefined),
    };
  },
  head: ({ loaderData, params }) =>
    pageHead({ title: loaderData?.title, description: loaderData?.description, path: refPath(params.slug) }),
  component: ReferenceRoute,
});

function ReferenceRoute() {
  const { articles } = Route.useLoaderData();
  return <ReferencePage initialArticles={articles} />;
}
