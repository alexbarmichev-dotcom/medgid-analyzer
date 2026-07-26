import Icon from '@/components/ui/icon';

const POINTS = [
  {
    icon: 'Lock',
    title: 'Зашифрованный канал',
    text: 'Файлы передаются по защищённому соединению и хранятся в защищённом облачном хранилище.',
  },
  {
    icon: 'ServerCog',
    title: 'Серверы в России',
    text: 'Вся база хранится на серверах на территории РФ в полном соответствии с 152-ФЗ о персональных данных.',
  },
  {
    icon: 'UserX',
    title: 'Без персональных данных',
    text: 'Мы не запрашиваем ни ФИО, ни адрес, ни номер полиса. Данные не передаются третьим лицам.',
  },
  {
    icon: 'Trash2',
    title: 'Вы управляете данными',
    text: 'Историю исследований можно сохранить или удалить в любой момент одним нажатием.',
  },
];

const Security = () => {
  return (
    <section id="security" className="relative scroll-mt-20 overflow-hidden bg-primary text-primary-foreground">
      <div
        className="paper-lines pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2">
        <div>
          <span className="mb-4 inline-flex items-center gap-2.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            <Icon name="ShieldCheck" size={15} />
            Соответствие 152-ФЗ
          </span>
          <h2 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            Ваши данные под надёжной защитой
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-primary-foreground/70">
            Мы построили сервис так, чтобы вы могли доверять ему свои анализы, ничего не рассказывая
            о себе лишнего.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-hand/20 text-primary-foreground">
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="mt-4 font-head text-base font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/65">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;
