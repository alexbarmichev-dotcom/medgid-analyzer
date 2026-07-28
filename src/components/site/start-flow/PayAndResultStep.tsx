import Icon from '@/components/ui/icon';
import ReactMarkdown from 'react-markdown';

interface PayStepProps {
  analyzing: boolean;
  onPay: () => void;
  onBack: () => void;
}

export const PayStep = ({ analyzing, onPay, onBack }: PayStepProps) => {
  return (
    <div className="animate-fade-in space-y-6 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand/12 text-hand">
        <Icon name="ReceiptText" size={26} />
      </span>
      <div>
        <h3 className="font-head text-xl font-bold">Всё готово к разбору</h3>
        <p className="mt-2 text-ink-soft">
          Стоимость одного запроса — <b>250&nbsp;₽</b>. Запрос уйдёт в нейросеть после
          подтверждения оплаты.
        </p>
      </div>
      <button
        onClick={onPay}
        disabled={analyzing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {analyzing ? 'Разбираем анализ…' : 'Оплатить 250 ₽'}
        {!analyzing && <Icon name="CreditCard" size={18} />}
      </button>
      <button
        onClick={onBack}
        disabled={analyzing}
        className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        Вернуться к данным
      </button>
    </div>
  );
};

interface DoneStepProps {
  aiResult: string;
  reset: () => void;
  openHistory: () => void;
}

export const DoneStep = ({ aiResult, reset, openHistory }: DoneStepProps) => {
  return (
    <div className="animate-scale-in space-y-5">
      <div className="space-y-5 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand text-accent-foreground">
          <Icon name="Check" size={28} />
        </span>
        <h3 className="font-head text-xl font-bold">Расшифровка готова</h3>
        {aiResult ? (
          <div className="rounded-2xl border border-border bg-background p-6 text-left text-lg leading-relaxed text-ink-soft">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-xl font-bold text-foreground first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-5 text-lg font-bold text-foreground">{children}</h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-foreground">{children}</strong>
                ),
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
                ),
              }}
            >
              {aiResult}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-ink-soft">
            Нейросеть разобрала ваши показатели. Результат сохранён в личном кабинете.
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-background px-6 py-3.5 text-sm font-semibold text-ink-soft"
          >
            <Icon name="RotateCcw" size={16} />
            Отправить ещё один анализ
          </button>
          <button
            onClick={openHistory}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-hand/12 px-6 py-3.5 text-lg font-semibold text-hand"
          >
            <Icon name="FolderLock" size={20} />
            Ваша медицинская история
          </button>
        </div>
      </div>
    </div>
  );
};