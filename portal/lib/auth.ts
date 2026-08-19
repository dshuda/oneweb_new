// Customer authentication utilities
// Uses SEPARATE cookie names (cust_token, cust_type) to avoid
// any conflict with the admin auth system (admin_token, admin_type).

const _COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cust_token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cust_refresh');
  }
  return null;
};

export const getUserId = (): number | null => {
  if (typeof window !== 'undefined') {
    const id = localStorage.getItem('cust_id');
    return id ? parseInt(id) : null;
  }
  return null;
};

export const getUserType = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cust_type');
  }
  return null;
};

// export const setTokens = (
//   accessToken: string,
//   refreshToken: string,
//   userId: number,
//   userType: string
// ) => {
//   if (typeof window !== 'undefined') {

//     var timeSpan = new Date().getTime();
//     timeSpan += 60*15*1000;

//     localStorage.setItem('cust_token', accessToken);
//     localStorage.setItem('cus_expire_at', timeSpan.toString());
//     localStorage.setItem('cust_refresh', refreshToken);
//     localStorage.setItem('cust_id', userId.toString());
//     localStorage.setItem('cust_type', userType);

//     // Set cookies for middleware (server-side) reads
//     document.cookie = `cust_token=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
//     document.cookie = `cust_type=${userType}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
//   }
// };

// export const clearTokens = () => {
//   if (typeof window !== 'undefined') {
//     localStorage.removeItem('cust_token');
//     localStorage.removeItem('cust_refresh');
//     localStorage.removeItem('cust_id');
//     localStorage.removeItem('cust_type');

//     // Expire cookies immediately
//     document.cookie = 'cust_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
//     document.cookie = 'cust_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';

//     // Also clear old cookie names in case they were set previously
//     document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
//     document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
//   }
// };
