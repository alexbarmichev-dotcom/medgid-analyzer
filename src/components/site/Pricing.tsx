import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { getStoredToken } from '@/lib/authStorage';
import { emitStartIntent } from '@/lib/startFlowBus';

const TARIFFS_URL = 'https://functions.poehali.dev/d75f0411-629b-4a8f-9a09-f4ffbcdcec4f';
const PENDING_SUB_KEY = 'medgid_pending_subscription';

const scrollTo = (href: string) =>
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

interface Tariff {
  id: string;
  name: string;
  description: string;
  price: string;
  durationDays: number | null;
  features: string[];
  chatQuestionLimit: number | null;
}

interface MyTariff {
  tariffId: string | null;
  tariffStatus: string | null;
  tariffExpiresAt: string | null;
}

const formatPrice = (price: string, durationDays: number | null) => {
  const num = Math.round(parseFloat(price));
  if (!durationDays) return `${num.toLocaleString('ru-RU')} ₽`;
  const period = durationDays >= 300 ? 'за год' : `за ${Math.round(durationDays / 30)} мес`;
  return `${num.toLocaleString('ru-RU')} ₽ ${period}`;
};

const Pricing = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTariff, setMyTariff] = useState<MyTariff | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadTariffs = async () => {
    try {
      const res = await fetch(`${TARIFFS_URL}?resource=list`);
      const data = await res.json();
      if (res.ok) setTariffs(data.items || []);
    } catch {
      /* тихо игнорируем */
    } finally {
      setLoading(false);
    }
  };

  const loadMyTariff = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${TARIFFS_URL}?resource=me`, {
        headers: { 'X-Authorization': token },
      });
      const data = await res.json();
      if (res.ok) {
        setMyTariff({
          tariffId: data.tariffId,
          tariffStatus: data.tariffStatus,
          tariffExpiresAt: data.tariffExpiresAt,
        });
      }
    } catch {
      /* тихо игнорируем */
    }
  };

  const checkPendingSubscription = async (paymentId: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${TARIFFS_URL}?action=check_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'done') {
        toast({ title: 'Подписка активирована', description: 'Спасибо за оплату!' });
        loadMyTariff();
      } else if (res.ok && data.status === 'pending') {
        toast({ title: 'Оплата ещё не подтверждена', description: 'Обновите страницу через минуту' });
      }
    } catch {
      /* тихо игнорируем */
    }
  };

  useEffect(() => {
    loadTariffs();
    loadMyTariff();
    try {
      const pendingId = sessionStorage.getItem(PENDING_SUB_KEY);
      if (pendingId) {
        sessionStorage.removeItem(PENDING_SUB_KEY);
        checkPendingSubscription(pendingId);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (tariff: Tariff) => {
    if (tariff.id === 'one_time') {
      emitStartIntent('anonymous');
      scrollTo('#start');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      emitStartIntent('subscribe', tariff.id);
      toast({ title: 'Сначала войдите', description: 'Это займёт меньше минуты' });
      scrollTo('#start');
      return;
    }

    setPayingId(tariff.id);
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.hash = '#pricing';
      const res = await fetch(`${TARIFFS_URL}?action=create_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ tariffId: tariff.id, returnUrl: returnUrl.toString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось создать платёж' });
        return;
      }
      try {
        sessionStorage.setItem(PENDING_SUB_KEY, data.paymentId);
      } catch {
        /* ignore */
      }
      window.location.href = data.confirmationUrl;
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setPayingId(null);
    }
  };

  const isCurrentPlan = (tariffId: string) =>
    myTariff?.tariffId === tariffId &&
    (myTariff.tariffStatus === 'active' || myTariff.tariffStatus === 'one_time_used');

  return (
    <section id="pricing" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Стоимость и оплата
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Выберите свой тариф
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            От разового разбора анализа до годовой подписки с личным AI-чатом. Никаких скрытых
            платежей — вся оплата проходит через защищённую страницу ЮKassa.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2">
            {tariffs.map((tariff) => {
              const highlighted = tariff.id === 'sub_12m';
              const current = isCurrentPlan(tariff.id);
              return (
                <div
                  key={tariff.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 ${
                    highlighted
                      ? 'bg-accent text-accent-foreground'
                      : 'border border-border bg-background'
                  }`}
                >
                  {current && (
                    <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-hand px-3 py-1 text-xs font-semibold text-accent-foreground">
                      <Icon name="BadgeCheck" size={13} />
                      Ваш текущий план
                    </span>
                  )}
                  <div>
                    <p
                      className={`text-sm font-semibold uppercase tracking-wide ${
                        highlighted ? 'opacity-80' : 'text-muted-foreground'
                      }`}
                    >
                      {tariff.name}
                    </p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-head text-4xl font-extrabold tracking-[-0.03em]">
                        {formatPrice(tariff.price, tariff.durationDays)}
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-base leading-relaxed ${
                        highlighted ? 'text-accent-foreground/85' : 'text-ink-soft'
                      }`}
                    >
                      {tariff.description}
                    </p>
                    {highlighted ? (
                      <>
                        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2.5 text-sm font-medium text-accent-foreground">
                          <Icon name="KeyRound" size={16} />
                          Вход по email-коду или по своему логину и паролю
                        </p>
                        <p className="mt-4 font-medium leading-relaxed text-accent-foreground text-xl">
                          Вы начнёте понимать своё здоровье ещё до приёма у специалиста. А
                          наблюдая за динамикой показателей во времени, вы увидите не просто
                          разовый результат — а тренд. Именно он говорит о здоровье гораздо
                          больше, чем одна точка на графике. Это новый уровень диалога между вами
                          и вашим здоровьем. Понимайте своё тело. Следите за трендами в динамике,
                          а не только за статичными цифрами.
                        </p>
                      </>
                    ) : tariff.id === 'one_time' ? (
                      <>
                        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-hand/12 px-4 py-2.5 text-hand text-lg font-bold">
                          <Icon name="Unlock" size={16} />
                          Доступ свободный — без email и регистрации
                        </p>
                        <p className="mt-4 leading-relaxed text-ink-soft text-lg">
                          Отправьте скан или фото результатов лабораторных исследований: общий и
                          биохимический анализ крови, гормоны щитовидной железы, витамины, анализ
                          мочи, копрограмму и другие. Укажите возраст, пол и текущие жалобы. Запрос
                          обрабатывается нейронной сетью, специально обученной на медицинских
                          данных. Получите понятное резюме. Каждый показатель разбирается отдельно:
                          что означает, почему важен, в какую сторону отклоняется от нормы. Вы
                          также получаете рекомендации — какие дополнительные исследования стоит
                          пройти, и готовый список вопросов для врача, чтобы приём прошёл
                          максимально продуктивно.
                        </p>
                      </>
                    ) : (
                      <ul className="mt-6 space-y-3">
                        {tariff.features.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-hand/12 text-hand">
                              <Icon name="Check" size={12} />
                            </span>
                            <span className="text-sm leading-snug">{item}</span>
                          </li>
                        ))}
                        {tariff.chatQuestionLimit && (
                          <li className="flex items-start gap-2.5">
                            <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-hand/12 text-hand">
                              <Icon name="MessageCircle" size={12} />
                            </span>
                            <span className="text-sm font-semibold leading-snug">
                              AI-чат: до {tariff.chatQuestionLimit} вопросов в месяц
                            </span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelect(tariff)}
                    disabled={payingId === tariff.id || current}
                    className={`mt-8 inline-flex items-center justify-center gap-2.5 rounded-[var(--radius)] px-7 py-4 text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 ${
                      highlighted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {current
                      ? 'Уже подключён'
                      : payingId === tariff.id
                        ? 'Готовим оплату…'
                        : tariff.id === 'one_time'
                          ? 'Начать разбор'
                          : 'Оформить подписку'}
                    {!current && payingId !== tariff.id && <Icon name="ArrowRight" size={18} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Pricing;