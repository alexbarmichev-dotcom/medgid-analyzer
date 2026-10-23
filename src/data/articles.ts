export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  author: string;
  datePublished?: string;
  cover?: string;
  coverWeb?: string;
  hideOnHome?: boolean;
  refSlugs?: string[];
  oldSlugs?: string[];
  subtitle?: string;
  paragraphs: string[];
}
