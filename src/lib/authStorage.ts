export const TOKEN_KEY = 'medgid_token';
export const LOGIN_KEY = 'medgid_login';
export const PENDING_SUB_KEY = 'medgid_pending_subscription';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getStoredLogin = (): string | null => {
  try {
    return localStorage.getItem(LOGIN_KEY);
  } catch {
    return null;
  }
};

export const PAY_RETURN_PARAM = 'pay_return';

export const savePendingPayment = (key: string, paymentId: string) => {
  try {
    localStorage.setItem(key, JSON.stringify({ id: paymentId, at: Date.now() }));
  } catch {
    /* ignore storage errors */
  }
};

export const takePendingPayment = (key: string): string | null => {
  try {
    const raw = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || Date.now() - Number(parsed.at) > 24 * 60 * 60 * 1000) return null;
    return String(parsed.id);
  } catch {
    return null;
  }
};

export const consumePayReturn = (): string | null => {
  try {
    const url = new URL(window.location.href);
    const kind = url.searchParams.get(PAY_RETURN_PARAM);
    if (!kind) return null;
    url.searchParams.delete(PAY_RETURN_PARAM);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    return kind;
  } catch {
    return null;
  }
};

export const isGuestLogin = (login: string | null): boolean =>
  !login || login.startsWith('guest:');

export const storeSession = (token: string, login: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LOGIN_KEY, login);
  } catch {
    /* ignore storage errors */
  }
};
