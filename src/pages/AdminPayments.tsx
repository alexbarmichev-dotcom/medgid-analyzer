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

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

interface PaymentItem {
  id: number;
  login: string;
  email: string | null;
  gender: string | null;
  age: number | null;
  paymentId: string | null;
  paymentStatus: string;
  amount: string | null;
  status: string;
  createdAt: string;
}

interface UserItem {
  id: number;
  login: string;
  phone: string | null;
  isFree: boolean;
  createdAt: string;
  analysesCount: number;
  totalPaid: string;
}

const PAYMENT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  free: 'secondary',
  pending: 'outline',
  canceled: 'destructive',
};

const AdminPayments = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem('medgid_admin_pwd') || '');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = () => ({ 'X-Admin-Password': password });

  const tryAuth = async (pwd: string) => {
    setChecking(true);
    try {
      const res = await fetch(`${HISTORY_URL}?resource=admin&admin=payments`, {
        headers: { 'X-Admin-Password': pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.items || []);
        setAuthorized(true);
        sessionStorage.setItem('medgid_admin_pwd', pwd);
        loadUsers(pwd);
      } else {
        toast({ title: 'Неверный пароль' });
      }
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setChecking(false);
    }
  };

  const loadUsers = async (pwd: string) => {
    try {
      const res = await fetch(`${HISTORY_URL}?resource=admin&admin=users`, {
        headers: { 'X-Admin-Password': pwd },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.items || []);
    } catch {
      /* ignore */
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [resP, resU] = await Promise.all([
        fetch(`${HISTORY_URL}?resource=admin&admin=payments`, { headers: authHeaders() }),
        fetch(`${HISTORY_URL}?resource=admin&admin=users`, { headers: authHeaders() }),
      ]);
      const dataP = await resP.json();
      const dataU = await resU.json();
      if (resP.ok) setPayments(dataP.items || []);
      if (resU.ok) setUsers(dataU.items || []);
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      tryAuth(password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminNav />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">
              Платежи и пользователи
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Список всех расшифровок анализов и зарегистрированных пользователей
            </p>
          </div>
          <Button variant="outline" onClick={loadAll} disabled={loading}>
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="mb-6">
            <TabsTrigger value="payments">Платежи ({payments.length})</TabsTrigger>
            <TabsTrigger value="users">Пользователи ({users.length})</TabsTrigger>
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
                      <TableHead>Телефон</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Пол/возраст</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус оплаты</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{p.login}</TableCell>
                        <TableCell className="text-sm text-ink-soft">{p.email || '—'}</TableCell>
                        <TableCell className="text-sm text-ink-soft">
                          {p.gender === 'm' ? 'М' : p.gender === 'f' ? 'Ж' : '—'} / {p.age ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {p.amount ? `${p.amount} ₽` : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_STATUS_VARIANT[p.paymentStatus] || 'outline'}>
                            {p.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="rounded-2xl border border-border bg-card">
              {users.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">Пользователей пока нет</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Бесплатный доступ</TableHead>
                      <TableHead>Кол-во анализов</TableHead>
                      <TableHead>Оплачено всего</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{u.phone || u.login}</TableCell>
                        <TableCell>
                          {u.isFree ? (
                            <Badge variant="secondary">Да</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Нет</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.analysesCount}</TableCell>
                        <TableCell className="text-sm font-medium">{u.totalPaid} ₽</TableCell>
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

export default AdminPayments;