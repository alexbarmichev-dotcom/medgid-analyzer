import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getStoredToken } from '@/lib/authStorage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const CHAT_URL = 'https://functions.poehali.dev/64e5108f-542a-44e3-975b-74b42c2f7062';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  date?: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatDialog = ({ open, onOpenChange }: ChatDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [questionsLimit, setQuestionsLimit] = useState(15);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken() || '';
      const res = await fetch(`${CHAT_URL}?resource=status`, {
        headers: { 'X-Authorization': token },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось открыть чат');
        return;
      }
      setMessages(data.messages || []);
      setQuestionsUsed(data.questionsUsed);
      setQuestionsLimit(data.questionsLimit);
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      toast({ title: 'Введите вопрос' });
      return;
    }
    if (questionsUsed >= questionsLimit) {
      toast({ title: 'Лимит вопросов на этот месяц исчерпан' });
      return;
    }
    setAsking(true);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setQuestion('');
    try {
      const token = getStoredToken() || '';
      const res = await fetch(`${CHAT_URL}?action=ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось получить ответ' });
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      setQuestionsUsed(data.questionsUsed);
      setQuestionsLimit(data.questionsLimit);
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setAsking(false);
    }
  };

  const remaining = Math.max(0, questionsLimit - questionsUsed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-head text-xl font-bold">
            <Icon name="MessageCircle" size={20} className="text-hand" />
            AI-чат по вашим анализам
          </DialogTitle>
          <DialogDescription>
            По подписке «12 месяцев» доступно {questionsLimit} вопросов в месяц. Задавайте
            вопросы строго по теме разбора ваших анализов — на другие темы нейросеть не ответит.
            Ответ не является диагнозом или назначением врача.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Открываем чат…</p>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Icon name="Lock" size={28} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl bg-hand/10 px-4 py-2.5 text-sm font-medium text-hand">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="MessageCircle" size={14} />
                Осталось вопросов: {remaining} из {questionsLimit}
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-background p-4">
              {messages.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Задайте первый вопрос о своих анализах — например, «Что означает повышенный
                  холестерин при моих жалобах?»
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => (
                            <strong className="font-bold">{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Icon name="Loader2" size={14} className="animate-spin" />
                    Печатает ответ…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Например: почему у меня повышен АЛТ и что это значит?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                  }
                }}
                disabled={asking || remaining === 0}
                className="min-h-[60px] resize-none"
              />
              <button
                onClick={askQuestion}
                disabled={asking || remaining === 0 || !question.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {asking ? 'Отправляем…' : remaining === 0 ? 'Лимит вопросов исчерпан' : 'Задать вопрос'}
                {!asking && remaining > 0 && <Icon name="Send" size={16} />}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
