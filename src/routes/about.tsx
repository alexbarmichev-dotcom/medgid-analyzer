import { createFileRoute } from '@tanstack/react-router';
import About from '@/pages/About';
import { ABOUT_LEAD, ABOUT_TITLE } from '@/data/about';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/about')({
  head: () =>
    pageHead({ title: `${ABOUT_TITLE} — расшифровка анализов онлайн`, description: ABOUT_LEAD, path: '/about' }),
  component: About,
});
