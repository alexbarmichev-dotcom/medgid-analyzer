import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/8c1cf8ce-6c17-461b-aec5-95a01638aefa';
const ANALYZE_URL = 'https://functions.poehali.dev/b4dfdccf-8880-4501-b296-550516223859';

type Step = 'auth' | 'form' | 'pay' | 'done';
type AuthPhase = 'phone' | 'code';

interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64 без префикса
}

const readAsBase64 = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ name: file.name, type: file.type, data: result.split(',')[1] || '' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const StartFlow = () => {
  const [step, setStep] = useState<Step>('auth');
  const [authPhase, setAuthPhase] = useState<AuthPhase>('phone');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [gender, setGender] = useState<'m' | 'f' | ''>('');
  const [age, setAge] = useState('');
  const [complaints, setComplaints] = useState('');
  const [conditions, setConditions] = useState('');
  const [meds, setMeds] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const phoneValid = phone.replace(/\D/g, '').length >= 11;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const requestCode = async () => {
    if (!phoneValid) {
      toast({ title: 'Введите корректный номер телефона' });
      return;
    }
    if (!consent) {
      toast({ title: 'Нужно согласие на обработку персональных данных' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить код' });
        return;
      }
      setAuthPhase('code');
      setCode('');
      setResendIn(60);
      toast({
        title: 'Код отправлен',
        description: data.dev_code
          ? `Тестовый режим: код ${data.dev_code}`
          : 'Введите код из SMS',
      });
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (value: string) => {
    setVerifying(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone, code: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Неверный код' });
        setCode('');
        return;
      }
      try {
        localStorage.setItem('medgid_token', data.token);
        localStorage.setItem('medgid_phone', data.phone);
      } catch {
        /* ignore storage errors */
      }
      toast({ title: 'Вход выполнен' });
      setStep('form');
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setVerifying(false);
    }
  };

  const onCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 4) verifyCode(value);
  };

  const onSubmit = () => {
    if (!gender || !age) {
      toast({ title: 'Укажите пол и возраст' });
      return;
    }
    if (files.length === 0) {
      toast({ title: 'Загрузите фото или скан анализа' });
      return;
    }
    setStep('pay');
  };

  const onPay = async () => {
    setAnalyzing(true);
    try {
      const uploaded = await Promise.all(files.map(readAsBase64));
      const token = localStorage.getItem('medgid_token') || '';
      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ gender, age, complaints, conditions, meds, files: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось получить расшифровку' });
        return;
      }
      setAiResult(data.result || '');
      toast({ title: 'Оплата пройдена', description: 'Расшифровка готова' });
      setStep('done');
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setAnalyzing(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const reset = () => {
    setStep('auth');
    setAuthPhase('phone');
    setPhone('');
    setConsent(false);
    setCode('');
    setResendIn(0);
    setGender('');
    setAge('');
    setComplaints('');
    setConditions('');
    setMeds('');
    setFiles([]);
    setAiResult('');
  };

  return (
    <section id="start" className="relative scroll-mt-20 overflow-hidden">
      <div
        className="paper-lines pointer-events-none absolute inset-0 opacity-40"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 md:px-8">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Личный кабинет
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Начните <span className="hand-underline text-accent">прямо сейчас</span>
          </h2>
        </div>

        {/* progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(['auth', 'form', 'pay', 'done'] as Step[]).map((s, i) => {
            const order = ['auth', 'form', 'pay', 'done'];
            const active = order.indexOf(step) >= i;
            return (
              <span
                key={s}
                className={`h-1.5 w-14 rounded-full transition-colors ${
                  active ? 'bg-accent' : 'bg-muted'
                }`}
              />
            );
          })}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_26px_50px_-40px_rgba(28,27,24,0.5)] md:p-9">
          {step === 'auth' && authPhase === 'phone' && (
            <div className="animate-fade-in space-y-5">
              <h3 className="font-head text-xl font-bold">Вход по номеру телефона</h3>
              <p className="text-sm text-ink-soft">
                Мы отправим код подтверждения в SMS — пароль не нужен.
              </p>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && requestCode()}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(Boolean(v))}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug text-ink-soft">
                  Я даю согласие на обработку персональных данных в соответствии с 152-ФЗ и принимаю
                  пользовательское соглашение.
                </span>
              </label>
              <button
                onClick={requestCode}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {sending ? 'Отправляем…' : 'Получить код'}
                {!sending && <Icon name="ArrowRight" size={18} />}
              </button>
            </div>
          )}

          {step === 'auth' && authPhase === 'code' && (
            <div className="animate-fade-in space-y-5 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Icon name="MessageSquareLock" size={26} fallback="MessageSquare" />
              </span>
              <div>
                <h3 className="font-head text-xl font-bold">Введите код из SMS</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Код отправлен на номер <b>{phone}</b>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={4} value={code} onChange={onCodeChange} disabled={verifying}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-14 w-14 rounded-xl border border-border bg-background text-xl font-semibold"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <p className="text-sm text-muted-foreground">Проверяем код…</p>
              )}

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={requestCode}
                  disabled={resendIn > 0 || sending}
                  className="text-sm font-medium text-accent disabled:text-muted-foreground"
                >
                  {resendIn > 0 ? `Отправить код повторно через ${resendIn} с` : 'Отправить код повторно'}
                </button>
                <button
                  onClick={() => {
                    setAuthPhase('phone');
                    setCode('');
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Изменить номер
                </button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="animate-fade-in space-y-5">
              <h3 className="font-head text-xl font-bold">Расскажите о себе</h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <div className="flex gap-2">
                    {([
                      ['m', 'Мужской'],
                      ['f', 'Женский'],
                    ] as const).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGender(v)}
                        className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                          gender === v
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-background text-ink-soft hover:border-accent/40'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Возраст</Label>
                  <Input
                    id="age"
                    inputMode="numeric"
                    placeholder="например, 34"
                    value={age}
                    onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaints">Недомогания в данный момент</Label>
                <Textarea
                  id="complaints"
                  placeholder="что беспокоит сейчас"
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Сопутствующие заболевания</Label>
                <Input
                  id="conditions"
                  placeholder="если есть"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meds">Постоянный приём лекарств</Label>
                <Input
                  id="meds"
                  placeholder="статины, антибиотики, обезболивающие, травы/БАДы"
                  value={meds}
                  onChange={(e) => setMeds(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Фото или скан анализов</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-accent/50">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Icon name="ImageUp" size={22} />
                  </span>
                  <span className="text-sm font-medium">Нажмите, чтобы загрузить</span>
                  <span className="max-w-xs text-xs leading-snug text-muted-foreground">
                    Фото можно сделать телефоном, не беспокоясь о качестве. Если нейросеть не сможет
                    прочесть — попросит переснять.
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>
                {files.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-2 text-sm text-ink-soft"
                      >
                        <Icon name="Paperclip" size={14} className="text-hand" />
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('auth')}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-background px-5 py-4 text-sm font-semibold text-ink-soft"
                >
                  <Icon name="ArrowLeft" size={16} />
                  Назад
                </button>
                <button
                  onClick={onSubmit}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
                >
                  Отправить
                  <Icon name="ArrowRight" size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="animate-fade-in space-y-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand/12 text-hand">
                <Icon name="ReceiptText" size={26} />
              </span>
              <div>
                <h3 className="font-head text-xl font-bold">Всё готово к разбору</h3>
                <p className="mt-2 text-ink-soft">
                  Стоимость одного запроса — <b>250&nbsp;₽</b>. Запрос уйдёт в нейросеть после
                  подтверждения оплаты.
                </p>
              </div>
              <button
                onClick={onPay}
                disabled={analyzing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {analyzing ? 'Разбираем анализ…' : 'Оплатить 250 ₽'}
                {!analyzing && <Icon name="CreditCard" size={18} />}
              </button>
              <button
                onClick={() => setStep('form')}
                disabled={analyzing}
                className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Вернуться к данным
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="animate-scale-in space-y-5 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand text-accent-foreground">
                <Icon name="Check" size={28} />
              </span>
              <h3 className="font-head text-xl font-bold">Расшифровка готова</h3>
              {aiResult ? (
                <div className="rounded-2xl border border-border bg-background p-5 text-left text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
                  {aiResult}
                </div>
              ) : (
                <p className="text-ink-soft">
                  Нейросеть разобрала ваши показатели. Результат сохранён в личном кабинете.
                </p>
              )}
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-background px-6 py-3.5 text-sm font-semibold text-ink-soft"
              >
                <Icon name="RotateCcw" size={16} />
                Отправить ещё один анализ
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StartFlow;