import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ReactMarkdown from 'react-markdown';
import { downloadAnalysisPdf } from '@/lib/pdf';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface HistoryItem {
  number: number;
  id: number;
  date: string | null;
  gender: string | null;
  age: number | null;
  complaints: string | null;
  conditions: string | null;
  meds: string | null;
  result: string | null;
  status: string;
}

export const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  historyLoading: boolean;
}

const HistoryDialog = ({ open, onOpenChange, history, historyLoading }: HistoryDialogProps) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (item: HistoryItem) => {
    if (!item.result) return;
    setDownloadingId(item.id);
    try {
      await downloadAnalysisPdf(item.result, {
        date: formatDate(item.date),
        gender: item.gender,
        age: item.age,
        complaints: item.complaints,
        conditions: item.conditions,
        meds: item.meds,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-head text-xl font-bold">
            <Icon name="FolderLock" size={20} className="text-hand" />
            Ваша медицинская история
          </DialogTitle>
          <DialogDescription>
            Здесь хранятся все ваши обращения и ответы нейросети. Доступ есть только у вас — по
            вашему логину.
          </DialogDescription>
        </DialogHeader>

        {historyLoading && history.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Загружаем историю…</p>
        )}

        {!historyLoading && history.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Пока нет ни одного запроса. После первого разбора анализа он появится здесь.
          </p>
        )}

        {history.length > 0 && (
          <Accordion type="single" collapsible className="space-y-2">
            {history.map((item) => {
              const question = [
                item.complaints && `Жалобы: ${item.complaints}`,
                item.conditions && `Заболевания: ${item.conditions}`,
                item.meds && `Приём лекарств: ${item.meds}`,
              ]
                .filter(Boolean)
                .join(' · ') || 'Разбор анализов без дополнительных жалоб';
              return (
                <AccordionItem
                  key={item.id}
                  value={String(item.id)}
                  className="rounded-2xl border border-border bg-background px-4"
                >
                  <AccordionTrigger className="py-3 text-left text-sm hover:no-underline">
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="flex items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                          №{item.number}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDate(item.date)}
                        </span>
                      </span>
                      <span className="pl-10 text-xs text-muted-foreground">{question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-lg leading-relaxed text-ink-soft">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ответ нейросети
                    </p>
                    {item.result ? (
                      <ReactMarkdown
                        components={{
                          h2: ({ children }) => (
                            <h2 className="mb-3 mt-6 text-xl font-bold text-foreground first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="mb-2 mt-5 text-lg font-bold text-foreground">
                              {children}
                            </h3>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-foreground">{children}</strong>
                          ),
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          ul: ({ children }) => (
                            <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
                          ),
                        }}
                      >
                        {item.result}
                      </ReactMarkdown>
                    ) : (
                      <p>Результат обрабатывается</p>
                    )}
                    {item.result && (
                      <button
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                        className="mt-2 inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm font-semibold text-ink-soft disabled:opacity-60"
                      >
                        <Icon
                          name={downloadingId === item.id ? 'Loader2' : 'Download'}
                          size={15}
                          className={downloadingId === item.id ? 'animate-spin' : ''}
                        />
                        {downloadingId === item.id ? 'Готовим PDF…' : 'Скачать в PDF'}
                      </button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoryDialog;