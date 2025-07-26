import { apiClient } from './api';
import { ApiResponse } from '../types';

// FaceMatch 相關接口類型定義
export interface SyncStatistics {
  total: number;
  success: number;
  failed: number;
  partial: number;
  pending: number;
}

export interface SyncStatus {
  workOrderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING';
  lastSyncAt: string;
  syncDetails: {
    totalPersons: number;
    syncedPersons: number;
    failedPersons: number;
  };
  errorMessage?: string;
}

export interface BatchSyncRequest {
  workOrderIds: string[];
  forceSync?: boolean;
}

export interface BatchSyncResult {
  totalWorkOrders: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    workOrderId: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    message: string;
    syncDetails?: {
      totalPersons: number;
      syncedPersons: number;
      failedPersons: number;
    };
  }>;
}

export interface PersonPhoto {
  id: string;
  personId: string;
  personName: string;
  filename: string;
  uploadedAt: string;
  fileSize: number;
  thumbnail?: string;
}

export interface PhotoCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
}

export interface ConnectionStatus {
  connected: boolean;
}

// FaceMatch API 服務類
export class FaceMatchService {
  
  // 同步管理相關 API
  
  /**
   * 同步單一施工單到 FaceMatch
   */
  static async syncWorkOrder(workOrderId: string, forceSync = false) {
    return apiClient.post(`/face-match/sync/${workOrderId}`, { forceSync });
  }

  /**
   * 批次同步多個施工單
   */
  static async batchSyncWorkOrders(data: BatchSyncRequest): Promise<BatchSyncResult> {
    const response = await apiClient.post<ApiResponse<BatchSyncResult>>('/face-match/batch-sync', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '批次同步失敗');
  }

  /**
   * 檢查施工單同步狀態
   */
  static async getSyncStatus(workOrderId: string): Promise<SyncStatus> {
    const response = await apiClient.get<ApiResponse<SyncStatus>>(`/face-match/sync-status/${workOrderId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '獲取同步狀態失敗');
  }

  /**
   * 獲取同步統計資料
   */
  static async getSyncStatistics(): Promise<SyncStatistics> {
    const response = await apiClient.get<ApiResponse<SyncStatistics>>('/face-match/statistics');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '獲取統計資料失敗');
  }

  /**
   * 緊急撤銷人員 FaceMatch 權限
   */
  static async emergencyRevokeAccess(personId: string, reason: string) {
    const response = await apiClient.post<ApiResponse<void>>(`/face-match/emergency-revoke/${personId}`, { reason });
    if (response.success) {
      return;
    }
    throw new Error(response.message || '緊急撤銷失敗');
  }

  /**
   * 測試 FaceMatch 連線
   */
  static async testConnection(): Promise<ConnectionStatus> {
    const response = await apiClient.get<ApiResponse<ConnectionStatus>>('/face-match/test-connection');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '連線測試失敗');
  }

  // 照片管理相關 API

  /**
   * 上傳人員照片
   */
  static async uploadPersonPhoto(personId: string, photoFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    return apiClient.post(`/face-match/photos/${personId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 批次上傳人員照片
   */
  static async batchUploadPhotos(photosWithPersonIds: Array<{ photo: File; personId: string }>): Promise<any> {
    const formData = new FormData();
    
    photosWithPersonIds.forEach(({ photo }) => {
      formData.append('photos', photo);
    });
    
    const personIds = photosWithPersonIds.map(({ personId }) => personId);
    formData.append('personIds', JSON.stringify(personIds));
    
    return apiClient.post('/face-match/photos/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 更新人員照片
   */
  static async updatePersonPhoto(personId: string, photoFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    return apiClient.put(`/face-match/photos/${personId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 刪除人員照片
   */
  static async deletePersonPhoto(personId: string, photoId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (photoId) {
      params.append('photoId', photoId);
    }
    
    const queryString = params.toString();
    const url = `/face-match/photos/${personId}${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.delete(url);
  }

  /**
   * 獲取人員照片列表
   */
  static async getPersonPhotos(personId: string): Promise<PersonPhoto[]> {
    const response = await apiClient.get<ApiResponse<any>>(`/face-match/photos/${personId}`);
    if (response.success && response.data) {
      return response.data.results || [];
    }
    throw new Error(response.message || '獲取照片列表失敗');
  }

  // 照片比對相關 API

  /**
   * 單張照片比對
   */
  static async comparePhoto(targetPersonId: string, sourcePhoto: File): Promise<PhotoCompareResult> {
    const formData = new FormData();
    formData.append('photo', sourcePhoto);
    
    const response = await apiClient.post<ApiResponse<PhotoCompareResult>>(`/face-match/compare/${targetPersonId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '照片比對失敗');
  }

  /**
   * 批次照片比對
   */
  static async batchComparePhotos(comparisons: Array<{ photo: File; targetPersonId: string }>): Promise<PhotoCompareResult[]> {
    const formData = new FormData();
    
    comparisons.forEach(({ photo }) => {
      formData.append('photos', photo);
    });
    
    const targetPersonIds = comparisons.map(({ targetPersonId }) => targetPersonId);
    formData.append('targetPersonIds', JSON.stringify(targetPersonIds));
    
    const response = await apiClient.post<ApiResponse<PhotoCompareResult[]>>('/face-match/compare/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '批次照片比對失敗');
  }

  // 輔助方法

  /**
   * 格式化檔案大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 驗證圖片檔案
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // 檢查檔案類型
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      return { valid: false, error: '只允許上傳 JPEG、JPG、PNG 格式的圖片' };
    }
    
    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: '檔案大小不能超過 5MB' };
    }
    
    return { valid: true };
  }

  /**
   * 批次驗證圖片檔案
   */
  static validateImageFiles(files: File[]): { validFiles: File[]; errors: string[] } {
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach((file, index) => {
      const validation = this.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`檔案 ${index + 1} (${file.name}): ${validation.error}`);
      }
    });
    
    return { validFiles, errors };
  }

  /**
   * 獲取相似度顏色類別
   */
  static getSimilarityColorClass(similarity: number): string {
    if (similarity >= 0.9) return 'text-green-600';
    if (similarity >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * 格式化百分比
   */
  static formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * 獲取狀態變體
   */
  static getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'PARTIAL':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * 獲取狀態文字
   */
  static getStatusText(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '同步成功';
      case 'FAILED':
        return '同步失敗';
      case 'PARTIAL':
        return '部分成功';
      case 'PENDING':
        return '待處理';
      default:
        return '未知狀態';
    }
  }
}

// 匯出預設實例
export const faceMatchService = FaceMatchService;