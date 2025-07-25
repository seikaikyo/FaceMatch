import { Request, Response } from 'express';
import { ApprovalService } from '../services/ApprovalService';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

export class ApprovalController {
  static async submitWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = await ApprovalService.submitWorkOrder(req.params.id, req.user!._id);

      res.json({
        success: true,
        message: '提交施工單申請成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('提交施工單申請失敗:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '提交施工單申請失敗'
      });
    }
  }

  static async ehsApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { action, comments } = req.body;
      const workOrder = await ApprovalService.ehsApproval(
        req.params.workOrderId,
        req.user!._id,
        action,
        comments
      );

      res.json({
        success: true,
        message: `職環安${action === 'APPROVED' ? '核准' : '拒絕'}成功`,
        data: workOrder
      });
    } catch (error) {
      logger.error('職環安簽核失敗:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '職環安簽核失敗'
      });
    }
  }

  static async managerApproval(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { action, comments } = req.body;
      const workOrder = await ApprovalService.managerApproval(
        req.params.workOrderId,
        req.user!._id,
        action,
        comments
      );

      res.json({
        success: true,
        message: `經理${action === 'APPROVED' ? '核准' : '拒絕'}成功`,
        data: workOrder
      });
    } catch (error) {
      logger.error('經理簽核失敗:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '經理簽核失敗'
      });
    }
  }

  static async getPendingApprovals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const role = req.user!.role as 'EHS' | 'MANAGER';
      
      if (!['EHS', 'MANAGER'].includes(role)) {
        res.status(403).json({
          success: false,
          message: '只有職環安或經理可以查看待簽核項目'
        });
        return;
      }

      const workOrders = await ApprovalService.getPendingApprovals(req.user!._id, role);

      res.json({
        success: true,
        message: '獲取待簽核項目成功',
        data: workOrders
      });
    } catch (error) {
      logger.error('獲取待簽核項目失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取待簽核項目失敗'
      });
    }
  }

  static async getMyPendingApprovals(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const role = req.user!.role as 'EHS' | 'MANAGER';
      
      if (!['EHS', 'MANAGER'].includes(role)) {
        res.status(403).json({
          success: false,
          message: '只有職環安或經理可以查看待簽核項目'
        });
        return;
      }

      const workOrders = await ApprovalService.getPendingApprovals(req.user!._id, role);

      res.json({
        success: true,
        message: '獲取我的待簽核項目成功',
        data: {
          role,
          count: workOrders.length,
          workOrders
        }
      });
    } catch (error) {
      logger.error('獲取我的待簽核項目失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取我的待簽核項目失敗'
      });
    }
  }

  static async getApprovalHistory(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const history = await ApprovalService.getApprovalHistory(req.params.workOrderId);

      res.json({
        success: true,
        message: '獲取簽核歷史成功',
        data: history
      });
    } catch (error) {
      logger.error('獲取簽核歷史失敗:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '獲取簽核歷史失敗'
      });
    }
  }

  static async getApprovalStatistics(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const role = req.query.role as 'EHS' | 'MANAGER' | undefined;
      
      // 只有 EHS、MANAGER、ADMIN 可以查看整體統計
      if (!['EHS', 'MANAGER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          message: '權限不足'
        });
        return;
      }

      const statistics = await ApprovalService.getApprovalStatistics(role);

      res.json({
        success: true,
        message: '獲取簽核統計成功',
        data: {
          role: role || 'ALL',
          statistics
        }
      });
    } catch (error) {
      logger.error('獲取簽核統計失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取簽核統計失敗'
      });
    }
  }

  static async withdrawApplication(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = await ApprovalService.withdrawApplication(
        req.params.workOrderId,
        req.user!._id
      );

      res.json({
        success: true,
        message: '撤回申請成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('撤回申請失敗:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '撤回申請失敗'
      });
    }
  }

  static async canApprove(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const canApprove = await ApprovalService.canApprove(req.user!._id, req.params.workOrderId);

      res.json({
        success: true,
        message: '檢查簽核權限成功',
        data: {
          canApprove,
          userRole: req.user!.role,
          userId: req.user!._id
        }
      });
    } catch (error) {
      logger.error('檢查簽核權限失敗:', error);
      res.status(500).json({
        success: false,
        message: '檢查簽核權限失敗'
      });
    }
  }
}