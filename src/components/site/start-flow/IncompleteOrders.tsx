import Icon from '@/components/ui/icon';
import { formatDate } from '@/components/site/start-flow/HistoryDialog';

export interface IncompleteOrder {
  id: string;
  status: 'uploading' | 'ready' | 'awaiting_payment' | 'failed' | 'canceled';
  fileCount: number;
  gender: string;
  age: number | null;
  complaints: string;
  conditions: string;
  meds: string;
  email: string;
  paymentId: string | null;
  error: string | null;
  date: string | null;
}

const STATUS_LABEL: Record<IncompleteOrder['status'], { text: string; tone: string }> = {
  uploading: { text: 'Загрузка не завершена', tone: 'bg-amber-100 text-amber-800' },
  ready: { text: 'Файлы загружены, не оплачено', tone: 'bg-amber-100 text-amber-800' },
  awaiting_payment: { text: 'Ждём подтверждения оплаты', tone: 'bg-sky-100 text-sky-800' },
  failed: { text: 'Ошибка загрузки', tone: 'bg-red-100 text-red-700' },
  canceled: { text: 'Оплата не прошла', tone: 'bg-red-100 text-red-700' },
};

interface IncompleteOrdersProps {
  items: IncompleteOrder[];
  loading: boolean;
  onRetry: (order: IncompleteOrder) => void;
  onCheckPayment: (order: IncompleteOrder) => void;
  onDismiss: (id: string) => void;
}

const IncompleteOrders = ({
  items,
  loading,
  onRetry,
  onCheckPayment,
  onDismiss,
}: IncompleteOrdersProps) => {
  if (loading && items.length === 0) {
    return <p className="py-3 text-center text-sm text-muted-foreground">Проверяем заказы…</p>;
  }
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-head text-base font-bold">
        <Icon name="TriangleAlert" size={18} className="text-amber-600" />
        Незавершённые заказы
      </h3>
      <p className="text-sm text-ink-soft">
        Если загрузка или оплата сорвались, мы удаляем файлы анализов, чтобы они не хранились
        зря. Данные анкеты сохранены — останется только заново прикрепить фото.
      </p>
      <ul className="space-y-2">
        {items.map((order) => {
          const label = STATUS_LABEL[order.status] || STATUS_LABEL.failed;
          const awaiting = order.status === 'awaiting_payment';
          return (
            <li
              key={order.id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(order.date)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${label.tone}`}>
                  {label.text}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {awaiting
                  ? 'Если вы уже оплатили — нажмите «Проверить оплату», расшифровка начнётся автоматически.'
                  : order.error || 'Файлы удалены — загрузите анализ заново.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {awaiting ? (
                  <button
                    onClick={() => onCheckPayment(order)}
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                  >
                    <Icon name="RefreshCw" size={15} />
                    Проверить оплату
                  </button>
                ) : (
                  <button
                    onClick={() => onRetry(order)}
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                  >
                    <Icon name="Upload" size={15} />
                    Загрузить заново
                  </button>
                )}
                {!awaiting && (
                  <button
                    onClick={() => onDismiss(order.id)}
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm font-semibold text-ink-soft"
                  >
                    <Icon name="X" size={15} />
                    Убрать
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default IncompleteOrders;
