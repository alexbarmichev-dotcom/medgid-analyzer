import { createRoot } from 'react-dom/client';
import AnalysisMarkdown, { ChartBlock, ChartData } from '@/components/site/AnalysisMarkdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisMeta {
  date?: string | null;
  gender?: string | null;
  age?: number | string | null;
  complaints?: string | null;
  conditions?: string | null;
  meds?: string | null;
}

const renderMarkdown = (text: string) => <AnalysisMarkdown text={text} fixedChartWidth={690} />;

export const downloadAnalysisPdf = async (result: string, meta: AnalysisMeta = {}) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.width = '760px';
  container.style.background = '#ffffff';
  container.style.padding = '32px';
  container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
  container.style.color = '#1c1b18';
  document.body.appendChild(container);

  const genderLabel = meta.gender === 'm' ? 'Мужской' : meta.gender === 'f' ? 'Женский' : '—';
  const infoLines = [
    meta.date && `Дата: ${meta.date}`,
    `Пол: ${genderLabel}`,
    meta.age && `Возраст: ${meta.age}`,
    meta.complaints && `Жалобы: ${meta.complaints}`,
    meta.conditions && `Сопутствующие заболевания: ${meta.conditions}`,
    meta.meds && `Постоянный приём лекарств: ${meta.meds}`,
  ].filter(Boolean) as string[];

  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>ЛабГид</h1>
        <p style={{ fontSize: 13, color: '#6b6b63', margin: '0 0 18px' }}>
          Расшифровка анализа нейросетью
        </p>
        {infoLines.length > 0 && (
          <div
            style={{
              background: '#f4f2ec',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {infoLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 14 }}>{renderMarkdown(result)}</div>
        <p style={{ marginTop: 28, fontSize: 11, color: '#9a9890' }}>
          ЛабГид не ставит диагнозы и не заменяет очную консультацию врача.
        </p>
      </div>,
    );
    setTimeout(resolve, 400);
  });

  const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const filename = `medgid-analiz-${meta.date ? meta.date.replace(/[.\s:]/g, '-') : Date.now()}.pdf`;
  pdf.save(filename);
};

export interface IndicatorForPdf extends ChartData {
  last: number;
  prev: number | null;
  outOfRange: boolean;
}

export interface PdfProfile {
  login?: string | null;
  gender?: string | null;
  age?: number | null;
}

export const downloadIndicatorsPdf = async (
  indicators: IndicatorForPdf[],
  profile: PdfProfile = {},
) => {
  const profileLines = [
    profile.login && `Клиент: ${profile.login}`,
    profile.gender === 'm' ? 'Пол: мужской' : profile.gender === 'f' ? 'Пол: женский' : null,
    profile.age ? `Возраст: ${profile.age}` : null,
  ].filter(Boolean) as string[];

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.width = '760px';
  container.style.background = '#ffffff';
  container.style.padding = '32px';
  container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
  container.style.color = '#1c1b18';
  document.body.appendChild(container);

  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      <div>
        <div data-pdf-block style={{ paddingBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>ЛабГид</h1>
          <p style={{ fontSize: 13, color: '#6b6b63', margin: 0 }}>
            Динамика показателей на {new Date().toLocaleDateString('ru-RU')}
          </p>
          {profileLines.length > 0 && (
            <div
              style={{
                background: '#f4f2ec',
                borderRadius: 12,
                padding: '10px 14px',
                marginTop: 12,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {profileLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>
        {indicators.map((ind, i) => {
          const diff = ind.prev !== null ? Number((ind.last - ind.prev).toFixed(2)) : null;
          return (
            <div data-pdf-block key={i} style={{ paddingBottom: 14 }}>
              <ChartBlock data={ind} fixedWidth={690} />
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 11,
                  margin: '4px 0 8px',
                }}
              >
                <thead>
                  <tr style={{ background: '#f4f2ec', textAlign: 'left' }}>
                    <th style={{ padding: '4px 8px' }}>Дата</th>
                    <th style={{ padding: '4px 8px' }}>Значение{ind.unit ? `, ${ind.unit}` : ''}</th>
                    <th style={{ padding: '4px 8px' }}>Норма</th>
                    <th style={{ padding: '4px 8px' }}>Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {ind.points.map((pt, j) => {
                    const low = ind.min !== null && ind.min !== undefined && pt.value < ind.min;
                    const high = ind.max !== null && ind.max !== undefined && pt.value > ind.max;
                    const hasRange =
                      (ind.min !== null && ind.min !== undefined) ||
                      (ind.max !== null && ind.max !== undefined);
                    return (
                      <tr key={j} style={{ borderBottom: '1px solid #e6e3da' }}>
                        <td style={{ padding: '4px 8px' }}>{pt.date}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 700 }}>{pt.value}</td>
                        <td style={{ padding: '4px 8px', color: '#6b6b63' }}>
                          {hasRange ? `${ind.min ?? '…'} – ${ind.max ?? '…'}` : '—'}
                        </td>
                        <td
                          style={{
                            padding: '4px 8px',
                            color: low || high ? '#b3261e' : '#2f7a57',
                            fontWeight: low || high ? 700 : 400,
                          }}
                        >
                          {low ? 'ниже нормы' : high ? 'выше нормы' : hasRange ? 'в норме' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p
                style={{
                  fontSize: 12,
                  margin: '-6px 0 0',
                  color: ind.outOfRange ? '#b3261e' : '#6b6b63',
                  fontWeight: ind.outOfRange ? 700 : 400,
                }}
              >
                Последнее: {ind.last} {ind.unit}
                {ind.outOfRange ? ' — вне нормы' : ''}
                {diff !== null && diff !== 0 ? `; изменение к прошлому: ${diff > 0 ? '+' : ''}${diff}` : ''}
              </p>
            </div>
          );
        })}
        <p style={{ marginTop: 16, fontSize: 11, color: '#9a9890' }}>
          ЛабГид не ставит диагнозы и не заменяет очную консультацию врача.
        </p>
      </div>,
    );
    setTimeout(resolve, 600);
  });

  const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-block]'));
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const drawWidth = pageWidth - margin * 2;
  let y = margin;

  for (const block of blocks) {
    const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff' });
    const h = (canvas.height * drawWidth) / canvas.width;
    if (y + h > pageHeight - margin && y > margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, y, drawWidth, h);
    y += h;
  }

  root.unmount();
  document.body.removeChild(container);
  pdf.save(`medgid-pokazateli-${new Date().toISOString().slice(0, 10)}.pdf`);
};
