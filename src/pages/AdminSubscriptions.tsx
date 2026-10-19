import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import AdminNav from '@/components/site/AdminNav';

const TARIFFS_URL = 'https://functions.poehali.dev/d75f0411-629b-4a8f-9a09-f4ffbcdcec4f';

interface SubPayment {
  paymentId: string;
  login: string;
  tariffId: string;
  amount: string;
  status: string;
  createdAt: string | null;
  userTariffId: string | null;
  userTariffStatus: string | null;
  userExpiresAt: string | null;
}

interface Subscriber {
  login: string;
  tariffId: string;
  startedAt: string | null;
  expiresAt: string | null;
  status: string | null;
}

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Не подтверждён',
  done: 'Подписка включена',
  canceled: 'Отменён',
};

const SUB_LABEL: Record<string, string> = {
  active: 'Активна',
  expired: 'Истекла',
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU') : '—');

const AdminSubscriptions = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem('medgid_admin_pwd') || '');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payments, setPayments] = useState<SubPayment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const load = async (pwd: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${TARIFFS_URL}?resource=admin`, {
        headers: { 'X-Admin-Password': pwd },
      });
      if (!res.ok) {
        if (!silent) {
          toast(
            res.status === 429
              ? { title: 'Вход временно заблокирован', description: 'Слишком много неверных попыток. Попробуйте через 15 минут.' }
              : { title: 'Неверный пароль' },
          );
        }
        return false;
      }
      const data = await res.json();
      setPayments(data.payments || []);
      setSubscribers(data.subscribers || []);
      return true;
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const tryAuth = async (pwd: string) => {
    setChecking(true);
    const ok = await load(pwd);
    if (ok) {
      sessionStorage.setItem('medgid_admin_pwd', pwd);
      setAuthorized(true);
    }
    setChecking(false);
  };

  useEffect(() => {
    if (password) tryAuth(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = async (action: string, body: Record<string, string>) => {
    const res = await fetch(`${TARIFFS_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  const recheck = async (p: SubPayment) => {
    setBusyId(p.paymentId);
    try {
      const { ok, data } = await post('admin_check', { paymentId: p.paymentId });
      if (!ok) {
        toast({ title: data.error || 'Не удалось проверить платёж' });
        return;
      }
      const messages: Record<string, string> = {
        activated: 'Оплата найдена, подписка включена',
        already_done: 'Подписка уже была включена',
        canceled: 'Платёж отменён в ЮKassa',
        pending: 'В ЮKassa платёж ещё не оплачен',
      };
      toast({ title: messages[data.result] || 'Готово' });
      await load(password, true);
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setBusyId(null);
    }
  };

  const grant = async (p: SubPayment) => {
    if (!window.confirm(`Включить подписку вручную для ${p.login}? Проверьте, что деньги пришли.`)) {
      return;
    }
    setBusyId(p.paymentId);
    try {
      const { ok, data } = await post('admin_grant', {
        login: p.login,
        tariffId: p.tariffId,
        paymentId: p.paymentId,
      });
      if (!ok) {
        toast({ title: data.error || 'Не удалось включить подписку' });
        return;
      }
      toast({ title: 'Подписка включена вручную' });
      await load(password, true);
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setBusyId(null);
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 font-body">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
          <h1 className="font-head text-xl font-bold">Вход в админ-панель</h1>
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

  const unconfirmed = payments.filter((p) => p.status === 'pending');

  return (
    <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminNav />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">Подписки</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Попытки оплаты подписок и действующие подписчики. Неподтверждённый платёж можно
              перепроверить в ЮKassa или включить подписку вручную.
            </p>
          </div>
          <Button variant="outline" onClick={() => load(password)} disabled={loading}>
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="mb-6">
            <TabsTrigger value="payments">
              Платежи подписок ({payments.length})
              {unconfirmed.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  не подтверждено: {unconfirmed.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscribers">Подписчики ({subscribers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <div className="rounded-2xl border border-border bg-card">
              {payments.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">Платежей пока нет</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Тариф</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус платежа</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.paymentId}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {fmt(p.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{p.login}</TableCell>
                        <TableCell className="text-sm text-ink-soft">
                          {p.tariffId === 'sub_12m' ? '12 месяцев' : '3 месяца'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{p.amount} ₽</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === 'done'
                                ? 'default'
                                : p.status === 'canceled'
                                  ? 'destructive'
                                  : 'outline'
                            }
                          >
                            {PAYMENT_LABEL[p.status] || p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === p.paymentId}
                                onClick={() => recheck(p)}
                              >
                                <Icon
                                  name={busyId === p.paymentId ? 'Loader2' : 'RefreshCw'}
                                  size={14}
                                  className={busyId === p.paymentId ? 'animate-spin' : ''}
                                />
                                Проверить в ЮKassa
                              </Button>
                              <Button
                                size="sm"
                                disabled={busyId === p.paymentId}
                                onClick={() => grant(p)}
                              >
                                <Icon name="KeyRound" size={14} />
                                Включить вручную
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscribers">
            <div className="rounded-2xl border border-border bg-card">
              {subscribers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">Подписчиков пока нет</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Тариф</TableHead>
                      <TableHead>Начало</TableHead>
                      <TableHead>Действует до</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((s) => (
                      <TableRow key={s.login}>
                        <TableCell className="text-sm font-medium">{s.login}</TableCell>
                        <TableCell className="text-sm text-ink-soft">
                          {s.tariffId === 'sub_12m' ? '12 месяцев' : '3 месяца'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {fmt(s.startedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {fmt(s.expiresAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                            {SUB_LABEL[s.status || ''] || s.status || '—'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
