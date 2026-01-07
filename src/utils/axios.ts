import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  timeout: 10_000,
});

service.interceptors.response.use(
  (response) => {
    if (response.status === 200 && response.data.code === 200) {
      return response.data;
    }
    return Promise.reject(response);
  },
  (error) => {
    return error;
  },
);

export type RequestConfig<T = unknown> = AxiosRequestConfig<T>;

// 通用 GET
export function get<T = unknown>(url: string, config?: RequestConfig) {
  return service.get<T>(url, config) as Promise<T>;
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
