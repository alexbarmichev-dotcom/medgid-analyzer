import { createFileRoute } from '@tanstack/react-router';
import UnitCalculator from '@/pages/UnitCalculator';
import { CALC_DESC, CALC_PATH, CALC_TITLE } from '@/data/unitCalc';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/spravochnik/kalkulyator-mmol-mgdl')({
  head: () => pageHead({ title: `${CALC_TITLE} — ЛабГид`, description: CALC_DESC, path: CALC_PATH }),
  component: UnitCalculator,
});
