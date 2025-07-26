import fetch from 'node-fetch';
import { config } from '../config';
import logger from '../utils/logger';

// FaceMatch API 介面定義
export interface CreatePersonTagRequest {
  name: string;
  photos?: string[];
  cardNo?: string;
  expireDate?: string;
}

export interface UpdatePersonTagRequest {
  objectId: string;
  name?: string;
  photos?: string[];
  cardNo?: string;
  expireDate?: string;
}

export interface CreateScheduleRequest {
  name: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;  // "HH:mm" 格式
  endTime: string;    // "HH:mm" 格式
  days: number[];     // 星期幾 [0-6]
}

export interface CreateActionEventRequest {
  name: string;
  sourceType: 'camera';
  sourceId: string;
  personTagIds: string[];
  isMatch: boolean;
  isInSchedule: boolean;
  devices: EventDevice[];
}

export interface EventDevice {
  type: string;
  objectId: string;
}

export interface PagingRequest {
  page: number;
  pageSize: number;
}

export interface PhotoUploadRequest {
  personId: string;
  photoBase64: string;
  filename?: string;
}

export interface PhotoCompareRequest {
  sourcePhotoBase64: string;
  targetPersonId: string;
}

export interface PhotoCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
}

export interface FaceMatchApiResponse {
  datas: {
    statusCode: number;
    objectId: string;
    message: string;
    content?: any;
  }[];
}

export interface FaceMatchListResponse {
  paging: {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
  results: any[];
}

export class FaceMatchClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private credentials: { username: string; password: string };

  constructor() {
    this.baseUrl = `${config.faceMatch.protocol}://${config.faceMatch.host}:${config.faceMatch.port}`;
    this.credentials = {
      username: config.faceMatch.username,
      password: config.faceMatch.password
    };
  }

  /**
   * 登入 FaceMatch 系統獲取 sessionId
   */
  async login(): Promise<string> {
    try {
      // 模擬登入邏輯 - 實際需要根據 FaceMatch API 文件實作
      const response = await this.request('POST', '/api/auth/login', {
        username: this.credentials.username,
        password: this.credentials.password
      });

      if (response.sessionId) {
        this.sessionId = response.sessionId;
        logger.info('FaceMatch 登入成功', { sessionId: this.sessionId });
        return this.sessionId!;
      } else {
        throw new Error('無法獲取 sessionId');
      }
    } catch (error) {
      logger.error('FaceMatch 登入失敗:', error);
      throw new Error('FaceMatch 登入失敗');
    }
  }

  /**
   * 確保已登入
   */
  private async ensureLoggedIn(): Promise<void> {
    if (!this.sessionId) {
      await this.login();
    }
  }

