import ReactMarkdown from 'react-markdown';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartPoint {
  date: string;
  value: number;
}

interface ChartData {
  title: string;
  unit?: string;
  min?: number | null;
  max?: number | null;
  points: ChartPoint[];
}

const parseChart = (raw: string): ChartData | null => {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.points)) return null;
    const points = data.points
      .map((p: ChartPoint) => ({ date: String(p.date), value: Number(p.value) }))
      .filter((p: ChartPoint) => Number.isFinite(p.value));
    if (points.length === 0) return null;
    return {
      title: String(data.title || 'Показатель'),
      unit: data.unit ? String(data.unit) : '',
      min: Number.isFinite(Number(data.min)) && data.min !== null ? Number(data.min) : null,
      max: Number.isFinite(Number(data.max)) && data.max !== null ? Number(data.max) : null,
      points,
    };
  } catch {
    return null;
  }
};

const ChartBlock = ({ data, fixedWidth }: { data: ChartData; fixedWidth?: number }) => {
  const values = data.points.map((p) => p.value);
  const lows = [...values, ...(data.min !== null && data.min !== undefined ? [data.min] : [])];
  const highs = [...values, ...(data.max !== null && data.max !== undefined ? [data.max] : [])];
  const lo = Math.min(...lows);
  const hi = Math.max(...highs);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.2;
  const domain: [number, number] = [Number((lo - pad).toFixed(2)), Number((hi + pad).toFixed(2))];

  const last = data.points[data.points.length - 1].value;
  const outOfRange =
    (data.min !== null && data.min !== undefined && last < data.min) ||
    (data.max !== null && data.max !== undefined && last > data.max);

  const chart = (width?: number) => (
    <LineChart
      width={width}
      height={200}
      data={data.points}
      margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#d9d6cc" />
      {data.min !== null && data.max !== null && data.min !== undefined && data.max !== undefined && (
        <ReferenceArea y1={data.min} y2={data.max} fill="#3f8f6b" fillOpacity={0.14} />
      )}
      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
      <YAxis domain={domain} tick={{ fontSize: 11 }} width={44} />
      <Tooltip formatter={(v: number) => [`${v} ${data.unit || ''}`.trim(), data.title]} />
      <Line
        type="monotone"
        dataKey="value"
        stroke={outOfRange ? '#c2410c' : '#2f6f55'}
        strokeWidth={2.5}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />
    </LineChart>
  );

  return (
    <div className="my-4 rounded-2xl border border-border bg-card p-4" style={{ breakInside: 'avoid' }}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-bold text-foreground" style={{ margin: 0 }}>
          {data.title}
          {data.unit ? `, ${data.unit}` : ''}
        </p>
        {data.min !== null && data.max !== null && data.min !== undefined && data.max !== undefined && (
          <p className="text-xs text-muted-foreground" style={{ margin: 0 }}>
            Норма: {data.min}–{data.max}
          </p>
        )}
      </div>
      {fixedWidth ? (
        chart(fixedWidth)
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          {chart()}
        </ResponsiveContainer>
      )}
    </div>
  );
};

interface AnalysisMarkdownProps {
  text: string;
  fixedChartWidth?: number;
}

const AnalysisMarkdown = ({ text, fixedChartWidth }: AnalysisMarkdownProps) => (
  <ReactMarkdown
    components={{
      h2: ({ children }) => (
        <h2 className="mb-3 mt-6 text-xl font-bold text-foreground first:mt-0">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-5 text-lg font-bold text-foreground">{children}</h3>
      ),
      strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
      pre: ({ children }) => <>{children}</>,
      code: ({ className, children }) => {
        if (className === 'language-chart') {
          const data = parseChart(String(children));
          return data ? <ChartBlock data={data} fixedWidth={fixedChartWidth} /> : null;
        }
        return <code className="rounded bg-muted px-1 py-0.5 text-sm">{children}</code>;
      },
    }}
  >
    {text}
  </ReactMarkdown>
);

export default AnalysisMarkdown;
