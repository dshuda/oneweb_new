// Admin-specific authentication utilities
// Uses separate cookie names (admin_token, admin_type) to avoid
// any conflict with the customer auth system (cust_token, cust_type).

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_TYPE_KEY = 'admin_type';
const ADMIN_ID_KEY = 'admin_id';
const ADMIN_REFRESH_KEY = 'admin_refresh';

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const setAdminTokens = (
  accessToken: string,
  refreshToken: string,
  userId: number,
  userType: string
) => {
  if (typeof window === 'undefined') return;

  // Save to localStorage for client-side reads
  localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
  localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken);
  localStorage.setItem(ADMIN_ID_KEY, userId.toString());
  localStorage.setItem(ADMIN_TYPE_KEY, userType);

  // Set cookies at root path so middleware can read them for all /admin/* routes
  document.cookie = `${ADMIN_TOKEN_KEY}=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${ADMIN_TYPE_KEY}=${userType}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
};

export const clearAdminTokens = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
  localStorage.removeItem(ADMIN_ID_KEY);
  localStorage.removeItem(ADMIN_TYPE_KEY);

  // Expire cookies immediately
  document.cookie = `${ADMIN_TOKEN_KEY}=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  document.cookie = `${ADMIN_TYPE_KEY}=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  // Also clear from root path in case they were set there previously
  document.cookie = `${ADMIN_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  document.cookie = `${ADMIN_TYPE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
};

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const getAdminRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_REFRESH_KEY);
};

export const getAdminId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(ADMIN_ID_KEY);
  return id ? parseInt(id) : null;
};

export const getAdminType = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TYPE_KEY);
};

export const isAdminLoggedIn = (): boolean => {
  return !!getAdminToken();
};
