import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Android emulator maps 10.0.2.2 to host machine's localhost; iOS simulator uses localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || `${DEFAULT_HOST}/api/v1`;

export const httpClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to outgoing requests
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh on 401 interceptor with single retry
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth routes themselves
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    const { refreshToken, updateTokens, clearSession } = useAuthStore.getState();
    if (!refreshToken) {
      await clearSession();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return httpClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(`${BASE_API_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      await updateTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return httpClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr as Error, null);
      await clearSession();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
