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
