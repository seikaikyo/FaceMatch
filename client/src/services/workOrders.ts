import { 
  ApiResponse, 
  PaginatedResponse, 
  WorkOrder, 
  WorkOrderForm, 
  WorkOrderQuery,
  WorkOrderAssignment,
  WorkOrderSchedule
} from '../types';
import apiClient from './api';

export const workOrderService = {
  // 獲取施工單列表
  async getWorkOrders(query?: WorkOrderQuery): Promise<PaginatedResponse<WorkOrder>> {
    const response = await apiClient.get<any>('/work-orders', query);
    console.log('workOrders service response:', response);
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
    throw new Error(response.message || '獲取施工單列表失敗');
  },

  // 獲取單一施工單
  async getWorkOrder(id: string): Promise<WorkOrder> {
    const response = await apiClient.get<ApiResponse<WorkOrder>>(`/work-orders/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '獲取施工單資料失敗');
  },

  // 建立施工單
  async createWorkOrder(data: WorkOrderForm): Promise<WorkOrder> {
    const response = await apiClient.post<ApiResponse<WorkOrder>>('/work-orders', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '建立施工單失敗');
  },

  // 更新施工單
  async updateWorkOrder(id: string, data: Partial<WorkOrderForm>): Promise<WorkOrder> {
    const response = await apiClient.put<ApiResponse<WorkOrder>>(`/work-orders/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '更新施工單失敗');
  },

  // 刪除施工單
  async deleteWorkOrder(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/work-orders/${id}`);
    if (!response.success) {
      throw new Error(response.message || '刪除施工單失敗');
    }
  },

  // 指派人員
  async assignPerson(workOrderId: string, data: { personId: string; role: string; accessLevel: string }): Promise<WorkOrderAssignment> {
    const response = await apiClient.post<ApiResponse<WorkOrderAssignment>>(`/work-orders/${workOrderId}/assignments`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '指派人員失敗');
  },

  // 移除人員指派
  async removeAssignment(workOrderId: string, assignmentId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/work-orders/${workOrderId}/assignments/${assignmentId}`);
    if (!response.success) {
      throw new Error(response.message || '移除人員指派失敗');
    }
  },

  // 新增施工時段
  async addSchedule(workOrderId: string, data: Omit<WorkOrderSchedule, '_id' | 'workOrderId' | 'createdAt' | 'updatedAt'>): Promise<WorkOrderSchedule> {
    const response = await apiClient.post<ApiResponse<WorkOrderSchedule>>(`/work-orders/${workOrderId}/schedules`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '新增施工時段失敗');
  },
};