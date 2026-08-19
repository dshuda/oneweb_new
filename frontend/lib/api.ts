import axios, { AxiosInstance } from 'axios';
import { getAccessToken, getRefreshToken, getUserId } from '@/lib/auth';
import { getAdminToken, getAdminRefreshToken, getAdminId, setAdminTokens, clearAdminTokens } from '@/lib/adminAuth';
import { getVendorToken } from './vendorAuth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7106';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach the correct token based on whether the request is for an admin route.
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    if (!(config.data instanceof FormData)) {
      config.headers.set?.(
        "Content-Type", "application/json"
      );
    }

    // Identify requests to admin-only API endpoints
    // This should match /api/v1/admin/... but NOT /api/v1/auth/admin/login
    const isAdminApiRequest = url.includes('/v1/admin/') || (url.includes('/admin/') && !url.includes('/auth/'));

    const token = isAdminApiRequest ? getAdminToken()   : getAccessToken();

    if (token) {
      const cleanToken = token.trim();
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${cleanToken}`);
      } else {
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Handle 401 errors: try to refresh the token, otherwise redirect to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const url = originalRequest.url || '';
    const isAdminApiRequest = url.includes('/v1/admin/') || (url.includes('/admin/') && !url.includes('/auth/'));

    if (isAdminApiRequest) {
      // Admin token refresh
      const refreshToken = getAdminRefreshToken();
      const adminId = getAdminId();
      if (refreshToken && adminId) {
        try {
          const adminToken = getAdminToken();
          const response = await axios.post(
            `${BASE_URL}/api/v1/auth/refresh-token`,
            {
              userId: adminId,
              refreshToken,
            },
            {
              headers: { Authorization: `Bearer ${adminToken ? adminToken.trim() : ''}` }
            }
          );

          const { accessToken, refreshToken: newRefreshToken, userType } = response.data;
          setAdminTokens(accessToken, newRefreshToken || refreshToken, adminId, userType);

          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (refreshErr) {
          console.error("Admin refresh failed", refreshErr);
          clearAdminTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
          }
          return Promise.reject(refreshErr);
        }
      } else {
        // Missing refresh token, let it fail without loop
        return Promise.reject(error);
      }
    } else {
      // Customer token refresh
      const refreshToken = getRefreshToken();
      const userId = getUserId();
      if (refreshToken && userId) {
        try {
          const custToken = getAccessToken();
          const response = await axios.post(
            `${BASE_URL}/api/v1/auth/refresh-token`,
            {
              userId,
              refreshToken,
            },
            {
              headers: { Authorization: `Bearer ${custToken ? custToken.trim() : ''}` }
            }
          );

          const { accessToken, refreshToken: newRefreshToken, userType } = response.data;
          //setTokens(accessToken, newRefreshToken || refreshToken, userId, userType);

          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (refreshErr) {
          console.error("Customer refresh failed", refreshErr);
          //clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(refreshErr);
        }
      } else {
        //clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
