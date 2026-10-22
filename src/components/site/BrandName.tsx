import { BRAND_TEXT, BRAND_TITLE } from '@/data/brand';

const BrandName = () => (
  <section aria-labelledby="brand-name" className="mx-auto max-w-3xl px-5 py-12 md:px-8">
    <h2 id="brand-name" className="font-head text-xl font-bold">{BRAND_TITLE}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
      {BRAND_TEXT.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </div>
  </section>
);

export default BrandName;
