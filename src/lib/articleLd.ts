import { SITE_URL } from '@/lib/seo';
import type { ArticleFull } from '@/lib/articlesApi';

const parseAuthor = (author: string) => {
  const m = author.match(/^(Врач общей практики)\s+(.+)$/);
  if (m) return { '@type': 'Person', name: m[2].trim(), jobTitle: m[1] };
  return { '@type': 'Person', name: author };
};

const parseFaq = (paragraphs: string[]) => {
  const start = paragraphs.findIndex((p) => p.startsWith('## ') && /вопрос/i.test(p));
  if (start < 0) return [];
  const items: Array<{ q: string; a: string }> = [];
  for (let i = start + 1; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.startsWith('## ')) break;
    if (p.startsWith('### ') && paragraphs[i + 1] && !paragraphs[i + 1].startsWith('#')) {
      items.push({ q: p.slice(4).trim(), a: paragraphs[i + 1].trim() });
    }
  }
  return items;
};

export const articleLdScripts = (a: ArticleFull, path: string) => {
  const url = `${SITE_URL}${path}`;
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.seoDescription ?? a.excerpt,
    inLanguage: 'ru',
    mainEntityOfPage: url,
    author: parseAuthor(a.author),
    publisher: { '@type': 'Organization', name: 'ЛабГид', url: SITE_URL },
  };
  if (a.datePublished) {
    article.datePublished = a.datePublished;
    article.dateModified = a.datePublished;
  }
  const scripts = [{ type: 'application/ld+json', children: JSON.stringify(article) }];
  const faq = parseFaq(a.paragraphs ?? []);
  if (faq.length > 0) {
    scripts.push({
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }),
    });
  }
  return scripts;
};
