import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

const TYPES = [
  { value: 'question', label: 'Вопрос', emoji: '❓' },
  { value: 'suggestion', label: 'Предложение', emoji: '💡' },
  { value: 'wish', label: 'Пожелание', emoji: '🌟' },
  { value: 'problem', label: 'Критика / Проблема', emoji: '⚠️' },
] as const;

const FAQ = [
  {
    q: 'Как получить расшифровку анализов?',
    a: 'Войдите в личный кабинет, укажите пол, возраст и загрузите фото или скан анализа — ИИ подготовит расшифровку в течение минуты.',
  },
  {
    q: 'Мои данные в безопасности?',
    a: 'Все данные хранятся на серверах в России в соответствии с 152-ФЗ и доступны только вам по вашему логину.',
  },
  {
    q: 'Можно ли посмотреть историю прошлых обращений?',
    a: 'Да, в личном кабинете есть раздел «Ваша медицинская история» со всеми предыдущими расшифровками.',
  },
  {
    q: 'Что делать, если приложение работает некорректно?',
    a: 'Опишите проблему в форме ниже, выбрав тип обращения «Критика / Проблема» — мы разберёмся в ближайшее время.',
  },
];

const MAX_SCREENSHOT_MB = 5;
const MIN_MESSAGE_LEN = 20;

const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Feedback = () => {
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  const isValid = type !== '' && subject.trim() !== '' && message.trim().length >= MIN_MESSAGE_LEN;

  const onScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SCREENSHOT_MB * 1024 * 1024) {
      toast({ title: `Файл больше ${MAX_SCREENSHOT_MB} МБ, выберите другой` });
      e.target.value = '';
      return;
    }
    setScreenshot(file);
  };

  const reset = () => {
    setType('');
    setSubject('');
    setMessage('');
    setScreenshot(null);
    setErrors({});
  };

  const onSubmit = async () => {
    const nextErrors: Record<string, boolean> = {
      type: type === '',
      subject: subject.trim() === '',
      message: message.trim().length < MIN_MESSAGE_LEN,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSending(true);
    try {
      let screenshotPayload: { data: string; mime: string } | undefined;
      if (screenshot) {
        screenshotPayload = { data: await readAsBase64(screenshot), mime: screenshot.type || 'image/png' };
      }
      const res = await fetch(`${HISTORY_URL}?resource=feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          screenshot: screenshotPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить сообщение' });
        return;
      }
      toast({
        title: 'Спасибо! Ваше сообщение получено.',
        description: 'Мы рассмотрим его в ближайшее время.',
      });
      reset();
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="feedback" className="scroll-mt-20 bg-card">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-hand" />
            Поддержка
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Вопросы по <span className="hand-underline text-hand">работе приложения</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
            Есть вопрос, идея или заметили проблему? Загляните в частые вопросы или напишите нам
            напрямую — ответим как можно скорее.
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-border bg-background p-6 md:p-8">
          <h3 className="mb-3 font-head text-lg font-bold">Частые вопросы</h3>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item) => (
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

        <div className="rounded-3xl border border-border bg-background p-6 shadow-[0_26px_50px_-40px_rgba(28,27,24,0.5)] md:p-9">
          <h3 className="mb-6 font-head text-lg font-bold">Форма обратной связи</h3>

          <div className="grid gap-5">
            <div>
              <Label className={errors.type ? 'text-destructive' : ''}>Тип обращения *</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v);
                  setErrors((prev) => ({ ...prev, type: false }));
                }}
              >
                <SelectTrigger
                  className={`mt-1.5 ${errors.type ? 'border-destructive ring-1 ring-destructive' : ''}`}
                >
                  <SelectValue placeholder="Выберите тип обращения" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="mr-2">{t.emoji}</span>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={errors.subject ? 'text-destructive' : ''}>Тема сообщения *</Label>
              <input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((prev) => ({ ...prev, subject: false }));
                }}
                placeholder="Коротко опишите суть обращения"
                className={`mt-1.5 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  errors.subject ? 'border-destructive ring-1 ring-destructive' : 'border-input'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className={errors.message ? 'text-destructive' : ''}>
                  Текст сообщения *
                </Label>
                <span
                  className={`text-xs ${
                    message.trim().length < MIN_MESSAGE_LEN ? 'text-muted-foreground' : 'text-hand'
                  }`}
                >
                  {message.length} символов (минимум {MIN_MESSAGE_LEN})
                </span>
              </div>
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((prev) => ({ ...prev, message: false }));
                }}
                placeholder="Опишите ваш вопрос, предложение или проблему подробнее"
                rows={5}
                className={`mt-1.5 ${errors.message ? 'border-destructive ring-1 ring-destructive' : ''}`}
              />
            </div>

            <div>
              <Label>Скриншот (опционально, до {MAX_SCREENSHOT_MB} МБ)</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
                  <Icon name="Paperclip" size={16} />
                  Прикрепить файл
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onScreenshotChange}
                  />
                </label>
                {screenshot && (
                  <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                    <Icon name="FileImage" size={16} />
                    {screenshot.name}
                    <button
                      onClick={() => setScreenshot(null)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Убрать файл"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={onSubmit}
              disabled={!isValid || sending}
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
                  Отправить
                  <Icon name="Send" size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feedback;