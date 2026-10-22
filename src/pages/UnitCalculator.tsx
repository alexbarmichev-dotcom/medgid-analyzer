import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import {
  CALC_DESC,
  CALC_FAQ,
  CALC_H1,
  CALC_LEAD,
  CALC_TITLE,
  COEF_ROWS,
  EXAMPLE_ROWS,
  INDICATORS,
  convert,
  formatNum,
  formulaText,
  parseNum,
} from '@/data/unitCalc';

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-2xl border border-border bg-card">
    <table className="w-full text-left text-[0.95rem]">
      <thead className="bg-hand/10 text-foreground">
        <tr>
          {head.map((c) => (
            <th key={c} className="px-4 py-3 font-semibold">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            {r.map((c, j) => (
              <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-foreground' : ''}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const UnitCalculator = () => {
  const [idx, setIdx] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${CALC_TITLE} — ЛабГид`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';
    if (meta) meta.content = CALC_DESC;
    window.scrollTo({ top: 0 });
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
    };
  }, []);

  const x = INDICATORS[idx];
  const from = reverse ? x.b : x.a;
  const to = reverse ? x.a : x.b;
  const num = parseNum(value);
  const valid = !isNaN(num) && num >= 0;
  const result = valid ? convert(x, num, reverse) : NaN;
  const showResult = valid && isFinite(result) && result >= 0;

  const dirBtn = (active: boolean) =>
    `flex-1 rounded-[var(--radius)] border border-accent px-4 py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-accent text-accent-foreground' : 'bg-transparent text-accent hover:bg-accent/10'
    }`;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Главная</Link>
            <span className="mx-2">/</span>
            <Link to="/spravochnik" className="hover:text-accent">Справочник</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Калькулятор единиц</span>
          </nav>

          <h1 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {CALC_H1}
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">{CALC_LEAD}</p>

          <section aria-label="Калькулятор" className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
            <label htmlFor="ind" className="mb-1.5 block text-sm text-muted-foreground">Показатель</label>
            <select
              id="ind"
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="mb-4 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {INDICATORS.map((i, n) => (
                <option key={i.name} value={n}>{i.name}</option>
              ))}
            </select>

            <div role="group" aria-label="Направление перевода" className="mb-4 flex gap-2">
              <button type="button" aria-pressed={!reverse} onClick={() => setReverse(false)} className={dirBtn(!reverse)}>
                {x.a} → {x.b}
              </button>
              <button type="button" aria-pressed={reverse} onClick={() => setReverse(true)} className={dirBtn(reverse)}>
                {x.b} → {x.a}
              </button>
            </div>

            <label htmlFor="val" className="mb-1.5 block text-sm text-muted-foreground">
              Значение, {from}
            </label>
            <input
              id="val"
              inputMode="decimal"
              autoComplete="off"
              placeholder="например, 5,5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <div aria-live="polite" className="mt-5 min-h-[2.5rem] font-head text-2xl font-extrabold">
              {showResult && `${formatNum(result)} ${to}`}
              {value.trim() !== '' && !showResult && (
                <span className="text-base font-medium text-muted-foreground">
                  Введите положительное число, при необходимости с запятой
                </span>
              )}
            </div>
            {showResult && <p className="text-sm text-muted-foreground">{formulaText(x, reverse)}</p>}
          </section>

          <h2 className="mt-10 font-head text-2xl font-extrabold">Коэффициенты перевода</h2>
          <div className="mt-4">
            <Table
              head={['Показатель', 'ммоль/л → мг/дл', 'мг/дл → ммоль/л']}
              rows={[...COEF_ROWS, ['HbA1c, % → ммоль/моль', '(% − 2,15) × 10,929', '']]}
            />
          </div>

          <h2 className="mt-10 font-head text-2xl font-extrabold">Примеры</h2>
          <div className="mt-4">
            <Table head={['Показатель', 'ммоль/л', 'мг/дл']} rows={EXAMPLE_ROWS} />
          </div>

          <h2 className="mt-10 font-head text-2xl font-extrabold">Частые вопросы</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
            {CALC_FAQ.map(([q, a]) => (
              <p key={q}>
                <strong className="text-foreground">{q}</strong> {a}
              </p>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Справочная информация, не заменяет консультацию врача. ЛабГид приводит единицы к единым значениям автоматически:{' '}
            <Link to="/#try" className="font-semibold text-accent hover:underline">загрузить бланк</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UnitCalculator;
