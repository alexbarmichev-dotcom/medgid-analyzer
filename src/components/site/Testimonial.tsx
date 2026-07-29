const TESTIMONIALS = [
  {
    text: '«Раньше я гуглила каждую цифру из анализов и только больше пугалась. С МедГидом за пять минут стало понятно, что реально важно, а что можно спокойно обсудить с врачом на приёме»',
    author: 'Марина, 34 года',
    align: 'md:text-right md:items-end md:justify-self-end',
  },
  {
    text: '«За столько лет ни один врач не удосужился объяснить мне мои анализы, вот так — понятно, подробно, по-человечески. Загрузила, прочитала, и всё встало на свои места. Теперь я знаю, о чём говорить с доктором. Вот это действительно помощь!»',
    author: 'Любовь Андреевна, 64 года',
    align: 'md:text-left md:items-start md:justify-self-start',
  },
];

const Testimonial = () => {
  return (
    <section className="relative overflow-hidden bg-card">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.author}
            className={`flex flex-col items-center text-center ${t.align} max-w-sm`}
          >
            <p className="font-caveat text-xl leading-snug text-ink-soft sm:text-2xl">
              {t.text}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-[6px] w-[6px] rounded-full bg-hand" />
              <span className="font-caveat text-lg font-bold text-hand">{t.author}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonial;
