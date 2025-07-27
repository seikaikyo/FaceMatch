import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * FaceMatch 官方 API 整合服務
 * 基於官方文檔: https://documenter.getpostman.com/view/1454150/U16qHi2T
 */

export interface FaceMatchConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface PersonData {
  id?: string;
  name: string;
  images: string[]; // Base64 或 URL
  metadata?: Record<string, any>;
}

export interface VerifyRequest {
  personId: string;
  image: string; // Base64 或 URL
  threshold?: number;
}

export interface VerifyResponse {
  success: boolean;
  confidence: number;
  matched: boolean;
  personId: string;
  timestamp: string;
}

export interface FaceMatchResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export class FaceMatchAPIService {
  private client: AxiosInstance;
  private config: FaceMatchConfig;

  constructor(config: FaceMatchConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'FaceMatch-Enterprise-System/2.0.0'
      }
    });

    // 請求攔截器 - 記錄請求
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[FaceMatch API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[FaceMatch API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 響應攔截器 - 處理錯誤和重試
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[FaceMatch API] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      async (error) => {
        console.error('[FaceMatch API] Response error:', error.response?.status, error.message);
        
        // 重試邏輯
        const config = error.config;
        if (!config._retryCount) {
          config._retryCount = 0;
        }

        if (config._retryCount < (this.config.retryAttempts || 3)) {
          config._retryCount += 1;
          console.log(`[FaceMatch API] Retrying... (${config._retryCount}/${this.config.retryAttempts})`);
          
          // 延遲重試
          await new Promise(resolve => setTimeout(resolve, 1000 * config._retryCount));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 註冊新人員到 FaceMatch 系統
   */
  async registerPerson(personData: PersonData): Promise<FaceMatchResponse<{ personId: string }>> {
    try {
      const response: AxiosResponse = await this.client.post('/api/v1/persons', {
        name: personData.name,
        images: personData.images,
        metadata: personData.metadata || {}
      });

      return {
        success: true,
        data: { personId: response.data.id },
        message: '人員註冊成功',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('註冊人員失敗', error);
    }
  }

  /**
   * 更新人員資料
   */
  async updatePerson(personId: string, personData: Partial<PersonData>): Promise<FaceMatchResponse> {
    try {
      await this.client.put(`/api/v1/persons/${personId}`, personData);

      return {
        success: true,
        message: '人員資料更新成功',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('更新人員資料失敗', error);
    }
  }

  /**
   * 刪除人員
   */
  async deletePerson(personId: string): Promise<FaceMatchResponse> {
    try {
      await this.client.delete(`/api/v1/persons/${personId}`);

      return {
        success: true,
        message: '人員刪除成功',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('刪除人員失敗', error);
    }
  }

  /**
   * 人臉驗證
   */
  async verifyFace(request: VerifyRequest): Promise<FaceMatchResponse<VerifyResponse>> {
    try {
      const response: AxiosResponse = await this.client.post('/api/v1/verify', {
        person_id: request.personId,
        image: request.image,
        threshold: request.threshold || 0.7
      });

      const verifyData: VerifyResponse = {
        success: response.data.success,
        confidence: response.data.confidence,
        matched: response.data.matched,
        personId: request.personId,
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: verifyData,
        message: verifyData.matched ? '人臉驗證成功' : '人臉驗證失敗',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('人臉驗證失敗', error);
    }
  }

  /**
   * 人臉識別 (1:N 比對)
   */
  async identifyFace(image: string, threshold?: number): Promise<FaceMatchResponse<{ matches: Array<{ personId: string; confidence: number }> }>> {
    try {
      const response: AxiosResponse = await this.client.post('/api/v1/identify', {
        image,
        threshold: threshold || 0.7
      });

      return {
        success: true,
        data: { matches: response.data.matches || [] },
        message: `找到 ${response.data.matches?.length || 0} 個匹配結果`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('人臉識別失敗', error);
    }
  }

  /**
   * 獲取人員列表
   */
  async getPersons(page: number = 1, limit: number = 50): Promise<FaceMatchResponse<{ persons: any[]; total: number }>> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/persons', {
        params: { page, limit }
      });

      return {
        success: true,
        data: {
          persons: response.data.persons || [],
          total: response.data.total || 0
        },
        message: '獲取人員列表成功',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('獲取人員列表失敗', error);
    }
  }

  /**
   * 獲取人員詳情
   */
  async getPerson(personId: string): Promise<FaceMatchResponse<PersonData>> {
    try {
      const response: AxiosResponse = await this.client.get(`/api/v1/persons/${personId}`);

      return {
        success: true,
        data: response.data,
        message: '獲取人員詳情成功',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('獲取人員詳情失敗', error);
    }
  }

  /**
   * 批量人臉驗證
   */
  async batchVerify(requests: VerifyRequest[]): Promise<FaceMatchResponse<VerifyResponse[]>> {
    try {
      const response: AxiosResponse = await this.client.post('/api/v1/verify/batch', {
        requests: requests.map(req => ({
          person_id: req.personId,
          image: req.image,
          threshold: req.threshold || 0.7
        }))
      });

      const results: VerifyResponse[] = response.data.results.map((result: any, index: number) => ({
        success: result.success,
        confidence: result.confidence,
        matched: result.matched,
        personId: requests[index].personId,
        timestamp: new Date().toISOString()
      }));

      return {
        success: true,
        data: results,
        message: `批量驗證完成，共處理 ${results.length} 個請求`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('批量人臉驗證失敗', error);
    }
  }

  /**
   * 系統健康檢查
   */
  async healthCheck(): Promise<FaceMatchResponse<{ status: string; version?: string }>> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/health');

      return {
        success: true,
        data: {
          status: response.data.status || 'OK',
          version: response.data.version
        },
        message: 'FaceMatch API 連接正常',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.handleError('FaceMatch API 連接失敗', error);
    }
  }

  /**
   * 錯誤處理
   */
  private handleError(message: string, error: any): FaceMatchResponse {
    const errorMsg = error.response?.data?.message || error.message || '未知錯誤';
    
    console.error(`[FaceMatch API] ${message}:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 設定API密鑰
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * 獲取當前配置
   */
  getConfig(): Partial<FaceMatchConfig> {
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts
    };
  }
}

// 單例模式導出
let faceMatchService: FaceMatchAPIService | null = null;

export function getFaceMatchService(config?: FaceMatchConfig): FaceMatchAPIService {
  if (!faceMatchService && config) {
    faceMatchService = new FaceMatchAPIService(config);
  } else if (!faceMatchService) {
    throw new Error('FaceMatch API 服務未初始化，請先提供配置');
  }
  
  return faceMatchService;
}

export function resetFaceMatchService(): void {
  faceMatchService = null;
}

export default FaceMatchAPIService;