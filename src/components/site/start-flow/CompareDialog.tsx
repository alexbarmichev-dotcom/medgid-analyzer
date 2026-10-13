import { useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { ChartData, parseChart } from '@/components/site/AnalysisMarkdown';
import type { HistoryItem } from '@/components/site/start-flow/HistoryDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const CHART_BLOCK_RE = /```chart\s*([\s\S]*?)```/g;

type Verdict = 'better' | 'worse' | 'same' | 'changed';

interface Row {
  title: string;
  unit: string;
  prev: number;
  cur: number;
  min: number | null;
  max: number | null;
  verdict: Verdict;
}

const toTime = (value: string) => {
  const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

const lastValues = (text: string | null) => {
  const map = new Map<string, { chart: ChartData; value: number }>();
  if (!text) return map;
  for (const match of text.matchAll(CHART_BLOCK_RE)) {
    const chart = parseChart(match[1]);
    if (!chart) continue;
    const sorted = [...chart.points].sort((a, b) => toTime(a.date) - toTime(b.date));
    const key = `${chart.title.trim().toLowerCase()}|${(chart.unit || '').trim().toLowerCase()}`;
    map.set(key, { chart, value: sorted[sorted.length - 1].value });
  }
  return map;
};

const distance = (v: number, min: number | null, max: number | null) => {
  if (min !== null && v < min) return min - v;
  if (max !== null && v > max) return v - max;
  return 0;
};

export const buildComparison = (current: HistoryItem, previous: HistoryItem): Row[] => {
  const a = lastValues(previous.result);
  const b = lastValues(current.result);
  const rows: Row[] = [];
  b.forEach(({ chart, value }, key) => {
    const before = a.get(key);
    if (!before) return;
    const min = chart.min ?? null;
    const max = chart.max ?? null;
    let verdict: Verdict;
    if (min === null && max === null) {
      verdict = value === before.value ? 'same' : 'changed';
    } else {
      const d1 = distance(before.value, min, max);
      const d2 = distance(value, min, max);
      verdict = d2 < d1 ? 'better' : d2 > d1 ? 'worse' : 'same';
    }
    rows.push({
      title: chart.title,
      unit: chart.unit || '',
      prev: before.value,
      cur: value,
      min,
      max,
      verdict,
    });
  });
  return rows;
};

const GROUPS: { verdict: Verdict; title: string; icon: string; tone: string }[] = [
  { verdict: 'better', title: 'Улучшились', icon: 'TrendingUp', tone: 'text-hand bg-hand/10' },
  { verdict: 'worse', title: 'Ухудшились', icon: 'TrendingDown', tone: 'text-accent bg-accent/10' },
  { verdict: 'changed', title: 'Изменились (нормы нет)', icon: 'ArrowLeftRight', tone: 'text-ink-soft bg-muted' },
  { verdict: 'same', title: 'Без изменений', icon: 'Minus', tone: 'text-ink-soft bg-muted' },
];

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: HistoryItem | null;
  previous: HistoryItem | null;
  formatDate: (iso: string | null) => string;
}

const CompareDialog = ({ open, onOpenChange, current, previous, formatDate }: CompareDialogProps) => {
  const rows = useMemo(
    () => (current && previous ? buildComparison(current, previous) : []),
    [current, previous],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-head text-xl font-bold">
            <Icon name="GitCompare" size={20} className="text-hand" />
            Сравнение разборов
          </DialogTitle>
          <DialogDescription>
            {current && previous
              ? `№${previous.number} от ${formatDate(previous.date)} → №${current.number} от ${formatDate(current.date)}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            В этих двух разборах нет общих показателей с графиками, сравнивать пока нечего.
          </p>
        ) : (
          <div className="space-y-5">
            {GROUPS.map((g) => {
              const list = rows.filter((r) => r.verdict === g.verdict);
              if (list.length === 0) return null;
              return (
                <div key={g.verdict}>
                  <h3 className="mb-2 flex items-center gap-2 font-head text-base font-bold">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${g.tone}`}>
                      <Icon name={g.icon} size={15} />
                    </span>
                    {g.title} · {list.length}
                  </h3>
                  <ul className="space-y-1.5">
                    {list.map((r) => (
                      <li
                        key={r.title + r.unit}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                      >
                        <span className="font-medium text-foreground">{r.title}</span>
                        <span className="text-ink-soft">
                          {r.prev} → <b className="text-foreground">{r.cur}</b> {r.unit}
                          {(r.min !== null || r.max !== null) && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              норма {r.min ?? '…'} – {r.max ?? '…'}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
