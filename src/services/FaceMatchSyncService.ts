import { WorkOrder, ContractorPerson, AnnualQualification, FaceMatchIntegration } from '../models';
import { FaceMatchClient } from './FaceMatchClient';
import { IWorkOrder, IFaceMatchIntegration, IPersonSyncStatus } from '../types';
import logger from '../utils/logger';

export interface SyncResult {
  workOrderId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  syncedItems: PersonSyncResult[];
  failedItems: PersonSyncResult[];
  errors: string[];
}

export interface PersonSyncResult {
  personId: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  reason?: string;
  faceMatchPersonId?: string;
  qualificationStatus?: 'VALID' | 'EXPIRED' | 'NOT_FOUND';
}

export interface BatchSyncResult {
  totalWorkOrders: number;
  successCount: number;
  failedCount: number;
  results: SyncResult[];
}

export class FaceMatchSyncService {
  private faceMatchClient: FaceMatchClient;

  constructor() {
    this.faceMatchClient = new FaceMatchClient();
  }

  /**
   * 同步單一施工單到 FaceMatch
   */
  async syncWorkOrder(workOrderId: string, forceSync: boolean = false): Promise<SyncResult> {
    logger.info(`開始同步施工單到 FaceMatch: ${workOrderId}`, { forceSync });

    const result: SyncResult = {
      workOrderId,
      status: 'PENDING',
      syncedItems: [],
      failedItems: [],
      errors: []
    };

    try {
      // 獲取施工單資料
      const workOrder = await WorkOrder.findById(workOrderId)
        .populate('contractorId', 'name code')
        .populate('assignments.personId');

      if (!workOrder) {
        throw new Error('施工單不存在');
      }

      if (workOrder.status !== 'APPROVED') {
        throw new Error('只有已核准的施工單可以同步');
      }

      // 檢查或建立 FaceMatch 整合記錄
      let integration = await FaceMatchIntegration.findOne({ workOrderId });
      if (!integration) {
        integration = new FaceMatchIntegration({
          workOrderId,
          integrationStatus: 'PENDING',
          syncAttempts: 0,
          personSyncStatuses: []
        });
      }

      // 如果不是強制同步，檢查是否需要重新同步
      if (!forceSync && integration.integrationStatus === 'SUCCESS') {
        logger.info('施工單已成功同步，跳過', { workOrderId });
        return this.buildResultFromIntegration(integration);
      }

      // 更新同步嘗試次數
      integration.syncAttempts += 1;
      integration.lastSyncAt = new Date();

      // 1. 建立或更新 FaceMatch 排程
      const faceMatchScheduleId = await this.createOrUpdateFaceMatchSchedule(workOrder);
      integration.faceMatchScheduleId = faceMatchScheduleId;

      // 2. 同步人員到 FaceMatch
      for (const assignment of workOrder.assignments) {
        try {
          const syncResult = await this.syncPersonToFaceMatch(assignment.personId.toString(), workOrder);
          
          // 更新整合記錄中的人員同步狀態
          const existingStatus = integration.personSyncStatuses.find(
            s => s.personId.toString() === assignment.personId.toString()
          );

          if (existingStatus) {
            existingStatus.syncStatus = syncResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
            existingStatus.qualificationStatus = syncResult.qualificationStatus || 'NOT_FOUND';
            existingStatus.faceMatchPersonId = syncResult.faceMatchPersonId;
            existingStatus.lastSyncAt = new Date();
            existingStatus.syncErrorMessage = syncResult.reason;
            existingStatus.isActive = syncResult.status === 'SUCCESS';
          } else {
            integration.personSyncStatuses.push({
              personId: assignment.personId,
              syncStatus: syncResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
              qualificationStatus: syncResult.qualificationStatus || 'NOT_FOUND',
              faceMatchPersonId: syncResult.faceMatchPersonId,
              lastSyncAt: new Date(),
              syncErrorMessage: syncResult.reason,
              isActive: syncResult.status === 'SUCCESS'
            });
          }

          if (syncResult.status === 'SUCCESS') {
            result.syncedItems.push(syncResult);
          } else {
            result.failedItems.push(syncResult);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          result.failedItems.push({
            personId: assignment.personId.toString(),
            status: 'FAILED',
            reason: errorMessage
          });
          result.errors.push(`人員 ${assignment.personId}: ${errorMessage}`);
        }
      }

      // 3. 更新整體同步狀態
      if (result.failedItems.length === 0) {
        result.status = 'SUCCESS';
        integration.integrationStatus = 'SUCCESS';
      } else if (result.syncedItems.length > 0) {
        result.status = 'PARTIAL';
        integration.integrationStatus = 'PARTIAL';
      } else {
        result.status = 'FAILED';
        integration.integrationStatus = 'FAILED';
      }

      integration.errorMessage = result.errors.join('; ');
      await integration.save();

      logger.info(`施工單同步完成: ${workOrderId}`, {
        status: result.status,
        syncedCount: result.syncedItems.length,
        failedCount: result.failedItems.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失敗';
      result.status = 'FAILED';
      result.errors.push(errorMessage);

      logger.error(`施工單同步失敗: ${workOrderId}`, { error: errorMessage });

      // 更新整合記錄
      const integration = await FaceMatchIntegration.findOne({ workOrderId });
      if (integration) {
        integration.integrationStatus = 'FAILED';
        integration.errorMessage = errorMessage;
        await integration.save();
      }

      return result;
    }
  }

  /**
   * 同步人員到 FaceMatch
   */
  private async syncPersonToFaceMatch(personId: string, workOrder: IWorkOrder): Promise<PersonSyncResult> {
    // 1. 檢查人員年度資格
    const qualificationCheck = await this.checkPersonQualification(personId);
    
    if (!qualificationCheck.isValid) {
      return {
        personId,
        status: 'SKIPPED',
        reason: '人員資格已過期或不存在',
        qualificationStatus: qualificationCheck.status
      };
    }

    // 2. 獲取人員資料
    const person = await ContractorPerson.findById(personId).populate('contractorId');
    if (!person) {
      return {
        personId,
        status: 'FAILED',
        reason: '人員不存在'
      };
    }

    // 3. 建立或更新 FaceMatch 人員標籤
    try {
      const faceMatchPersonData = this.buildFaceMatchPersonData(person, workOrder);
      
      let faceMatchPersonId = person.faceTemplateId;
      
      if (!faceMatchPersonId) {
        // 建立新的 FaceMatch 人員標籤
        const response = await this.faceMatchClient.createPersonTags([faceMatchPersonData]);
        
        if (response.datas && response.datas[0] && response.datas[0].statusCode === 200) {
          faceMatchPersonId = response.datas[0].objectId;
          
          // 更新本地資料
          person.faceTemplateId = faceMatchPersonId;
          await person.save();
        } else {
          throw new Error('建立 FaceMatch 人員標籤失敗');
        }
      } else {
        // 更新現有的 FaceMatch 人員標籤
        await this.faceMatchClient.updatePersonTags([{
          objectId: faceMatchPersonId,
          ...faceMatchPersonData
        }]);
      }

      return {
        personId,
        status: 'SUCCESS',
        faceMatchPersonId,
        qualificationStatus: qualificationCheck.status
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      return {
        personId,
        status: 'FAILED',
        reason: errorMessage,
        qualificationStatus: qualificationCheck.status
      };
    }
  }

  /**
   * 檢查人員年度資格
   */
  private async checkPersonQualification(personId: string): Promise<{
    isValid: boolean;
    status: 'VALID' | 'EXPIRED' | 'NOT_FOUND';
    validTo?: Date;
  }> {
    const qualifications = await AnnualQualification.find({
      personId,
      status: 'VALID'
    });

    if (qualifications.length === 0) {
      return { isValid: false, status: 'NOT_FOUND' };
    }

    const now = new Date();
    const validQualifications = qualifications.filter(q => 
      q.validFrom <= now && q.validTo >= now
    );

    if (validQualifications.length === 0) {
      return { isValid: false, status: 'EXPIRED' };
    }

    // 找到最晚到期的資格
    const latestQualification = validQualifications.reduce((latest, current) => 
      current.validTo > latest.validTo ? current : latest
    );

    return {
      isValid: true,
      status: 'VALID',
      validTo: latestQualification.validTo
    };
  }

  /**
   * 建立 FaceMatch 人員資料
   */
  private buildFaceMatchPersonData(person: any, workOrder: IWorkOrder): any {
    return {
      name: person.name,
      cardNo: person.employeeId,
      expireDate: workOrder.plannedEndTime.toISOString().split('T')[0], // YYYY-MM-DD 格式
      photos: [] // TODO: 處理人臉照片
    };
  }

  /**
   * 建立或更新 FaceMatch 排程
   */
  private async createOrUpdateFaceMatchSchedule(workOrder: IWorkOrder): Promise<string> {
    const faceMatchScheduleData = this.buildFaceMatchScheduleData(workOrder);

    try {
      const integration = await FaceMatchIntegration.findOne({ workOrderId: workOrder._id });
      
      if (integration?.faceMatchScheduleId) {
        // 更新現有排程
        await this.faceMatchClient.updateSchedules([{
          objectId: integration.faceMatchScheduleId,
          ...faceMatchScheduleData
        }]);
        return integration.faceMatchScheduleId;
      } else {
        // 建立新排程
        const response = await this.faceMatchClient.createSchedules([faceMatchScheduleData]);
        
        if (response.datas && response.datas[0] && response.datas[0].statusCode === 200) {
          return response.datas[0].objectId;
        } else {
          throw new Error('建立 FaceMatch 排程失敗');
        }
      }
    } catch (error) {
      logger.error('建立或更新 FaceMatch 排程失敗:', error);
      throw error;
    }
  }

  /**
   * 建立 FaceMatch 排程資料
   */
  private buildFaceMatchScheduleData(workOrder: IWorkOrder): any {
    return {
      name: `施工單-${workOrder.orderNumber}`,
      timeSlots: workOrder.schedules.map(schedule => ({
        startTime: schedule.startTime.toTimeString().slice(0, 5), // HH:mm
        endTime: schedule.endTime.toTimeString().slice(0, 5), // HH:mm
        days: schedule.dayOfWeek || [1, 2, 3, 4, 5, 6, 7]
      }))
    };
  }

  /**
   * 批次同步多個施工單
   */
  async batchSyncWorkOrders(workOrderIds: string[], forceSync: boolean = false): Promise<BatchSyncResult> {
    logger.info(`開始批次同步施工單`, { count: workOrderIds.length, forceSync });

    const results: SyncResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const workOrderId of workOrderIds) {
      try {
        const result = await this.syncWorkOrder(workOrderId, forceSync);
        results.push(result);
        
        if (result.status === 'SUCCESS' || result.status === 'PARTIAL') {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        results.push({
          workOrderId,
          status: 'FAILED',
          syncedItems: [],
          failedItems: [],
          errors: [error instanceof Error ? error.message : '未知錯誤']
        });
      }
    }

    logger.info(`批次同步完成`, { 
      total: workOrderIds.length, 
      success: successCount, 
      failed: failedCount 
    });

    return {
      totalWorkOrders: workOrderIds.length,
      successCount,
      failedCount,
      results
    };
  }

  /**
   * 立即撤銷 FaceMatch 權限
   */
  async emergencyRevokeAccess(personId: string, reason: string): Promise<void> {
    logger.warn(`緊急撤銷 FaceMatch 權限`, { personId, reason });

    try {
      const person = await ContractorPerson.findById(personId);
      if (!person || !person.faceTemplateId) {
        throw new Error('人員不存在或未建立 FaceMatch 標籤');
      }

      // 刪除 FaceMatch 人員標籤
      await this.faceMatchClient.deletePersonTags([person.faceTemplateId]);

      // 停用本地人員狀態
      person.status = 'SUSPENDED';
      await person.save();

      // 更新所有相關的整合記錄
      await FaceMatchIntegration.updateMany(
        { 'personSyncStatuses.personId': personId },
        { 
          $set: { 
            'personSyncStatuses.$.isActive': false,
            'personSyncStatuses.$.syncErrorMessage': `緊急撤銷: ${reason}`
          }
        }
      );

      logger.info(`緊急撤銷完成`, { personId, reason });
    } catch (error) {
      logger.error(`緊急撤銷失敗:`, { personId, error });
      throw error;
    }
  }

  /**
   * 檢查同步狀態
   */
  async checkSyncStatus(workOrderId: string): Promise<IFaceMatchIntegration | null> {
    return FaceMatchIntegration.findOne({ workOrderId })
      .populate('workOrderId', 'orderNumber title status')
      .populate('personSyncStatuses.personId', 'name employeeId');
  }

  /**
   * 測試 FaceMatch 連線
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.faceMatchClient.testConnection();
    } catch (error) {
      logger.error('FaceMatch 連線測試失敗:', error);
      return false;
    }
  }

  /**
   * 從整合記錄建立結果
   */
  private buildResultFromIntegration(integration: IFaceMatchIntegration): SyncResult {
    const syncedItems: PersonSyncResult[] = [];
    const failedItems: PersonSyncResult[] = [];

    integration.personSyncStatuses.forEach(status => {
      const result: PersonSyncResult = {
        personId: status.personId.toString(),
        status: status.syncStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        reason: status.syncErrorMessage,
        faceMatchPersonId: status.faceMatchPersonId,
        qualificationStatus: status.qualificationStatus
      };

      if (status.syncStatus === 'SUCCESS') {
        syncedItems.push(result);
      } else {
        failedItems.push(result);
      }
    });

    return {
      workOrderId: integration.workOrderId.toString(),
      status: integration.integrationStatus,
      syncedItems,
      failedItems,
      errors: integration.errorMessage ? [integration.errorMessage] : []
    };
  }
}