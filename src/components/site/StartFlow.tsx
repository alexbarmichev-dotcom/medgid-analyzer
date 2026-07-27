import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import AuthStep, { LOGIN_RE } from '@/components/site/start-flow/AuthStep';
import ProfileFormStep from '@/components/site/start-flow/ProfileFormStep';
import { PayStep, DoneStep } from '@/components/site/start-flow/PayAndResultStep';
import HistoryDialog, { HistoryItem } from '@/components/site/start-flow/HistoryDialog';

const AUTH_URL = 'https://functions.poehali.dev/8c1cf8ce-6c17-461b-aec5-95a01638aefa';
const ANALYZE_URL = 'https://functions.poehali.dev/b4dfdccf-8880-4501-b296-550516223859';
const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

type Step = 'auth' | 'form' | 'pay' | 'done';

interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64 без префикса
}

const readAsBase64 = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ name: file.name, type: file.type, data: result.split(',')[1] || '' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const StartFlow = () => {
  const [step, setStep] = useState<Step>('auth');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [login, setLogin] = useState('');
  const [consent, setConsent] = useState(false);
  const [entering, setEntering] = useState(false);
  const [gender, setGender] = useState<'m' | 'f' | ''>('');
  const [age, setAge] = useState('');
  const [complaints, setComplaints] = useState('');
  const [conditions, setConditions] = useState('');
  const [meds, setMeds] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isFree, setIsFree] = useState(false);

  const loginValid = LOGIN_RE.test(login.trim());

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('medgid_token') || '';
      const res = await fetch(HISTORY_URL, {
        headers: { 'X-Authorization': token },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.items || []);
      }
    } catch {
      /* тихо игнорируем — история не критична для основного сценария */
    } finally {
      setHistoryLoading(false);
    }
  };

  const enter = async () => {
    if (!loginValid) {
      toast({ title: 'Логин должен состоять из двух слов через дефис, например yasnyi-rassvet' });
      return;
    }
    if (authMode === 'register' && !consent) {
      toast({ title: 'Нужно согласие на обработку персональных данных' });
      return;
    }
    setEntering(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: authMode, login: login.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось выполнить запрос' });
        return;
      }
      try {
        localStorage.setItem('medgid_token', data.token);
        localStorage.setItem('medgid_login', data.login);
      } catch {
        /* ignore storage errors */
      }
      setIsFree(Boolean(data.isFree));
      toast({ title: 'Добро пожаловать!' });
      loadHistory();
      setStep('form');
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setEntering(false);
    }
  };

  const onSubmit = () => {
    if (!gender || !age) {
      toast({ title: 'Укажите пол и возраст' });
      return;
    }
    if (files.length === 0) {
      toast({ title: 'Загрузите фото или скан анализа' });
      return;
    }
    if (isFree) {
      onPay();
      return;
    }
    setStep('pay');
  };

  const onPay = async () => {
    setAnalyzing(true);
    try {
      const uploaded = await Promise.all(files.map(readAsBase64));
      const token = localStorage.getItem('medgid_token') || '';
      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ gender, age, complaints, conditions, meds, files: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось получить расшифровку' });
        return;
      }
      setAiResult(data.result || '');
      toast({ title: 'Оплата пройдена', description: 'Расшифровка готова' });
      setStep('done');
      loadHistory();
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setAnalyzing(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const openHistory = () => {
    setHistoryOpen(true);
    loadHistory();
  };

  const reset = () => {
    setStep('auth');
    setAuthMode('register');
    setLogin('');
    setConsent(false);
    setGender('');
    setAge('');
    setComplaints('');
    setConditions('');
    setMeds('');
    setFiles([]);
    setAiResult('');
    setHistory([]);
    setIsFree(false);
  };

  return (
    <section id="start" className="relative scroll-mt-20 overflow-hidden">
      <div
        className="paper-lines pointer-events-none absolute inset-0 opacity-40"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 md:px-8">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Личный кабинет
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Начните <span className="hand-underline text-accent">прямо сейчас</span>
          </h2>
        </div>

        {/* progress */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {(['auth', 'form', 'pay', 'done'] as Step[]).map((s, i) => {
            const order = ['auth', 'form', 'pay', 'done'];
            const active = order.indexOf(step) >= i;
            return (
              <span
                key={s}
                className={`h-1.5 w-14 rounded-full transition-colors ${
                  active ? 'bg-accent' : 'bg-muted'
                }`}
              />
            );
          })}
        </div>

        {step !== 'auth' && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={openHistory}
              className="inline-flex items-center gap-2 text-sm font-medium text-hand hover:underline"
            >
              <Icon name="FolderLock" size={15} />
              Ваша медицинская история
            </button>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_26px_50px_-40px_rgba(28,27,24,0.5)] md:p-9">
          {step === 'auth' && (
            <AuthStep
              authMode={authMode}
              setAuthMode={setAuthMode}
              login={login}
              setLogin={setLogin}
              consent={consent}
              setConsent={setConsent}
              entering={entering}
              loginValid={loginValid}
              enter={enter}
            />
          )}

          {step === 'form' && (
            <ProfileFormStep
              isFree={isFree}
              gender={gender}
              setGender={setGender}
              age={age}
              setAge={setAge}
              complaints={complaints}
              setComplaints={setComplaints}
              conditions={conditions}
              setConditions={setConditions}
              meds={meds}
              setMeds={setMeds}
              files={files}
              addFiles={addFiles}
              analyzing={analyzing}
              onBack={() => setStep('auth')}
              onSubmit={onSubmit}
            />
          )}

          {step === 'pay' && (
            <PayStep analyzing={analyzing} onPay={onPay} onBack={() => setStep('form')} />
          )}

          {step === 'done' && (
            <DoneStep aiResult={aiResult} reset={reset} openHistory={openHistory} />
          )}
        </div>
      </div>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        historyLoading={historyLoading}
      />
    </section>
  );
};

export default StartFlow;
