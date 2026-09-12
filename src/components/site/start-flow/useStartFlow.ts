import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { EMAIL_RE, LOGIN_RE, PASSWORD_RE } from '@/components/site/start-flow/AuthStep';
import { HistoryItem } from '@/components/site/start-flow/HistoryDialog';
import { compressImage, readAsBase64 } from '@/components/site/start-flow/fileHelpers';
import { getDeviceId } from '@/lib/deviceId';
import { getStoredToken, storeSession } from '@/lib/authStorage';
import { START_FLOW_EVENT, StartIntentDetail } from '@/lib/startFlowBus';

const AUTH_URL = 'https://functions.poehali.dev/8c1cf8ce-6c17-461b-aec5-95a01638aefa';
const ANALYZE_URL = 'https://functions.poehali.dev/b4dfdccf-8880-4501-b296-550516223859';
const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // ~2 минуты

export type Step = 'auth' | 'form' | 'pay' | 'done';
export type AuthMode = 'anonymous' | 'account';

export const useStartFlow = () => {
  const [step, setStep] = useState<Step>('auth');
  const [intent, setIntent] = useState<StartIntentDetail['intent'] | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordConsent, setPasswordConsent] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);
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

  const authEmailValid = EMAIL_RE.test(authEmail.trim());
  const passwordLoginValid =
    LOGIN_RE.test(loginValue.trim()) && PASSWORD_RE.test(passwordValue) && passwordConsent;

  const authMode: AuthMode = intent === 'anonymous' ? 'anonymous' : 'account';

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = getStoredToken() || '';
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

  const performAnonymousLogin = async () => {
    setAnonymousLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'anonymous', deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось получить доступ' });
        return;
      }
      storeSession(data.token, data.login);
      setIsFree(Boolean(data.isFree));
      toast({ title: 'Доступ свободный', description: 'Верификация не требуется' });
      loadHistory();
      setStep('form');
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setAnonymousLoading(false);
    }
  };

  // обрабатываем выбор тарифа в блоке цен: разовая оплата — свободный доступ,
  // подписка — переход к форме входа
  useEffect(() => {
    const onIntent = (e: Event) => {
      const detail = (e as CustomEvent<StartIntentDetail>).detail;
      setIntent(detail.intent);
      if (detail.intent === 'anonymous') {
        if (getStoredToken()) {
          setStep('form');
        } else {
          setStep('auth');
          performAnonymousLogin();
        }
      } else {
        setStep('auth');
      }
    };
    window.addEventListener(START_FLOW_EVENT, onIntent);
    return () => window.removeEventListener(START_FLOW_EVENT, onIntent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const token = getStoredToken();
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
      const token = getStoredToken() || '';
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
    if (!authEmailValid) {
      toast({ title: 'Введите корректный email' });
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
        body: JSON.stringify({ action: 'send_code', email: authEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось отправить код' });
        return;
      }
      setCodeSent(true);
      toast({ title: 'Код отправлен', description: 'Проверьте почту' });
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
        body: JSON.stringify({ action: 'send_code', email: authEmail.trim() }),
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

  const onAuthSuccess = (token: string, login: string, isFreeFlag: boolean) => {
    storeSession(token, login);
    setIsFree(isFreeFlag);
    setEmail((prev) => prev || authEmail.trim());
    loadHistory();
    if (intent === 'subscribe') {
      toast({ title: 'Добро пожаловать!', description: 'Теперь нажмите «Оформить подписку»' });
      document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast({ title: 'Добро пожаловать!' });
    }
    setStep('form');
  };

  const verifyCode = async () => {
    if (code.length < 4) {
      toast({ title: 'Введите код из письма' });
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', email: authEmail.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось выполнить вход' });
        return;
      }
      onAuthSuccess(data.token, data.login, Boolean(data.isFree));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setVerifying(false);
    }
  };

  const passwordLogin = async () => {
    if (!passwordLoginValid) {
      toast({ title: 'Проверьте логин, пароль и согласие' });
      return;
    }
    setPasswordSubmitting(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password_login',
          login: loginValue.trim(),
          password: passwordValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Не удалось выполнить вход' });
        return;
      }
      onAuthSuccess(data.token, data.login, Boolean(data.isFree));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setPasswordSubmitting(false);
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
      const token = getStoredToken() || '';
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
      const token = getStoredToken() || '';

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
    setAuthEmail('');
    setCode('');
    setCodeSent(false);
    setConsent(false);
    setLoginValue('');
    setPasswordValue('');
    setPasswordConsent(false);
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
    // если сессия уже есть — не заставляем входить заново
    setStep(getStoredToken() ? 'form' : 'auth');
  };

  return {
    step,
    setStep,
    authMode,
    anonymousLoading,
    authEmail,
    setAuthEmail,
    code,
    setCode,
    codeSent,
    consent,
    setConsent,
    sendingCode,
    verifying,
    loginValue,
    setLoginValue,
    passwordValue,
    setPasswordValue,
    passwordConsent,
    setPasswordConsent,
    passwordLoginValid,
    passwordSubmitting,
    passwordLogin,
    gender,
    setGender,
    age,
    setAge,
    complaints,
    setComplaints,
    conditions,
    setConditions,
    meds,
    setMeds,
    email,
    setEmail,
    files,
    analyzing,
    checkingPayment,
    aiResult,
    history,
    historyLoading,
    historyOpen,
    setHistoryOpen,
    isFree,
    authEmailValid,
    sendCode,
    resendCode,
    verifyCode,
    onSubmit,
    onPay,
    addFiles,
    openHistory,
    reset,
  };
};
