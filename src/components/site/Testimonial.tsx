const Testimonial = () => {
  return (
    <section className="relative overflow-hidden bg-card">
      <div className="mx-auto max-w-3xl px-5 py-14 text-center md:px-8">
        <p className="font-caveat text-[2rem] leading-snug text-ink-soft sm:text-[2.4rem]">
          «Раньше я гуглила каждую цифру из анализов и только больше пугалась.
          С МедГидом за пять минут стало понятно, что реально важно, а что можно
          спокойно обсудить с врачом на приёме»
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="h-[6px] w-[6px] rounded-full bg-hand" />
          <span className="font-caveat text-2xl font-bold text-hand">Марина, 34 года</span>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
