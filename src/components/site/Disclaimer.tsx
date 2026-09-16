import Icon from '@/components/ui/icon';

const Disclaimer = () => {
  return (
    <section id="disclaimer" className="relative scroll-mt-20">
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <div className="relative overflow-hidden rounded-2xl border-2 border-accent/25 bg-card p-5 md:p-7">
          <span className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <Icon name="TriangleAlert" size={14} />
            Важно знать
          </span>

          <h2 className="font-head text-lg font-extrabold leading-snug tracking-[-0.02em] sm:text-xl">
            ЛабГид — не врач
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Сервис не ставит диагнозы, не назначает лечение и не заменяет очную консультацию
            специалиста. ЛабГид носит исключительно информационно-образовательный характер и помогает
            вам стать более осознанным участником собственного лечения.
          </p>

          <p className="mt-3 inline-flex items-center gap-2 font-caveat text-lg text-hand">
            <Icon name="Heart" size={16} className="text-hand" />
            Доверять можно только человеку.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Disclaimer;