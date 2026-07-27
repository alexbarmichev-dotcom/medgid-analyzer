import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const LOGIN_RE = /^[a-zа-яё]{2,20}-[a-zа-яё]{2,20}$/i;

const ADJECTIVES = [
  'yasnyi', 'tikhiy', 'bystryi', 'dobryi', 'svetlyi', 'teplyi',
  'zvonkiy', 'mudryi', 'smelyi', 'yarkiy', 'vernyi', 'chutkiy',
];
const NOUNS = [
  'rassvet', 'oduvanchik', 'kedr', 'rodnik', 'goryzont', 'kolibri',
  'yantar', 'listopad', 'bereg', 'ogonek', 'compass', 'marshrut',
];

const generateLogin = () => {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}-${n}`;
};

interface AuthStepProps {
  authMode: 'register' | 'login';
  setAuthMode: (mode: 'register' | 'login') => void;
  login: string;
  setLogin: (login: string) => void;
  consent: boolean;
  setConsent: (consent: boolean) => void;
  entering: boolean;
  loginValid: boolean;
  enter: () => void;
}

const AuthStep = ({
  authMode,
  setAuthMode,
  login,
  setLogin,
  consent,
  setConsent,
  entering,
  loginValid,
  enter,
}: AuthStepProps) => {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
        <button
          type="button"
          onClick={() => {
            setAuthMode('register');
            setLogin('');
          }}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            authMode === 'register'
              ? 'bg-accent text-accent-foreground'
              : 'text-ink-soft hover:text-foreground'
          }`}
        >
          Регистрация
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('login');
            setLogin('');
          }}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            authMode === 'login'
              ? 'bg-accent text-accent-foreground'
              : 'text-ink-soft hover:text-foreground'
          }`}
        >
          Вход
        </button>
      </div>

      {authMode === 'register' ? (
        <>
          <h3 className="font-head text-xl font-bold">Придумайте логин</h3>
          <p className="text-sm text-ink-soft">
            Логин из двух слов через дефис — так меньше риск совпадений и не нужен пароль.
            Например: <b>yasnyi-rassvet</b>.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-head text-xl font-bold">Вход по логину</h3>
          <p className="text-sm text-ink-soft">
            Введите логин, который вы указали при регистрации.
          </p>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="login">Логин</Label>
        <div className="flex gap-2">
          <Input
            id="login"
            placeholder="slovo-slovo"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enter()}
          />
          {authMode === 'register' && (
            <button
              type="button"
              onClick={() => setLogin(generateLogin())}
              title="Сгенерировать логин"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] border border-border bg-background text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Icon name="Shuffle" size={16} />
            </button>
          )}
        </div>
        {login && !loginValid && (
          <p className="text-xs text-destructive">
            Формат: два слова через дефис, например yasnyi-rassvet
          </p>
        )}
      </div>

      {authMode === 'register' && (
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
      )}

      <button
        onClick={enter}
        disabled={entering}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {entering
          ? authMode === 'register'
            ? 'Регистрируем…'
            : 'Входим…'
          : authMode === 'register'
            ? 'Зарегистрироваться'
            : 'Войти'}
        {!entering && <Icon name="ArrowRight" size={18} />}
      </button>
    </div>
  );
};

export default AuthStep;
