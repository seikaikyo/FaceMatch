import { Request, Response } from 'express';
import { WorkOrder, User } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

export class WorkOrderController {
  static async getWorkOrders(req: Request, res: Response<PaginatedResponse<any> | ApiResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const contractorId = req.query.contractorId as string;
      const applicantId = req.query.applicantId as string;

      const filter: any = {};
      if (status) filter.status = status;
      if (contractorId) filter.contractorId = contractorId;
      if (applicantId) filter.applicantId = applicantId;

      // 承攬商用戶只能看到自己的施工單
      if (req.user!.role === 'CONTRACTOR') {
        filter.contractorId = req.user!.contractorId;
      }

      const skip = (page - 1) * limit;
      const total = await WorkOrder.countDocuments(filter);
      const workOrders = await WorkOrder.find(filter)
        .populate('contractorId', 'name code')
        .populate('applicantId', 'name username')
        .populate('finalApprovedBy', 'name username')
        .populate('assignments.personId', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        message: '獲取施工單列表成功',
        data: workOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('獲取施工單列表失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取施工單列表失敗'
      });
    }
  }

  static async getWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = await WorkOrder.findById(req.params.id)
        .populate('contractorId', 'name code')
        .populate('applicantId', 'name username')
        .populate('finalApprovedBy', 'name username')
        .populate('assignments.personId', 'name employeeId')
        .populate('assignments.assignedBy', 'name username');
      
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權存取此施工單'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取施工單成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('獲取施工單失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取施工單失敗'
      });
    }
  }

  static async createWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrderData = {
        ...req.body,
        applicantId: req.user!._id,
        applicantName: req.body.applicantName || req.user!.username,
        appliedAt: new Date(),
        status: 'DRAFT',
        currentApprovalLevel: 'APPLICANT',
        approvalHistory: []
      };

      // 如果是承攬商用戶，自動設定承攬商 ID
      if (req.user!.role === 'CONTRACTOR' && !workOrderData.contractorId) {
        workOrderData.contractorId = req.user!.contractorId;
      }

      const workOrder = new WorkOrder(workOrderData);
      await workOrder.save();
      await workOrder.populate('contractorId', 'name code');

      logger.info(`建立施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        createdBy: req.user!._id 
      });

      res.status(201).json({
        success: true,
        message: '建立施工單成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('建立施工單失敗:', error);
      res.status(500).json({
        success: false,
        message: '建立施工單失敗'
      });
    }
  }

  static async updateWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = await WorkOrder.findById(req.params.id);
      
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      // 只有草稿狀態的施工單可以修改
      if (workOrder.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          message: '只有草稿狀態的施工單可以修改'
        });
        return;
      }

      Object.assign(workOrder, req.body);
      await workOrder.save();
      await workOrder.populate('contractorId', 'name code');

      logger.info(`更新施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        updatedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '更新施工單成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('更新施工單失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新施工單失敗'
      });
    }
  }

  static async deleteWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = await WorkOrder.findById(req.params.id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權刪除此施工單'
        });
        return;
      }

      // 只有草稿狀態的施工單可以刪除
      if (workOrder.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          message: '只有草稿狀態的施工單可以刪除'
        });
        return;
      }

      await WorkOrder.findByIdAndDelete(req.params.id);

      logger.info(`刪除施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        deletedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '刪除施工單成功'
      });
    } catch (error) {
      logger.error('刪除施工單失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除施工單失敗'
      });
    }
  }

  static async assignPerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { personId, role, accessLevel } = req.body;
      
      const workOrder = await WorkOrder.findById(req.params.id);
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      // 檢查人員是否已被指派
      const existingAssignment = workOrder.assignments.find(a => a.personId.toString() === personId);
      if (existingAssignment) {
        res.status(400).json({
          success: false,
          message: '此人員已被指派到此施工單'
        });
        return;
      }

      workOrder.assignments.push({
        personId,
        role,
        accessLevel: accessLevel || 'BASIC',
        assignedAt: new Date(),
        assignedBy: req.user!._id as any
      });

      await workOrder.save();
      await workOrder.populate('assignments.personId', 'name employeeId');

      logger.info(`指派人員到施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        personId,
        assignedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '指派人員成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('指派人員失敗:', error);
      res.status(500).json({
        success: false,
        message: '指派人員失敗'
      });
    }
  }

  static async removeAssignment(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { assignmentId } = req.params;
      
      const workOrder = await WorkOrder.findById(req.params.id);
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      const assignmentIndex = workOrder.assignments.findIndex(a => a.personId.toString() === assignmentId);
      if (assignmentIndex === -1) {
        res.status(404).json({
          success: false,
          message: '找不到此人員指派'
        });
        return;
      }

      workOrder.assignments.splice(assignmentIndex, 1);
      await workOrder.save();

      logger.info(`移除人員指派: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        personId: assignmentId,
        removedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '移除人員指派成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('移除人員指派失敗:', error);
      res.status(500).json({
        success: false,
        message: '移除人員指派失敗'
      });
    }
  }

  static async addSchedule(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { scheduleName, startTime, endTime, dayOfWeek, isRecurring, accessAreas } = req.body;
      
      const workOrder = await WorkOrder.findById(req.params.id);
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user!.role === 'CONTRACTOR' && workOrder.contractorId.toString() !== req.user!.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      workOrder.schedules.push({
        scheduleName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        dayOfWeek,
        isRecurring: isRecurring || false,
        accessAreas: accessAreas || []
      });

      await workOrder.save();

      logger.info(`新增施工時段: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        scheduleName,
        addedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '新增施工時段成功',
        data: workOrder
      });
    } catch (error) {
      logger.error('新增施工時段失敗:', error);
      res.status(500).json({
        success: false,
        message: '新增施工時段失敗'
      });
    }
  }
}