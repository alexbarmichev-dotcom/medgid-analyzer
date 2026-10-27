import { createFileRoute } from '@tanstack/react-router';
import Faq from '@/pages/Faq';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/faq')({
  head: () =>
    pageHead({
      title: 'Частые вопросы о расшифровке анализов — ЛабГид',
      description:
        'Ответы на частые вопросы о сервисе ЛабГид: как расшифровать анализы онлайн, сколько это стоит, какие данные учитываются и как обеспечивается безопасность.',
      path: '/faq',
    }),
  component: Faq,
});
