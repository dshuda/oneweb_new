export interface AuthUser {
  /** Backend user id — present once the session came from the API. */
  id?: number;
  phone: string;
  name?: string;
}

const AUTH_KEY = 'onetap.auth.v1';
const AUTH_COOKIE = 'onetap.auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Bootstrap ("master") credentials. The API accepts this pair without sending
 * an SMS — see MasterAuth in src/OneWeb.Api/appsettings.json.
 */
export const MASTER_PHONE = '01708521990';
export const MASTER_OTP = '123456';
export const MASTER_NAME = 'Faruk Hannan';

/** Kept for older imports; the master number is the default test account. */
export const DEMO_PHONE = MASTER_PHONE;

/**
 * Whether to surface the bootstrap test credentials in the UI.
 *
 * Off unless NEXT_PUBLIC_SHOW_TEST_CREDENTIALS=true at build time, so a public
 * deploy never advertises a working login. Local development opts in via
 * website/.env.local.
 */
export const SHOW_TEST_CREDENTIALS =
  process.env.NEXT_PUBLIC_SHOW_TEST_CREDENTIALS === 'true';

/** The API issues 6-digit codes. */
export const OTP_LENGTH = 6;

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
  // localStorage) can protect the profile page. `secure` is only added over
  // HTTPS — browsers drop a Secure cookie on a plain-HTTP origin, which would
  // silently break the profile route on a non-TLS deploy.
  if (typeof document !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
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
