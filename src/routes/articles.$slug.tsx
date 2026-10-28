import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import Article from '@/pages/Article';
import { fetchArticle, fetchArticles } from '@/lib/articlesApi';
import { pageHead } from '@/lib/seo';
import { articleLdScripts } from '@/lib/articleLd';

export const Route = createFileRoute('/articles/$slug')({
  loader: async ({ params }) => {
    const [article, articles] = await Promise.all([
      fetchArticle(params.slug).catch(() => undefined),
      fetchArticles().catch(() => undefined),
    ]);
    if (article === null) throw notFound();
    if (article && article.slug !== params.slug) {
      throw redirect({ to: '/articles/$slug', params: { slug: article.slug }, statusCode: 301 });
    }
    return { article, articles };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.article;
    const head = pageHead({
      title: a ? `${a.title} — ЛабГид` : undefined,
      description: a ? a.seoDescription ?? a.excerpt : undefined,
      path: `/articles/${params.slug}`,
    });
    const cover = a?.coverWeb ?? a?.cover;
    if (cover) head.meta.push({ property: 'og:image', content: cover });
    return { ...head, scripts: a ? articleLdScripts(a, `/articles/${params.slug}`) : [] };
  },
  component: ArticleRoute,
});

function ArticleRoute() {
  const { article, articles } = Route.useLoaderData();
  return <Article initialArticle={article} initialArticles={articles} />;
}