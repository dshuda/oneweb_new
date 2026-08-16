export interface AuthUser {
  phone: string;
  name?: string;
}

const AUTH_KEY = 'onetap.auth.v1';
const AUTH_COOKIE = 'onetap.auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Default demo account used for checking the login flow. */
export const DEMO_PHONE = '01700000000';

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors.
  }
}

export function loadAuthUser(): AuthUser | null {
  return read<AuthUser>(AUTH_KEY);
}

export function saveAuthUser(user: AuthUser): void {
  write(AUTH_KEY, user);
  // Mirror the session in a cookie so route middleware (which cannot read
  // localStorage) can protect the profile page.
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax; secure`;
  }
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  }
}

/** Bangladeshi mobile numbers: 11 digits starting with 01. */
export function isValidPhone(phone: string): boolean {
  return /^01\d{9}$/.test(phone.replace(/\s/g, ''));
}
