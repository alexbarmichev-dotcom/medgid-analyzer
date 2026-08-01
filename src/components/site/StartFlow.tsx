import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import AuthStep, { PHONE_RE } from '@/components/site/start-flow/AuthStep';
import ProfileFormStep from '@/components/site/start-flow/ProfileFormStep';
import { PayStep, DoneStep } from '@/components/site/start-flow/PayAndResultStep';
import HistoryDialog, { HistoryItem } from '@/components/site/start-flow/HistoryDialog';

const AUTH_URL = 'https://functions.poehali.dev/8c1cf8ce-6c17-461b-aec5-95a01638aefa';
const ANALYZE_URL = 'https://functions.poehali.dev/b4dfdccf-8880-4501-b296-550516223859';
const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // ~2 минуты

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

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

const compressImage = (file: File): Promise<File> =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });

const StartFlow = () => {
  const [step, setStep] = useState<Step>('auth');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [gender, setGender] = useState<'m' | 'f' | ''>('');
  const [age, setAge] = useState('');
  const [complaints, setComplaints] = useState('');
  const [conditions, setConditions] = useState('');
  const [meds, setMeds] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phoneValid = PHONE_RE.test(phone.trim());

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

  // восстановление после возврата с оплаты ЮKassa
  useEffect(() => {
    let paymentId: string | null = null;
    try {
      paymentId = sessionStorage.getItem('medgid_pending_payment');
      sessionStorage.removeItem('medgid_pending_payment');
    } catch {
      /* ignore */
    }
    if (!paymentId) return;

    const token = localStorage.getItem('medgid_token');
    if (!token) return;

    setStep('pay');
    pollPayment(paymentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const pollPayment = (paymentId: string, attempt = 0) => {
    setCheckingPayment(true);
    checkPayment(paymentId, attempt);
  };

  const checkPayment = async (paymentId: string, attempt: number) => {
    try {
      const token = localStorage.getItem('medgid_token') || '';
      const res = await fetch(`${ANALYZE_URL}?action=check_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckingPayment(false);
        toast({ title: data.error || 'Не удалось проверить оплату' });
        return;
      }

      if (data.status === 'done') {
        setCheckingPayment(false);
        setAiResult(data.result || '');
        toast({ title: 'Оплата прошла', description: 'Расшифровка готова' });
        setStep('done');
        loadHistory();
        return;
      }

      if (data.status === 'canceled') {
        setCheckingPayment(false);
        toast({ title: 'Оплата отменена', description: 'Попробуйте оплатить ещё раз' });
        return;
      }

      // pending — продолжаем опрос
      if (attempt + 1 >= POLL_MAX_ATTEMPTS) {
        setCheckingPayment(false);
        toast({
          title: 'Оплата ещё не подтверждена',
          description: 'Если вы оплатили — подождите немного и нажмите «Оплатить» снова',
        });
        return;
      }

      pollRef.current = setTimeout(() => checkPayment(paymentId, attempt + 1), POLL_INTERVAL_MS);
    } catch {
      setCheckingPayment(false);
      toast({ title: 'Ошибка сети при проверке оплаты' });
    }
  };

  const sendCode = async () => {
    if (!phoneValid) {
      toast({ title: 'Введите корректный номер телефона' });
      return;
    }
    if (!consent) {
      toast({ title: 'Нужно согласие на обработку персональных данных' });
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить код' });
        return;
      }
      setCodeSent(true);
      toast({ title: 'Код отправлен', description: 'Проверьте SMS' });
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setSendingCode(false);
    }
  };

  const resendCode = async () => {
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить код' });
        return;
      }
      toast({ title: 'Код отправлен повторно' });
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    }
  };

  const verifyCode = async () => {
    if (code.length < 4) {
      toast({ title: 'Введите код из SMS' });
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', phone: phone.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось выполнить вход' });
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
      setVerifying(false);
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
      onFreeAnalyze();
      return;
    }
    setStep('pay');
  };

  const onFreeAnalyze = async () => {
    setAnalyzing(true);
    try {
      const compressed = await Promise.all(files.map(compressImage));
      const uploaded = await Promise.all(compressed.map(readAsBase64));
      const token = localStorage.getItem('medgid_token') || '';
      const res = await fetch(`${ANALYZE_URL}?action=free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ gender, age, complaints, conditions, meds, email, files: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось получить расшифровку' });
        return;
      }
      setAiResult(data.result || '');
      toast({ title: 'Расшифровка готова' });
      setStep('done');
      loadHistory();
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setAnalyzing(false);
    }
  };

  const onPay = async () => {
    setAnalyzing(true);
    try {
      const compressed = await Promise.all(files.map(compressImage));
      const uploaded = await Promise.all(compressed.map(readAsBase64));
      const token = localStorage.getItem('medgid_token') || '';

      const returnUrl = new URL(window.location.href);
      returnUrl.hash = '';

      const res = await fetch(`${ANALYZE_URL}?action=create_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({
          gender,
          age,
          complaints,
          conditions,
          meds,
          email,
          files: uploaded,
          returnUrl: returnUrl.toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось создать платёж' });
        return;
      }

      try {
        sessionStorage.setItem('medgid_pending_payment', data.paymentId);
      } catch {
        /* ignore */
      }
      window.location.href = data.confirmationUrl;
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
    setPhone('');
    setCode('');
    setCodeSent(false);
    setConsent(false);
    setGender('');
    setAge('');
    setComplaints('');
    setConditions('');
    setMeds('');
    setEmail('');
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
              className="inline-flex items-center gap-2 text-lg font-semibold text-hand hover:underline"
            >
              <Icon name="FolderLock" size={20} />
              Ваша медицинская история
            </button>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_26px_50px_-40px_rgba(28,27,24,0.5)] md:p-9">
          {step === 'auth' && (
            <AuthStep
              phone={phone}
              setPhone={setPhone}
              code={code}
              setCode={setCode}
              codeSent={codeSent}
              consent={consent}
              setConsent={setConsent}
              sendingCode={sendingCode}
              verifying={verifying}
              phoneValid={phoneValid}
              sendCode={sendCode}
              verifyCode={verifyCode}
              resendCode={resendCode}
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
              email={email}
              setEmail={setEmail}
              files={files}
              addFiles={addFiles}
              analyzing={analyzing}
              onBack={() => setStep('auth')}
              onSubmit={onSubmit}
            />
          )}

          {step === 'pay' && (
            <PayStep
              analyzing={analyzing}
              checkingPayment={checkingPayment}
              onPay={onPay}
              onBack={() => setStep('form')}
            />
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