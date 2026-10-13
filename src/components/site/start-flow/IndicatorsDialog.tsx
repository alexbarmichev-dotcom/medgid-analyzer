import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { ChartBlock, ChartData, ChartPoint, parseChart } from '@/components/site/AnalysisMarkdown';
import { getStoredLogin, getStoredToken } from '@/lib/authStorage';
import { downloadIndicatorsPdf } from '@/lib/pdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const TARIFFS_URL = 'https://functions.poehali.dev/d75f0411-629b-4a8f-9a09-f4ffbcdcec4f';
const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';
const CHART_BLOCK_RE = /```chart\s*([\s\S]*?)```/g;

interface RawItem {
  date: string | null;
  gender?: string | null;
  age?: number | null;
  result: string | null;
}

interface Indicator extends ChartData {
  key: string;
  last: number;
  prev: number | null;
  outOfRange: boolean;
}

const toTime = (value: string) => {
  const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

const buildIndicators = (items: RawItem[]): Indicator[] => {
  const ordered = [...items].sort((a, b) => toTime(a.date || '') - toTime(b.date || ''));
  const map = new Map<string, { data: ChartData; points: Map<string, ChartPoint> }>();

  for (const item of ordered) {
    if (!item.result) continue;
    for (const match of item.result.matchAll(CHART_BLOCK_RE)) {
      const chart = parseChart(match[1]);
      if (!chart) continue;
      const key = `${chart.title.trim().toLowerCase()}|${(chart.unit || '').trim().toLowerCase()}`;
      const entry = map.get(key) || { data: chart, points: new Map<string, ChartPoint>() };
      entry.data = { ...entry.data, min: chart.min, max: chart.max, unit: chart.unit };
      for (const p of chart.points) entry.points.set(p.date, p);
      map.set(key, entry);
    }
  }

  return Array.from(map.entries()).map(([key, { data, points }]) => {
    const sorted = Array.from(points.values()).sort((a, b) => toTime(a.date) - toTime(b.date));
    const last = sorted[sorted.length - 1].value;
    const prev = sorted.length > 1 ? sorted[sorted.length - 2].value : null;
    const outOfRange =
      (data.min !== null && data.min !== undefined && last < data.min) ||
      (data.max !== null && data.max !== undefined && last > data.max);
    return { ...data, key, points: sorted, last, prev, outOfRange };
  });
};

interface IndicatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IndicatorsDialog = ({ open, onOpenChange }: IndicatorsDialogProps) => {
  const [items, setItems] = useState<RawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`${TARIFFS_URL}?resource=me`, { headers: { 'X-Authorization': getStoredToken() || '' } })
      .then((r) => r.json())
      .then((d) => setFullName(d.fullName || ''))
      .catch(() => undefined);
    fetch(HISTORY_URL, { headers: { 'X-Authorization': getStoredToken() || '' } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Не удалось загрузить показатели');
          return;
        }
        setItems(data.items || []);
      })
      .catch(() => setError('Ошибка сети, попробуйте ещё раз'))
      .finally(() => setLoading(false));
  }, [open]);

  const indicators = useMemo(() => {
    const list = buildIndicators(items);
    return list.sort(
      (a, b) => Number(b.outOfRange) - Number(a.outOfRange) || a.title.localeCompare(b.title, 'ru'),
    );
  }, [items]);

  const visible = onlyAbnormal ? indicators.filter((i) => i.outOfRange) : indicators;
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const latest = [...items]
        .sort((a, b) => toTime(b.date || '') - toTime(a.date || ''))
        .find((i) => i.gender || i.age);
      const rawLogin = getStoredLogin() || '';
      await downloadIndicatorsPdf(visible, {
        login: fullName || (rawLogin.startsWith('acct:') ? rawLogin.slice(5) : rawLogin),
        gender: latest?.gender,
        age: latest?.age,
      });
    } finally {
      setDownloading(false);
    }
  };

  const abnormalCount = indicators.filter((i) => i.outOfRange).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col overflow-hidden rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-head text-xl font-bold">
            <Icon name="LineChart" size={20} className="text-hand" />
            Мои показатели
          </DialogTitle>
          <DialogDescription>
            Динамика ваших показателей по всем разборам в личном кабинете. Данные собираются из
            графиков, которые нейросеть строит при каждой расшифровке по подписке. Это не диагноз.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Собираем показатели…</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
        ) : indicators.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="ChartNoAxesCombined" size={30} className="text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Пока нет данных для графиков. Они появятся после первой расшифровки по подписке,
              а с каждым следующим анализом линии будут удлиняться.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-hand/10 px-4 py-2.5 text-sm font-medium text-hand">
              <span>
                Показателей: {indicators.length}
                {abnormalCount > 0 && `, вне нормы: ${abnormalCount}`}
              </span>
              {abnormalCount > 0 && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={onlyAbnormal}
                    onChange={(e) => setOnlyAbnormal(e.target.checked)}
                  />
                  Только вне нормы
                </label>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || visible.length === 0}
              className="inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius)] border border-border bg-background px-5 py-2.5 text-sm font-semibold text-ink-soft disabled:opacity-60"
            >
              <Icon
                name={downloading ? 'Loader2' : 'Download'}
                size={16}
                className={downloading ? 'animate-spin' : ''}
              />
              {downloading ? 'Готовим PDF…' : 'Скачать в PDF'}
            </button>

            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {visible.map((ind) => {
                const diff = ind.prev !== null ? ind.last - ind.prev : null;
                return (
                  <div key={ind.key}>
                    <ChartBlock data={ind} />
                    <p className="-mt-2 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
                      <span className={ind.outOfRange ? 'font-semibold text-destructive' : ''}>
                        Последнее: {ind.last} {ind.unit}
                        {ind.outOfRange ? ' — вне нормы' : ''}
                      </span>
                      {diff !== null && diff !== 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name={diff > 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
                          {diff > 0 ? '+' : ''}
                          {Number(diff.toFixed(2))} к прошлому
                        </span>
                      )}
                      {diff === 0 && <span>Без изменений</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IndicatorsDialog;
