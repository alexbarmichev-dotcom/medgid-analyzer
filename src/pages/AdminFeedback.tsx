import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

const TYPE_LABELS: Record<string, string> = {
  question: '❓ Вопрос',
  suggestion: '💡 Предложение',
  wish: '🌟 Пожелание',
  problem: '⚠️ Критика / Проблема',
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новое' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Решено' },
  { value: 'rejected', label: 'Отклонено' },
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  in_progress: 'secondary',
  done: 'outline',
  rejected: 'destructive',
};

interface FeedbackItem {
  id: number;
  type: string;
  subject: string;
  message: string;
  screenshotUrl: string | null;
  status: string;
  createdAt: string;
}

const AdminFeedback = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ resource: 'feedback' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${HISTORY_URL}?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      } else {
        toast({ title: data.error || 'Не удалось загрузить обращения' });
      }
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${HISTORY_URL}?resource=feedback&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">
              Обращения пользователей
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Раздел «Вопросы по работе приложения» — все обращения с фильтрацией
            </p>
          </div>
          <Button variant="outline" onClick={load}>
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Тип обращения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            <div className="py-16 text-center text-muted-foreground">Обращений пока нет</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Скриншот</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {TYPE_LABELS[item.type] || item.type}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-sm font-medium">
                      {item.subject}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-ink-soft">
                      {item.message}
                    </TableCell>
                    <TableCell>
                      {item.screenshotUrl ? (
                        <a
                          href={item.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-hand hover:underline"
                        >
                          <Icon name="Image" size={14} />
                          Открыть
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            <Badge variant={STATUS_VARIANT[item.status]}>
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

export default AdminFeedback;
