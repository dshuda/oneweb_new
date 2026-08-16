import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:5102');

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers?.set?.('Content-Type', 'application/json');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
export { BASE_URL };

