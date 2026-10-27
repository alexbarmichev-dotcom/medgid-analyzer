export const SITE_URL = 'https://лаб-гид.рф';

export const pageHead = (opts: { title?: string; description?: string; path: string; noindex?: boolean }) => {
  const meta: Array<Record<string, string>> = [];
  if (opts.title) {
    meta.push({ title: opts.title }, { property: 'og:title', content: opts.title });
  }
  if (opts.description) {
    meta.push(
      { name: 'description', content: opts.description },
      { property: 'og:description', content: opts.description },
    );
  }
  meta.push({ property: 'og:url', content: `${SITE_URL}${opts.path}` });
  if (opts.noindex) meta.push({ name: 'robots', content: 'noindex, nofollow' });
  return {
    meta,
    links: opts.noindex ? [] : [{ rel: 'canonical', href: `${SITE_URL}${opts.path}` }],
  };
};
