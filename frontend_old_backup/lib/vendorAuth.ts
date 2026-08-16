// Vendor-specific authentication utilities
// Uses separate localStorage keys to avoid conflict with other auth systems.

const VENDOR_TOKEN_KEY = 'vendor_token';
const VENDOR_TYPE_KEY = 'vendor_type';
const VENDOR_ID_KEY = 'vendor_id';
const VENDOR_REFRESH_KEY = 'vendor_refresh';


export const setVendorTokens = (
  accessToken: string,
  refreshToken: string,
  userId: number,
  userType: string
) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(VENDOR_TOKEN_KEY, accessToken);
  localStorage.setItem(VENDOR_REFRESH_KEY, refreshToken);
  localStorage.setItem(VENDOR_ID_KEY, userId.toString());
  localStorage.setItem(VENDOR_TYPE_KEY, userType);

};

export const clearVendorTokens = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(VENDOR_TOKEN_KEY);
  localStorage.removeItem(VENDOR_REFRESH_KEY);
  localStorage.removeItem(VENDOR_ID_KEY);
  localStorage.removeItem(VENDOR_TYPE_KEY);
};

export const getVendorToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VENDOR_TOKEN_KEY);
};

export const getVendorRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VENDOR_REFRESH_KEY);
};

export const getVendorId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(VENDOR_ID_KEY);
  return id ? parseInt(id) : null;
};

export const getVendorType = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VENDOR_TYPE_KEY);
};

export const isVendorLoggedIn = (): boolean => {
  return !!getVendorToken();
};
