import { ApiResponse, PaginatedResponse, Contractor, ContractorForm, ContractorQuery } from '../types';
import apiClient from './api';

export const contractorService = {
  // 獲取承攬商列表
  async getContractors(query?: ContractorQuery): Promise<PaginatedResponse<Contractor>> {
    const response = await apiClient.get<any>('/contractors', query);
    console.log('contractors service response:', response);
    if (response.success) {
      // 如果後端返回的是包含 pagination 的格式
      if (response.pagination) {
        return {
          data: response.data || [],
          pagination: response.pagination
        };
      }
      // 如果後端返回的是嵌套在 data 中的格式
      if (response.data && response.data.pagination) {
        return response.data;
      }
    }
    throw new Error(response.message || '獲取承攬商列表失敗');
  },

  // 獲取單一承攬商
  async getContractor(id: string): Promise<Contractor> {
    const response = await apiClient.get<ApiResponse<Contractor>>(`/contractors/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '獲取承攬商資料失敗');
  },

  // 建立承攬商
  async createContractor(data: ContractorForm): Promise<Contractor> {
    const response = await apiClient.post<ApiResponse<Contractor>>('/contractors', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '建立承攬商失敗');
  },

  // 更新承攬商
  async updateContractor(id: string, data: Partial<ContractorForm>): Promise<Contractor> {
    const response = await apiClient.put<ApiResponse<Contractor>>(`/contractors/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '更新承攬商失敗');
  },

  // 刪除承攬商
  async deleteContractor(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/contractors/${id}`);
    if (!response.success) {
      throw new Error(response.message || '刪除承攬商失敗');
    }
  },
};