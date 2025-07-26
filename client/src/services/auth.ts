import { ApiResponse, User, LoginForm } from '../types';
import apiClient from './api';

export const authService = {
  // 登入
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.message || '登入失敗');
  },

  // 獲取用戶資料
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '獲取用戶資料失敗');
  },

  // 更新用戶資料
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '更新用戶資料失敗');
  },

  // 修改密碼
  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    const response = await apiClient.put<ApiResponse<void>>('/auth/change-password', data);
    if (!response.success) {
      throw new Error(response.message || '修改密碼失敗');
    }
  },

  // 登出
  logout(): void {
    apiClient.clearToken();
  },

  // 檢查是否已登入
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};