  /**
   * 建立人員標籤
   */
  async createPersonTags(persons: CreatePersonTagRequest[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();
    
    const payload = {
      sessionId: this.sessionId,
      datas: persons
    };

    logger.info('建立 FaceMatch 人員標籤', { count: persons.length });
    return this.request('POST', '/person/tag', payload);
  }

  /**
   * 查詢人員標籤
   */
  async getPersonTags(paging?: PagingRequest): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });

    logger.info('查詢 FaceMatch 人員標籤', { paging });
    return this.request('GET', `/person/tag?${params}`);
  }

  /**
   * 更新人員標籤
   */
  async updatePersonTags(updates: UpdatePersonTagRequest[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: updates
    };

    logger.info('更新 FaceMatch 人員標籤', { count: updates.length });
    return this.request('PUT', '/person/tag', payload);
  }

  /**
   * 刪除人員標籤
   */
  async deletePersonTags(objectIds: string[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const objectIdParam = objectIds.join(',');
    logger.info('刪除 FaceMatch 人員標籤', { objectIds });
    return this.request('DELETE', `/person/tag?sessionId=${this.sessionId}&objectId=${objectIdParam}`);
  }

  /**
   * 批次建立人員
   */
  async batchCreatePersons(persons: any[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: persons
    };

    logger.info('批次建立 FaceMatch 人員', { count: persons.length });
    return this.request('POST', '/person/batch', payload);
  }

  /**
   * 建立排程
   */
  async createSchedules(schedules: CreateScheduleRequest[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: schedules
    };

    logger.info('建立 FaceMatch 排程', { count: schedules.length });
    return this.request('POST', '/schedule', payload);
  }

  /**
   * 查詢排程
   */
  async getSchedules(paging?: PagingRequest): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });

    logger.info('查詢 FaceMatch 排程', { paging });
    return this.request('GET', `/schedule?${params}`);
  }

  /**
   * 更新排程
   */
  async updateSchedules(updates: any[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: updates
    };

    logger.info('更新 FaceMatch 排程', { count: updates.length });
    return this.request('PUT', '/schedule', payload);
  }

  /**
   * 刪除排程
   */
  async deleteSchedules(objectIds: string[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const objectIdParam = objectIds.join(',');
    logger.info('刪除 FaceMatch 排程', { objectIds });
    return this.request('DELETE', `/schedule?sessionId=${this.sessionId}&objectId=${objectIdParam}`);
  }

  /**
   * 建立動作事件
   */
  async createActionEvents(events: CreateActionEventRequest[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: events
    };

    logger.info('建立 FaceMatch 動作事件', { count: events.length });
    return this.request('POST', '/action/event', payload);
  }

  /**
   * 查詢動作事件
   */
  async getActionEvents(paging?: PagingRequest): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });

    logger.info('查詢 FaceMatch 動作事件', { paging });
    return this.request('GET', `/action/event?${params}`);
  }

  /**
   * 查詢設備
   */
  async getDevices(paging?: PagingRequest): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });

    logger.info('查詢 FaceMatch 設備', { paging });
    return this.request('GET', `/device?${params}`);
  }

  /**
   * 查詢來源
   */
  async getSources(paging?: PagingRequest): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });

    logger.info('查詢 FaceMatch 來源', { paging });
    return this.request('GET', `/source?${params}`);
  }

  /**
   * 上傳人員照片
   */
  async uploadPersonPhoto(request: PhotoUploadRequest): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: [{
        personId: request.personId,
        photo: request.photoBase64,
        filename: request.filename || `photo_${Date.now()}.jpg`
      }]
    };

    logger.info('上傳 FaceMatch 人員照片', { personId: request.personId });
    return this.request('POST', '/person/photo', payload);
  }

  /**
   * 批次上傳照片
   */
  async batchUploadPhotos(requests: PhotoUploadRequest[]): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: requests.map(req => ({
        personId: req.personId,
        photo: req.photoBase64,
        filename: req.filename || `photo_${Date.now()}.jpg`
      }))
    };

    logger.info('批次上傳 FaceMatch 照片', { count: requests.length });
    return this.request('POST', '/person/photo/batch', payload);
  }

  /**
   * 更新人員照片
   */
  async updatePersonPhoto(request: PhotoUploadRequest): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      datas: [{
        personId: request.personId,
        photo: request.photoBase64,
        filename: request.filename || `photo_${Date.now()}.jpg`
      }]
    };

    logger.info('更新 FaceMatch 人員照片', { personId: request.personId });
    return this.request('PUT', '/person/photo', payload);
  }

  /**
   * 刪除人員照片
   */
  async deletePersonPhoto(personId: string, photoId?: string): Promise<FaceMatchApiResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      personId
    });

    if (photoId) {
      params.append('photoId', photoId);
    }

    logger.info('刪除 FaceMatch 人員照片', { personId, photoId });
    return this.request('DELETE', `/person/photo?${params}`);
  }

  /**
   * 獲取人員照片列表
   */
  async getPersonPhotos(personId: string): Promise<FaceMatchListResponse> {
    await this.ensureLoggedIn();

    const params = new URLSearchParams({
      sessionId: this.sessionId!,
      personId
    });

    logger.info('查詢 FaceMatch 人員照片', { personId });
    return this.request('GET', `/person/photo?${params}`);
  }

  /**
   * 照片比對
   */
  async comparePhotos(request: PhotoCompareRequest): Promise<PhotoCompareResult> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      sourcePhoto: request.sourcePhotoBase64,
      targetPersonId: request.targetPersonId
    };

    logger.info('FaceMatch 照片比對', { targetPersonId: request.targetPersonId });
    const response = await this.request('POST', '/photo/compare', payload);

    // 轉換回應格式
    return {
      similarity: response.similarity || 0,
      isMatch: response.isMatch || false,
      confidence: response.confidence || 0
    };
  }

  /**
   * 批次照片比對
   */
  async batchComparePhotos(requests: PhotoCompareRequest[]): Promise<PhotoCompareResult[]> {
    await this.ensureLoggedIn();

    const payload = {
      sessionId: this.sessionId,
      comparisons: requests.map(req => ({
        sourcePhoto: req.sourcePhotoBase64,
        targetPersonId: req.targetPersonId
      }))
    };

    logger.info('批次 FaceMatch 照片比對', { count: requests.length });
    const response = await this.request('POST', '/photo/compare/batch', payload);

    // 轉換回應格式
    return response.results?.map((result: any) => ({
      similarity: result.similarity || 0,
      isMatch: result.isMatch || false,
      confidence: result.confidence || 0
    })) || [];
  }

  /**
   * 測試連線
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.login();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * HTTP 請求基礎方法
   */
  private async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    const requestConfig: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config.faceMatch.timeout
    };

    if (data && method !== 'GET') {
      requestConfig.body = JSON.stringify(data);
    }

    try {
      logger.debug('FaceMatch API 請求', { method, url, hasData: !!data });
      
      const response = await fetch(url, requestConfig);
      
      if (!response.ok) {
        throw new Error(`FaceMatch API 錯誤: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.debug('FaceMatch API 回應', { status: response.status, hasResult: !!result });
      
      return result;
    } catch (error) {
      logger.error('FaceMatch API 請求失敗:', { method, url, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}