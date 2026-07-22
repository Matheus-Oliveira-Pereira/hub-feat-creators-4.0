import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(resolve: (token: string) => void, reject: (error: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

type TokenRefreshListener = (token: string) => void;
let tokenRefreshListener: TokenRefreshListener | null = null;

/** Permite que código fora do axios (ex: AuthContext) saiba quando um refresh silencioso troca o token. */
export function onApiTokenRefreshed(listener: TokenRefreshListener | null) {
  tokenRefreshListener = listener;
}

type ForbiddenListener = (message?: string) => void;
let forbiddenListener: ForbiddenListener | null = null;

/** Permite que código fora do axios (ex: Template) mostre um toast quando o backend devolver 403. */
export function onApiForbidden(listener: ForbiddenListener | null) {
  forbiddenListener = listener;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        globalThis.location.href = '/login';
        throw error;
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        tokenRefreshListener?.(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        onRefreshFailed(refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        globalThis.location.href = '/login';
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      forbiddenListener?.(error.response?.data?.message);
    }

    throw error;
  }
);

export default api;
