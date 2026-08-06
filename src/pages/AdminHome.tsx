import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

const SECTIONS = [
  {
    href: '/admin/payments',
    label: 'Платежи и пользователи',
    description: 'Все расшифровки анализов, оплаты и зарегистрированные пользователи',
    icon: 'CreditCard',
  },
  {
    href: '/admin/feedback',
    label: 'Обращения',
    description: 'Вопросы, предложения и жалобы от посетителей сайта',
    icon: 'MessageSquare',
  },
  {
    href: '/admin/reviews',
    label: 'Отзывы',
    description: 'Модерация отзывов клиентов перед публикацией на главной странице',
    icon: 'Star',
  },
];

const AdminHome = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem('medgid_admin_pwd') || '');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const tryAuth = async (pwd: string) => {
    setChecking(true);
    try {
      const res = await fetch(`${HISTORY_URL}?resource=admin&admin=payments`, {
        headers: { 'X-Admin-Password': pwd },
      });
      if (res.ok) {
        sessionStorage.setItem('medgid_admin_pwd', pwd);
        setAuthorized(true);
      } else {
        toast({ title: 'Неверный пароль' });
      }
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setChecking(false);
    }
  };

  useState(() => {
    if (password) tryAuth(password);
  });

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 font-body">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
          <h1 className="font-head text-xl font-bold">Личный кабинет администратора</h1>
          <Input
            type="password"
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryAuth(password)}
          />
          <Button className="w-full" disabled={checking} onClick={() => tryAuth(password)}>
            {checking ? 'Проверяем…' : 'Войти'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">
            Личный кабинет администратора
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Все разделы управления сайтом ЛабГид в одном месте
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="group rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-hand/10 text-hand">
                <Icon name={s.icon} size={22} />
              </span>
              <h3 className="mt-4 font-head text-base font-bold">{s.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-hand">
                Перейти
                <Icon
                  name="ArrowRight"
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>

        <Button
          variant="ghost"
          className="mt-8 text-muted-foreground"
          onClick={() => {
            sessionStorage.removeItem('medgid_admin_pwd');
            navigate(0);
          }}
        >
          <Icon name="LogOut" size={15} />
          Выйти
        </Button>
      </div>
    </div>
  );
};

export default AdminHome;
