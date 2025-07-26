import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 請求攔截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 回應攔截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // GET 請求
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  // POST 請求
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  // PUT 請求
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  // DELETE 請求
  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  // 設定 token
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  // 清除 token
  clearToken() {
    localStorage.removeItem('token');
  }
}

export const apiClient = new ApiClient();
export default apiClient;