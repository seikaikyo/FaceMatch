import { apiClient } from './api';
import { AnnualQualification, PaginatedResponse, ApiResponse } from '../types';

// 查詢參數類型
export interface QualificationQuery {
  page?: number;
  limit?: number;
  contractorId?: string;
  personId?: string;
  qualificationType?: string;
  status?: 'VALID' | 'EXPIRED' | 'REVOKED';
  search?: string;
  validFrom?: string;
  validTo?: string;
}

// 資格表單類型
export interface QualificationForm {
  contractorId: string;
  qualificationType: string;
  qualificationName: string;
  trainingDate: string;
  validFrom: string;
  validTo: string;
  certificateNumber?: string;
  issuingAuthority?: string;
  attachments?: string[];
  notes?: string;
}

// 展延請求類型
export interface RenewalRequest {
  newValidTo: string;
  renewalReason: string;
  approvedBy: string;
  notes?: string;
}

// 批次檢核請求類型
export interface BatchCheckRequest {
  personIds: string[];
  qualificationType?: string;
  checkDate?: string;
}

// 批次檢核回應類型
export interface BatchCheckResponse {
  checkDate: string;
  summary: {
    total: number;
    valid: number;
    expired: number;
    expiringSoon: number;
    notFound: number;
  };
  results: Array<{
    personId: string;
    personInfo?: {
      name: string;
      employeeId: string;
    };
    validQualifications: number;
    expiredQualifications: number;
    qualificationDetails: Array<{
      type: string;
      isValid: boolean;
      daysRemaining: number;
    }>;
  }>;
}

class QualificationService {
  // 獲取資格列表
  async getQualifications(query?: QualificationQuery): Promise<ApiResponse<PaginatedResponse<AnnualQualification>>> {
    return apiClient.get('/qualifications', query);
  }

  // 獲取單一資格
  async getQualification(id: string): Promise<ApiResponse<AnnualQualification>> {
    return apiClient.get(`/qualifications/${id}`);
  }

  // 建立資格
  async createQualification(data: QualificationForm & { personId: string }): Promise<ApiResponse<AnnualQualification>> {
    return apiClient.post('/qualifications', data);
  }

  // 更新資格
  async updateQualification(id: string, data: Partial<QualificationForm>): Promise<ApiResponse<AnnualQualification>> {
    return apiClient.put(`/qualifications/${id}`, data);
  }

  // 刪除資格
  async deleteQualification(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/qualifications/${id}`);
  }

  // 資格展延
  async renewQualification(id: string, data: RenewalRequest): Promise<ApiResponse<AnnualQualification>> {
    return apiClient.post(`/qualifications/${id}/renew`, data);
  }

  // 批次資格檢核
  async batchCheckQualifications(data: BatchCheckRequest): Promise<ApiResponse<BatchCheckResponse>> {
    return apiClient.post('/qualifications/batch-check', data);
  }

  // 獲取即將到期的資格
  async getExpiringQualifications(days: number = 30): Promise<ApiResponse<PaginatedResponse<AnnualQualification>>> {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + days);
    
    return this.getQualifications({
      status: 'VALID',
      // 這裡可以在後端添加 validTo 的查詢過濾
    });
  }

  // 獲取特定人員的資格
  async getPersonQualifications(personId: string): Promise<ApiResponse<PaginatedResponse<AnnualQualification>>> {
    return this.getQualifications({ personId });
  }

  // 輔助方法：計算資格統計
  calculateQualificationStats(qualifications: AnnualQualification[]) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const stats = {
      total: qualifications.length,
      valid: 0,
      expired: 0,
      expiringSoon: 0,
      byType: {} as Record<string, number>
    };

    qualifications.forEach((qual: AnnualQualification) => {
      const validTo = new Date(qual.validTo);
      
      if (qual.status === 'VALID' && validTo >= now) {
        stats.valid++;
        if (validTo <= thirtyDaysFromNow) {
          stats.expiringSoon++;
        }
      } else {
        stats.expired++;
      }

      // 按類型統計
      const type = qual.qualificationType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  // 輔助方法：檢查資格狀態
  checkQualificationStatus(qualification: AnnualQualification) {
    const now = new Date();
    const validTo = new Date(qualification.validTo);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (qualification.status !== 'VALID') {
      return 'invalid';
    }

    if (validTo < now) {
      return 'expired';
    }

    if (validTo <= thirtyDaysFromNow) {
      return 'expiring_soon';
    }

    return 'valid';
  }

  // 輔助方法：格式化資格類型
  formatQualificationType(type: string): string {
    const typeMap: Record<string, string> = {
      'SAFETY': '安全資格',
      'TECHNICAL': '技術資格',
      'MANAGEMENT': '管理資格',
      'ENVIRONMENTAL': '環境資格',
      'QUALITY': '品質資格'
    };
    return typeMap[type] || type;
  }

  // 輔助方法：驗證資格資料
  validateQualificationData(data: QualificationForm): string[] {
    const errors: string[] = [];

    if (!data.contractorId) {
      errors.push('請選擇承攬商');
    }

    if (!data.qualificationType) {
      errors.push('請選擇資格類型');
    }

    if (!data.qualificationName) {
      errors.push('請輸入資格名稱');
    }

    if (!data.trainingDate) {
      errors.push('請選擇訓練日期');
    }

    if (!data.validFrom) {
      errors.push('請選擇有效起始日期');
    }

    if (!data.validTo) {
      errors.push('請選擇有效結束日期');
    }

    if (data.validFrom && data.validTo) {
      const validFrom = new Date(data.validFrom);
      const validTo = new Date(data.validTo);
      
      if (validTo <= validFrom) {
        errors.push('有效結束日期必須晚於起始日期');
      }
    }

    return errors;
  }
}

export const qualificationService = new QualificationService();
export default qualificationService;