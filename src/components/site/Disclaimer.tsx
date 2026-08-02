import Icon from '@/components/ui/icon';

const Disclaimer = () => {
  return (
    <section id="disclaimer" className="relative scroll-mt-20">
      <div className="mx-auto max-w-4xl px-5 py-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border-2 border-accent/25 bg-card p-8 md:p-12">
          <span className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-accent">
            <Icon name="TriangleAlert" size={16} />
            Важно знать
          </span>

          <h2 className="font-head text-2xl font-extrabold leading-snug tracking-[-0.02em] sm:text-3xl">
            ЛабГид — не врач
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Сервис не ставит диагнозы, не назначает лечение и не заменяет очную консультацию
            специалиста. ЛабГид носит исключительно информационно-образовательный характер и помогает
            вам стать более осознанным участником собственного лечения.
          </p>

          <p className="mt-6 inline-flex items-center gap-3 font-caveat text-2xl text-hand">
            <Icon name="Heart" size={22} className="text-hand" />
            Доверять можно только человеку.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Disclaimer;