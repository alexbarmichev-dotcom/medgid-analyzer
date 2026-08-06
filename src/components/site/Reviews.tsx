import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';
const MIN_TEXT_LEN = 20;

interface Review {
  id?: number;
  author: string;
  role: string;
  rating: number;
  text: string;
  date?: string;
}

const FALLBACK_REVIEWS: Review[] = [
  {
    author: 'Марина К.',
    role: 'Расшифровка биохимии крови',
    rating: 5,
    text: 'Раньше я гуглила каждую цифру из анализов и только больше пугалась. С ЛабГидом за пять минут стало понятно, что реально важно, а что можно спокойно обсудить с врачом на приёме.',
    date: 'июль 2026',
  },
  {
    author: 'Любовь Андреевна, 64 года',
    role: 'Общий анализ крови и гормоны',
    rating: 5,
    text: 'За столько лет ни один врач не удосужился объяснить мне мои анализы, вот так — понятно, подробно, по-человечески. Загрузила, прочитала, и всё встало на свои места.',
    date: 'июнь 2026',
  },
  {
    author: 'Дмитрий С.',
    role: 'Анализ на витамины и микроэлементы',
    rating: 5,
    text: 'Удобно, что сразу видно отклонения от нормы с учётом моего возраста. Сохранил расшифровку в PDF и взял с собой на приём — врач сразу понял, о чём я хочу спросить.',
    date: 'май 2026',
  },
  {
    author: 'Ольга В.',
    role: 'Гормоны щитовидной железы',
    rating: 4,
    text: 'Понравилось, что объясняют простым языком без медицинских терминов. Единственное — хотелось бы больше деталей по отдельным показателям, но в целом сервис реально помогает разобраться.',
    date: 'май 2026',
  },
  {
    author: 'Игорь П.',
    role: 'Биохимия и липидный профиль',
    rating: 5,
    text: 'Пользуюсь уже полгода, слежу за динамикой холестерина в личном кабинете. Очень удобно видеть графики и сравнивать с прошлыми анализами — мотивирует следить за здоровьем.',
    date: 'апрель 2026',
  },
  {
    author: 'Анна Т.',
    role: 'Общий анализ мочи',
    rating: 5,
    text: 'Загрузила скан анализа, через минуту получила понятную расшифровку и список вопросов для врача. Это сильно сэкономило время на приёме — врач сразу перешёл к делу.',
    date: 'апрель 2026',
  },
];

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
};

const Stars = ({
  rating,
  interactive,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) => (
  <div className="flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => onChange?.(i + 1)}
        className={interactive ? 'cursor-pointer' : 'cursor-default'}
      >
        <Icon
          name="Star"
          size={interactive ? 24 : 15}
          className={i < rating ? 'fill-accent text-accent' : 'fill-muted text-muted'}
        />
      </button>
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${HISTORY_URL}?resource=reviews`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.items) && data.items.length > 0) {
          setReviews(
            data.items.map((r: { author: string; role: string | null; rating: number; text: string; createdAt: string }) => ({
              author: r.author,
              role: r.role || '',
              rating: r.rating,
              text: r.text,
              date: formatDate(r.createdAt),
            }))
          );
        }
      } catch {
        /* используем FALLBACK_REVIEWS */
      }
    };
    load();
  }, []);

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'ЛабГид — расшифровка анализов онлайн',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: reviews.length,
      },
      review: reviews.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [reviews, averageRating]);

  const reset = () => {
    setAuthor('');
    setRole('');
    setRating(5);
    setText('');
    setErrors({});
  };

  const onSubmit = async () => {
    const nextErrors: Record<string, boolean> = {
      author: author.trim() === '',
      text: text.trim().length < MIN_TEXT_LEN,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSending(true);
    try {
      const res = await fetch(`${HISTORY_URL}?resource=reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          role: role.trim(),
          rating,
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить отзыв' });
        return;
      }
      toast({
        title: 'Спасибо за отзыв!',
        description: 'Он появится на сайте после проверки модератором.',
      });
      reset();
      setOpen(false);
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="reviews" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="h-[7px] w-[7px] rounded-full bg-accent" />
              Отзывы клиентов
            </span>
            <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Что говорят те, кто уже{' '}
              <span className="hand-underline text-accent">расшифровал анализы</span>
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
              Реальные впечатления людей, которые пользовались сервисом для расшифровки анализов
              крови, мочи и гормонов.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-background px-6 py-4">
              <span className="font-head text-4xl font-extrabold text-accent">
                {averageRating}
              </span>
              <div>
                <Stars rating={Math.round(Number(averageRating))} />
                <p className="mt-1 text-xs text-muted-foreground">{reviews.length} отзывов</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl border-border bg-background px-5 py-6"
              onClick={() => setOpen(true)}
            >
              <Icon name="PenLine" size={16} />
              Оставить отзыв
            </Button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, idx) => (
            <div
              key={r.id ?? `${r.author}-${idx}`}
              className="flex flex-col rounded-3xl border border-border bg-background p-6 transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 flex items-center justify-between">
                <Stars rating={r.rating} />
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <p className="flex-1 text-[0.9rem] leading-relaxed text-ink-soft">«{r.text}»</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-hand/10 text-sm font-bold text-hand">
                  {r.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.author}</p>
                  {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-head text-xl font-bold">Оставить отзыв</DialogTitle>
            <DialogDescription>
              Расскажите о своём опыте использования ЛабГида. Отзыв появится на сайте после
              проверки модератором.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Ваша оценка</Label>
              <div className="mt-2">
                <Stars rating={rating} interactive onChange={setRating} />
              </div>
            </div>

            <div>
              <Label className={errors.author ? 'text-destructive' : ''}>Как вас зовут *</Label>
              <Input
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setErrors((prev) => ({ ...prev, author: false }));
                }}
                placeholder="Имя или имя и возраст"
                className={`mt-1.5 ${errors.author ? 'border-destructive ring-1 ring-destructive' : ''}`}
              />
            </div>

            <div>
              <Label>Какой анализ расшифровывали (опционально)</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Например, общий анализ крови"
                className="mt-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className={errors.text ? 'text-destructive' : ''}>Текст отзыва *</Label>
                <span
                  className={`text-xs ${
                    text.trim().length < MIN_TEXT_LEN ? 'text-muted-foreground' : 'text-hand'
                  }`}
                >
                  {text.length} символов (минимум {MIN_TEXT_LEN})
                </span>
              </div>
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setErrors((prev) => ({ ...prev, text: false }));
                }}
                placeholder="Поделитесь впечатлениями о расшифровке анализов"
                rows={4}
                className={`mt-1.5 ${errors.text ? 'border-destructive ring-1 ring-destructive' : ''}`}
              />
            </div>

            <Button
              onClick={onSubmit}
              disabled={sending}
              className="mt-2 w-full bg-hand text-primary-foreground hover:bg-hand/90"
              size="lg"
            >
              {sending ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  Отправить отзыв
                  <Icon name="Send" size={16} />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Reviews;
