interface ArticleLink {
  slug: string;
  title: string;
  refSlugs?: string[];
}

const FALLBACK = ['podgotovka-k-priemu-vracha', 'mozhno-li-doveryat-ii-rasshifrovke-analizov'];
const LIMIT = 3;

export const relatedArticles = <T extends ArticleLink>(all: T[], refSlug: string): T[] => {
  const direct = all.filter((a) => a.refSlugs?.includes(refSlug));
  if (direct.length >= 2) return direct.slice(0, LIMIT);
  const extra = FALLBACK.map((s) => all.find((a) => a.slug === s)).filter(
    (a): a is T => !!a && !direct.includes(a)
  );
  return [...direct, ...extra].slice(0, LIMIT);
};
