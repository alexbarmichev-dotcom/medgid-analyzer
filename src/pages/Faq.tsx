import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'О сервисе',
    items: [
      {
        q: 'Что такое ЛабГид и для чего он нужен?',
        a: 'ЛабГид — сервис расшифровки анализов онлайн с помощью искусственного интеллекта. Вы загружаете фото или скан результатов лабораторных исследований, а нейросеть объясняет простым языком, что означает каждый показатель, насколько он отклоняется от нормы и на что стоит обратить внимание. Сервис не заменяет врача, а помогает подготовиться к визиту.',
      },
      {
        q: 'Какие анализы можно расшифровать?',
        a: 'Сервис принимает результаты общего и биохимического анализа крови, анализов на гормоны щитовидной железы, витамины и микроэлементы, общего анализа мочи, копрограммы и других лабораторных исследований. Достаточно загрузить чёткое фото бланка или скан из лаборатории.',
      },
      {
        q: 'Чем расшифровка анализов онлайн отличается от консультации врача?',
        a: 'ЛабГид не ставит диагнозы и не назначает лечение — это информационно-образовательный сервис. Он помогает понять значение цифр в бланке анализов, увидеть отклонения от нормы и сформулировать грамотные вопросы для очной консультации с врачом.',
      },
    ],
  },
  {
    title: 'Как это работает',
    items: [
      {
        q: 'Как получить расшифровку анализов?',
        a: 'Войдите в личный кабинет по email, укажите пол, возраст и при необходимости жалобы или сопутствующие заболевания, затем загрузите фото или скан анализа. ИИ подготовит расшифровку в течение минуты.',
      },
      {
        q: 'Сколько времени занимает расшифровка?',
        a: 'Обычно результат готов в течение 30–60 секунд после загрузки анализа и подтверждения оплаты.',
      },
      {
        q: 'Учитывается ли возраст и пол при оценке показателей?',
        a: 'Да, референтные значения нормы у показателей крови и мочи различаются в зависимости от возраста и пола, поэтому эти данные обязательны для точной расшифровки.',
      },
      {
        q: 'Можно ли сохранить результат или скачать его в PDF?',
        a: 'Да, каждую расшифровку можно экспортировать в PDF-файл и сохранить в разделе «Медицинская история» личного кабинета для дальнейшего сравнения показателей в динамике.',
      },
    ],
  },
  {
    title: 'Оплата и стоимость',
    items: [
      {
        q: 'Сколько стоит расшифровка анализов?',
        a: 'Разбор одного анализа стоит 190 рублей. Это разовая оплата без подписок и скрытых платежей — запрос отправляется в нейросеть только после подтверждения оплаты.',
      },
      {
        q: 'Какие способы оплаты доступны?',
        a: 'Оплата принимается банковской картой через безопасный платёжный шлюз ЮKassa.',
      },
      {
        q: 'Что если оплата прошла, а расшифровка не появилась?',
        a: 'В редких случаях подтверждение платежа занимает до нескольких минут — страница автоматически проверяет статус. Если результат не появился дольше 5 минут, напишите нам через форму обратной связи.',
      },
    ],
  },
  {
    title: 'Безопасность данных',
    items: [
      {
        q: 'Мои данные в безопасности?',
        a: 'Все данные хранятся на серверах на территории России в соответствии с 152-ФЗ о персональных данных и доступны только вам по вашему логину.',
      },
      {
        q: 'Нужно ли указывать ФИО и номер полиса?',
        a: 'Нет, сервис не запрашивает ФИО, адрес или номер медицинского полиса — для входа достаточно email.',
      },
      {
        q: 'Можно ли посмотреть историю прошлых обращений?',
        a: 'Да, в личном кабинете есть раздел «Ваша медицинская история» со всеми предыдущими расшифровками и возможностью отследить динамику показателей.',
      },
      {
        q: 'Как удалить свои данные?',
        a: 'Историю исследований можно удалить в любой момент из личного кабинета. Если нужна помощь — напишите через форму обратной связи на сайте.',
      },
    ],
  },
];

const Faq = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Частые вопросы о расшифровке анализов — ЛабГид';

    const metaDescription = document.querySelector('meta[name="description"]');
    const prevDescription = metaDescription?.getAttribute('content') || '';
    metaDescription?.setAttribute(
      'content',
      'Ответы на частые вопросы о сервисе ЛабГид: как расшифровать анализы онлайн, сколько это стоит, какие данные учитываются и как обеспечивается безопасность.'
    );

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_GROUPS.flatMap((group) =>
        group.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        }))
      ),
    });
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      metaDescription?.setAttribute('content', prevDescription);
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <section className="relative scroll-mt-20 overflow-hidden">
          <div
            className="paper-lines pointer-events-none absolute inset-0 opacity-40"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
            <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-accent">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Частые вопросы</span>
            </nav>

            <div className="mb-10 text-center">
              <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                Поддержка
              </span>
              <h1 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                Частые вопросы о{' '}
                <span className="hand-underline text-accent">расшифровке анализов</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
                Собрали ответы на самые частые вопросы о том, как ЛабГид расшифровывает анализы
                онлайн, сколько это стоит и как мы храним ваши данные.
              </p>
            </div>

            <div className="space-y-8">
              {FAQ_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="rounded-3xl border border-border bg-card p-6 md:p-8"
                >
                  <h2 className="mb-3 font-head text-lg font-bold">{group.title}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {group.items.map((item) => (
                      <AccordionItem key={item.q} value={item.q}>
                        <AccordionTrigger className="text-left text-[0.95rem] font-semibold">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[0.9rem] leading-relaxed text-ink-soft">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-accent/25 bg-card p-6 text-center md:p-8">
              <h2 className="font-head text-lg font-bold">Остался вопрос?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                Не нашли ответ — напишите нам через форму обратной связи на главной странице, мы
                ответим в ближайшее время.
              </p>
              <Link
                to="/#feedback"
                className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                Написать нам
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;
