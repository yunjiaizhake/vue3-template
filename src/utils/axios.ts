import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getCookie } from '@/utils/storage';

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  timeout: 10_000,
});

service.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    }
    return Promise.reject(response);
  },
  (error) => {
    return error;
  },
);

export type RequestConfig<T = unknown> = AxiosRequestConfig<T>;

function withCookie(config?: RequestConfig) {
  const cookie = getCookie();
  if (!cookie) return config;

  const params =
    config?.params && typeof config.params === 'object'
      ? { ...(config.params as Record<string, unknown>) }
      : {};

  if (!('cookie' in params)) {
    params.cookie = cookie;
  }

  return { ...config, params };
}

// 通用 GET
export function get<T = unknown>(url: string, config?: RequestConfig) {
  return service.get<T>(url, withCookie(config)) as Promise<T>;
}

// 通用 POST
export function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
) {
  return service.post<T>(url, data, config) as Promise<T>;
}

export default service;
