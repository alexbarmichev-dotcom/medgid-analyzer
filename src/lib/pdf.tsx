import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
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

const renderMarkdown = (text: string) => (
  <ReactMarkdown
    components={{
      h2: ({ children }) => (
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '18px 0 10px' }}>{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '14px 0 8px' }}>{children}</h3>
      ),
      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
      p: ({ children }) => <p style={{ margin: '0 0 10px', lineHeight: 1.55 }}>{children}</p>,
      ul: ({ children }) => (
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ol>
      ),
      li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.5 }}>{children}</li>,
    }}
  >
    {text}
  </ReactMarkdown>
);

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
    setTimeout(resolve, 120);
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