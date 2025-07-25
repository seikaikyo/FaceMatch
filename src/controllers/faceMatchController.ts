import { Request, Response } from 'express';
import { FaceMatchSyncService } from '../services/FaceMatchSyncService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class FaceMatchController {
  private static syncService = new FaceMatchSyncService();

  /**
   * 同步單一施工單到 FaceMatch
   */
  static async syncWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const { forceSync = false } = req.body;

      // 權限檢查 - 只有 EHS、MANAGER、ADMIN 可以觸發同步
      if (!['EHS', 'MANAGER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          message: '無權執行 FaceMatch 同步'
        });
        return;
      }

      const result = await this.syncService.syncWorkOrder(workOrderId, forceSync);

      logger.info(`FaceMatch 同步完成`, {
        workOrderId,
        status: result.status,
        userId: req.user!._id
      });

      res.json({
        success: true,
        message: `FaceMatch 同步${result.status === 'SUCCESS' ? '成功' : result.status === 'PARTIAL' ? '部分成功' : '失敗'}`,
        data: result
      });
    } catch (error) {
      logger.error('FaceMatch 同步失敗:', error);
      res.status(500).json({
        success: false,
        message: 'FaceMatch 同步失敗'
      });
    }
  }

  /**
   * 批次同步多個施工單
   */
  static async batchSyncWorkOrders(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { workOrderIds, forceSync = false } = req.body;

      // 權限檢查
      if (!['EHS', 'MANAGER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          message: '無權執行批次 FaceMatch 同步'
        });
        return;
      }

      if (!Array.isArray(workOrderIds) || workOrderIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '請提供有效的施工單 ID 列表'
        });
        return;
      }

      const result = await this.syncService.batchSyncWorkOrders(workOrderIds, forceSync);

      logger.info(`批次 FaceMatch 同步完成`, {
        total: result.totalWorkOrders,
        success: result.successCount,
        failed: result.failedCount,
        userId: req.user!._id
      });

      res.json({
        success: true,
        message: `批次同步完成：成功 ${result.successCount}，失敗 ${result.failedCount}`,
        data: result
      });
    } catch (error) {
      logger.error('批次 FaceMatch 同步失敗:', error);
      res.status(500).json({
        success: false,
        message: '批次 FaceMatch 同步失敗'
      });
    }
  }

  /**
   * 檢查施工單同步狀態
   */
  static async getSyncStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { workOrderId } = req.params;

      const integration = await this.syncService.checkSyncStatus(workOrderId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: '找不到 FaceMatch 整合記錄'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取同步狀態成功',
        data: integration
      });
    } catch (error) {
      logger.error('獲取同步狀態失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取同步狀態失敗'
      });
    }
  }

  /**
   * 緊急撤銷人員 FaceMatch 權限
   */
  static async emergencyRevokeAccess(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { personId } = req.params;
      const { reason } = req.body;

      // 權限檢查 - 只有 EHS、MANAGER、ADMIN 可以緊急撤銷
      if (!['EHS', 'MANAGER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          message: '無權執行緊急撤銷'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          message: '請提供撤銷原因'
        });
        return;
      }

      await this.syncService.emergencyRevokeAccess(personId, reason);

      logger.warn(`緊急撤銷 FaceMatch 權限`, {
        personId,
        reason,
        revokedBy: req.user!._id
      });

      res.json({
        success: true,
        message: '緊急撤銷成功'
      });
    } catch (error) {
      logger.error('緊急撤銷失敗:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '緊急撤銷失敗'
      });
    }
  }

  /**
   * 測試 FaceMatch 連線
   */
  static async testConnection(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // 權限檢查 - 只有 ADMIN 可以測試連線
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: '無權執行連線測試'
        });
        return;
      }

      const isConnected = await this.syncService.testConnection();

      res.json({
        success: true,
        message: `FaceMatch 連線${isConnected ? '正常' : '失敗'}`,
        data: { connected: isConnected }
      });
    } catch (error) {
      logger.error('FaceMatch 連線測試失敗:', error);
      res.status(500).json({
        success: false,
        message: 'FaceMatch 連線測試失敗'
      });
    }
  }

  /**
   * 獲取 FaceMatch 同步統計
   */
  static async getSyncStatistics(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // 權限檢查
      if (!['EHS', 'MANAGER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          message: '無權查看同步統計'
        });
        return;
      }

      // 使用 aggregation 查詢同步統計
      const { FaceMatchIntegration } = await import('../models');
      
      const stats = await FaceMatchIntegration.aggregate([
        {
          $group: {
            _id: '$integrationStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        success: 0,
        failed: 0,
        partial: 0,
        pending: 0
      };

      stats.forEach(stat => {
        result.total += stat.count;
        switch (stat._id) {
          case 'SUCCESS':
            result.success = stat.count;
            break;
          case 'FAILED':
            result.failed = stat.count;
            break;
          case 'PARTIAL':
            result.partial = stat.count;
            break;
          case 'PENDING':
            result.pending = stat.count;
            break;
        }
      });

      res.json({
        success: true,
        message: '獲取同步統計成功',
        data: result
      });
    } catch (error) {
      logger.error('獲取同步統計失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取同步統計失敗'
      });
    }
  }
}