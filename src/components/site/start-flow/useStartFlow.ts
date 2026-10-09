import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { EMAIL_RE, LOGIN_RE, PASSWORD_RE } from '@/components/site/start-flow/AuthStep';
import { HistoryItem } from '@/components/site/start-flow/HistoryDialog';
import {
  ANALYZE_URL,
  LIMIT_TEXT,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  UploadFailed,
  abortUpload,
  fetchResume,
  formatSize,
  isAllowedFile,
  totalSize,
  uploadFiles,
} from '@/components/site/start-flow/uploadClient';
import { IncompleteOrder } from '@/components/site/start-flow/IncompleteOrders';
import { getDeviceId } from '@/lib/deviceId';
import { getStoredToken, storeSession } from '@/lib/authStorage';
import { START_FLOW_EVENT, StartIntentDetail } from '@/lib/startFlowBus';

const AUTH_URL = 'https://functions.poehali.dev/8c1cf8ce-6c17-461b-aec5-95a01638aefa';
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileIndex, setUploadFileIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [incomplete, setIncomplete] = useState<IncompleteOrder[]>([]);
  const [incompleteLoading, setIncompleteLoading] = useState(false);
  const [resumeOf, setResumeOf] = useState<string | null>(null);
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

  const loadIncomplete = async () => {
    const token = getStoredToken();
    if (!token) return;
    setIncompleteLoading(true);
    try {
      const res = await fetch(`${ANALYZE_URL}?action=incomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: '{}',
      });
      const data = await res.json();
      if (res.ok) setIncomplete(data.items || []);
    } catch {
      /* не критично */
    } finally {
      setIncompleteLoading(false);
    }
  };

  const requireReupload = (message: string) => {
    setSessionId(null);
    setFiles([]);
    setUploadProgress(null);
    setStep('form');
    toast({ title: 'Нужно загрузить анализ заново', description: message });
    loadIncomplete();
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
      loadIncomplete();
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

  // возврат по ссылке из письма: подставляем анкету, клиенту остаётся прикрепить файлы
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('resume');
    if (!resumeId) return;
    params.delete('resume');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
    fetchResume(resumeId).then((data) => {
      setTimeout(() => document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' }), 300);
      if (!data) {
        toast({ title: 'Ссылка устарела', description: 'Заполните анкету и загрузите анализ заново' });
        return;
      }
      setGender(data.gender === 'm' || data.gender === 'f' ? data.gender : '');
      setAge(data.age ? String(data.age) : '');
      setComplaints(data.complaints);
      setConditions(data.conditions);
      setMeds(data.meds);
      setEmail(data.email);
      setResumeOf(resumeId);
      if (getStoredToken()) {
        setStep('form');
        loadIncomplete();
        toast({ title: 'Анкета восстановлена', description: 'Осталось заново прикрепить фото анализов' });
      } else {
        toast({
          title: 'Анкета восстановлена',
          description: 'Войдите в кабинет и заново прикрепите фото анализов',
        });
      }
    });
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
        requireReupload(
          'Оплата не прошла, загруженные файлы удалены. Загрузите анализ ещё раз — данные анкеты сохранены в разделе «Незавершённые заказы».',
        );
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
    loadIncomplete();
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

  const startUpload = async (): Promise<string | null> => {
    const token = getStoredToken() || '';
    setUploadProgress(0);
    try {
      const id = await uploadFiles(
        token,
        files,
        { gender, age, complaints, conditions, meds, email },
        (percent, index) => {
          setUploadProgress(percent);
          setUploadFileIndex(index);
        },
        resumeOf,
      );
      setSessionId(id);
      setResumeOf(null);
      return id;
    } catch (e) {
      const err = e instanceof UploadFailed ? e : new UploadFailed('Ошибка сети', true);
      if (err.reupload) {
        requireReupload(err.message);
      } else {
        toast({ title: err.message });
      }
      return null;
    } finally {
      setUploadProgress(null);
    }
  };

  const onSubmit = async () => {
    if (!gender || !age) {
      toast({ title: 'Укажите пол и возраст' });
      return;
    }
    if (files.length === 0) {
      toast({ title: 'Загрузите фото или скан анализа' });
      return;
    }
    if (files.length > MAX_FILES || totalSize(files) > MAX_TOTAL_BYTES) {
      toast({ title: 'Слишком много файлов', description: LIMIT_TEXT });
      return;
    }
    if (sessionId && !isFree) {
      setStep('pay');
      return;
    }
    discardSession();
    const id = await startUpload();
    if (!id) return;
    if (isFree) {
      onFreeAnalyze(id);
      return;
    }
    setStep('pay');
  };

  const onFreeAnalyze = async (id: string) => {
    setAnalyzing(true);
    try {
      const token = getStoredToken() || '';
      const res = await fetch(`${ANALYZE_URL}?action=free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'reupload_required') {
          requireReupload(data.error);
        } else {
          toast({ title: data.error || 'Не удалось получить расшифровку' });
        }
        return;
      }
      setAiResult(data.result || '');
      setSessionId(null);
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
    if (!sessionId) {
      requireReupload('Файлы не найдены — загрузите анализ ещё раз.');
      return;
    }
    setAnalyzing(true);
    try {
      const token = getStoredToken() || '';
      const returnUrl = new URL(window.location.href);
      returnUrl.hash = '';

      const res = await fetch(`${ANALYZE_URL}?action=create_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ sessionId, returnUrl: returnUrl.toString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'reupload_required') {
          requireReupload(data.error);
        } else {
          toast({ title: data.error || 'Не удалось создать платёж' });
        }
        return;
      }

      if (data.alreadyPaid) {
        pollPayment(data.paymentId);
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

  const discardSession = () => {
    if (sessionId) {
      abortUpload(getStoredToken() || '', sessionId, 'Файлы заменены — загрузка отменена');
      setSessionId(null);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const bad = incoming.filter((f) => !isAllowedFile(f));
    const good = incoming.filter((f) => isAllowedFile(f));
    if (bad.length) {
      toast({
        title: 'Этот формат не подходит',
        description: 'Загружайте фото (JPG, PNG, HEIC, WEBP) или PDF',
      });
    }
    if (!good.length) return;
    const next = [...files, ...good];
    if (next.length > MAX_FILES) {
      toast({
        title: `Можно загрузить не больше ${MAX_FILES} файлов`,
        description: `Сейчас выбрано ${next.length}. Уберите лишние или выберите меньше.`,
      });
      return;
    }
    const size = totalSize(next);
    if (size > MAX_TOTAL_BYTES) {
      toast({
        title: 'Общий объём больше 50 МБ',
        description: `Выбрано ${formatSize(size)}. Уберите часть файлов или сделайте фото поменьше.`,
      });
      return;
    }
    discardSession();
    setFiles(next);
  };

  const removeFile = (index: number) => {
    discardSession();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const retryIncomplete = (order: IncompleteOrder) => {
    setGender(order.gender === 'm' || order.gender === 'f' ? order.gender : '');
    setAge(order.age ? String(order.age) : '');
    setComplaints(order.complaints);
    setConditions(order.conditions);
    setMeds(order.meds);
    setEmail(order.email);
    setFiles([]);
    setSessionId(null);
    setHistoryOpen(false);
    setStep('form');
    if (order.status === 'failed' || order.status === 'canceled') {
      setResumeOf(order.id);
    } else if (order.status !== 'awaiting_payment') {
      dismissIncomplete(order.id, true);
    }
    document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' });
    toast({ title: 'Анкета заполнена', description: 'Осталось заново прикрепить фото анализов' });
  };

  const checkIncompletePayment = (order: IncompleteOrder) => {
    if (!order.paymentId) return;
    setHistoryOpen(false);
    setStep('pay');
    document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' });
    pollPayment(order.paymentId);
  };

  const dismissIncomplete = async (id: string, silent = false) => {
    setIncomplete((prev) => prev.filter((o) => o.id !== id));
    try {
      const token = getStoredToken() || '';
      const res = await fetch(`${ANALYZE_URL}?action=dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
        body: JSON.stringify({ sessionId: id }),
      });
      if (!res.ok && !silent) {
        const data = await res.json().catch(() => ({}));
        toast({ title: data.error || 'Не удалось удалить заказ' });
        loadIncomplete();
      }
    } catch {
      /* ignore */
    }
  };

  const openHistory = () => {
    setHistoryOpen(true);
    loadHistory();
    loadIncomplete();
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
    discardSession();
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
    uploadProgress,
    uploadFileIndex,
    incomplete,
    incompleteLoading,
    removeFile,
    retryIncomplete,
    checkIncompletePayment,
    dismissIncomplete,
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