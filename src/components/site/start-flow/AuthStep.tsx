import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface AuthStepProps {
  email: string;
  setEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
  codeSent: boolean;
  consent: boolean;
  setConsent: (consent: boolean) => void;
  sendingCode: boolean;
  verifying: boolean;
  emailValid: boolean;
  sendCode: () => void;
  verifyCode: () => void;
  resendCode: () => void;
}

const AuthStep = ({
  email,
  setEmail,
  code,
  setCode,
  codeSent,
  consent,
  setConsent,
  sendingCode,
  verifying,
  emailValid,
  sendCode,
  verifyCode,
  resendCode,
}: AuthStepProps) => {
  const [cooldown, setCooldown] = useState(0);

  return (
    <div className="animate-fade-in space-y-5">
      {!codeSent ? (
        <>
          <h3 className="font-head text-xl font-bold">Вход по email</h3>
          <p className="text-sm text-ink-soft">
            Пришлём код подтверждения на почту — регистрация и вход происходят автоматически.
          </p>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCode()}
            />
            {email && !emailValid && (
              <p className="text-xs text-destructive">Введите корректный email</p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(Boolean(v))}
              className="mt-0.5"
            />
            <span className="text-sm leading-snug text-ink-soft">
              Я даю согласие на обработку персональных данных в соответствии с 152-ФЗ и
              принимаю пользовательское соглашение.
            </span>
          </label>

          <button
            onClick={sendCode}
            disabled={sendingCode}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {sendingCode ? 'Отправляем код…' : 'Получить код'}
            {!sendingCode && <Icon name="ArrowRight" size={18} />}
          </button>
        </>
      ) : (
        <>
          <h3 className="font-head text-xl font-bold">Введите код из письма</h3>
          <p className="text-sm text-ink-soft">
            Код отправлен на почту <b>{email}</b>
          </p>

          <div className="space-y-2">
            <Label htmlFor="code">Код подтверждения</Label>
            <Input
              id="code"
              inputMode="numeric"
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              maxLength={4}
              className="text-center text-2xl tracking-[0.5em]"
            />
          </div>

          <button
            onClick={verifyCode}
            disabled={verifying || code.length < 4}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {verifying ? 'Проверяем…' : 'Подтвердить'}
            {!verifying && <Icon name="ArrowRight" size={18} />}
          </button>

          <button
            type="button"
            onClick={() => {
              resendCode();
              setCooldown(60);
              const timer = setInterval(() => {
                setCooldown((c) => {
                  if (c <= 1) {
                    clearInterval(timer);
                    return 0;
                  }
                  return c - 1;
                });
              }, 1000);
            }}
            disabled={cooldown > 0 || sendingCode}
            className="w-full text-center text-sm text-ink-soft hover:text-accent disabled:opacity-50"
          >
            {cooldown > 0 ? `Отправить код повторно (${cooldown} сек)` : 'Отправить код повторно'}
          </button>
        </>
      )}
    </div>
  );
};

export default AuthStep;
