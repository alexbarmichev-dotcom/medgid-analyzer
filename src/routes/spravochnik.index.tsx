import { createFileRoute } from '@tanstack/react-router';
import ReferenceHub from '@/pages/ReferenceHub';
import { REF_HUB_DESC, REF_HUB_TITLE } from '@/data/reference';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/spravochnik/')({
  head: () => pageHead({ title: `${REF_HUB_TITLE} — ЛабГид`, description: REF_HUB_DESC, path: '/spravochnik' }),
  component: ReferenceHub,
});
