import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const STATUS_OPTIONS = [
  { value: 'pending', label: 'На проверке' },
  { value: 'approved', label: 'Опубликован' },
  { value: 'rejected', label: 'Отклонён' },
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

interface ReviewItem {
  id: number;
  author: string;
  role: string | null;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
}

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Icon
        key={i}
        name="Star"
        size={13}
        className={i < rating ? 'fill-accent text-accent' : 'fill-muted text-muted'}
      />
    ))}
  </div>
);

const AdminReviews = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem('medgid_admin_pwd') || '');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const authHeaders = (pwd = password) => ({ 'X-Admin-Password': pwd });

  const load = async (pwd = password, status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ resource: 'admin', admin: 'reviews' });
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`${HISTORY_URL}?${params.toString()}`, { headers: authHeaders(pwd) });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setAuthorized(true);
        sessionStorage.setItem('medgid_admin_pwd', pwd);
      } else if (res.status === 401) {
        toast({ title: 'Неверный пароль' });
        setAuthorized(false);
      } else {
        toast({ title: data.error || 'Не удалось загрузить отзывы' });
      }
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if (password) {
      setChecking(true);
      load(password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authorized) load(password, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${HISTORY_URL}?resource=reviews&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось обновить статус' });
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    }
  };

  const removeReview = async (id: number) => {
    try {
      const res = await fetch(`${HISTORY_URL}?resource=reviews&id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось удалить отзыв' });
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 font-body">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
          <h1 className="font-head text-xl font-bold">Модерация отзывов</h1>
          <Input
            type="password"
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(password)}
          />
          <Button className="w-full" disabled={checking} onClick={() => { setChecking(true); load(password); }}>
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
              Модерация отзывов
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Отзывы клиентов о расшифровке анализов — публикация на главной странице
            </p>
          </div>
          <Button variant="outline" onClick={() => load()}>
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Icon name="Loader2" size={20} className="animate-spin" />
              Загрузка...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Отзывов пока нет</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead>Текст</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {item.author}
                      {item.role && (
                        <p className="text-xs font-normal text-muted-foreground">{item.role}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stars rating={item.rating} />
                    </TableCell>
                    <TableCell className="max-w-[360px] text-sm text-ink-soft">
                      {item.text}
                    </TableCell>
                    <TableCell>
                      <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            <Badge variant={STATUS_VARIANT[item.status] || 'outline'}>
                              {STATUS_OPTIONS.find((s) => s.value === item.status)?.label ||
                                item.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReview(item.id)}
                        aria-label="Удалить отзыв"
                      >
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;