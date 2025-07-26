import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

// 模擬工作單資料
interface MockWorkOrder {
  _id: string;
  orderNumber: string;
  title: string;
  description: string;
  contractorId: string;
  contractorName?: string;
  applicantId: string;
  applicantName: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: Date;
  endDate: Date;
  location: string;
  workType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  appliedAt: Date;
  finalApprovedBy?: string;
  finalApprovedAt?: Date;
  currentApprovalLevel: string;
  approvalHistory: any[];
  assignments: any[];
  schedules: any[];
  createdAt: Date;
  updatedAt: Date;
}

// 測試資料陣列
let mockWorkOrders: MockWorkOrder[] = [
  {
    _id: '1',
    orderNumber: 'WO-2024-001',
    title: '設備維護工程',
    description: '生產線設備定期維護',
    contractorId: '1',
    contractorName: '台積電承攬商',
    applicantId: 'user1',
    applicantName: '張工程師',
    status: 'APPROVED',
    priority: 'HIGH',
    startDate: new Date('2024-07-28'),
    endDate: new Date('2024-07-30'),
    location: 'Fab1 二樓',
    workType: '設備維護',
    riskLevel: 'MEDIUM',
    appliedAt: new Date('2024-07-25'),
    finalApprovedBy: 'admin',
    finalApprovedAt: new Date('2024-07-26'),
    currentApprovalLevel: 'APPROVED',
    approvalHistory: [],
    assignments: [],
    schedules: [],
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-07-26')
  },
  {
    _id: '2',
    orderNumber: 'WO-2024-002',
    title: '清潔作業',
    description: '無塵室清潔作業',
    contractorId: '2',
    contractorName: '聯發科承攬商',
    applicantId: 'user2',
    applicantName: '李主管',
    status: 'PENDING',
    priority: 'MEDIUM',
    startDate: new Date('2024-07-29'),
    endDate: new Date('2024-07-29'),
    location: 'Fab2 三樓',
    workType: '清潔作業',
    riskLevel: 'LOW',
    appliedAt: new Date('2024-07-26'),
    currentApprovalLevel: 'SUPERVISOR',
    approvalHistory: [],
    assignments: [],
    schedules: [],
    createdAt: new Date('2024-07-26'),
    updatedAt: new Date('2024-07-26')
  },
  {
    _id: '3',
    orderNumber: 'WO-2024-003',
    title: '安全檢查',
    description: '月度安全設備檢查',
    contractorId: '1',
    contractorName: '台積電承攬商',
    applicantId: 'user3',
    applicantName: '王安全員',
    status: 'DRAFT',
    priority: 'LOW',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-08-02'),
    location: '全廠區',
    workType: '安全檢查',
    riskLevel: 'LOW',
    appliedAt: new Date('2024-07-26'),
    currentApprovalLevel: 'APPLICANT',
    approvalHistory: [],
    assignments: [],
    schedules: [],
    createdAt: new Date('2024-07-26'),
    updatedAt: new Date('2024-07-26')
  }
];

let nextWorkOrderId = 4;
let orderCounter = 4;

export class WorkOrderController {
  static async getWorkOrders(req: Request, res: Response<PaginatedResponse<any>>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const contractorId = req.query.contractorId as string;
      const applicantId = req.query.applicantId as string;

      // 過濾資料
      let filteredWorkOrders = [...mockWorkOrders];
      
      if (status) {
        filteredWorkOrders = filteredWorkOrders.filter(w => w.status === status);
      }
      
      if (contractorId) {
        filteredWorkOrders = filteredWorkOrders.filter(w => w.contractorId === contractorId);
      }
      
      if (applicantId) {
        filteredWorkOrders = filteredWorkOrders.filter(w => w.applicantId === applicantId);
      }

      // 承攬商用戶只能看到自己的施工單
      if (req.user?.role === 'CONTRACTOR') {
        filteredWorkOrders = filteredWorkOrders.filter(w => w.contractorId === req.user?.contractorId);
      }

      // 排序
      filteredWorkOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // 分頁
      const total = filteredWorkOrders.length;
      const skip = (page - 1) * limit;
      const workOrders = filteredWorkOrders.slice(skip, skip + limit);

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
        message: '獲取施工單列表失敗',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    }
  }

  static async getWorkOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const workOrder = mockWorkOrders.find(w => w._id === req.params.id);
      
      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
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
      const now = new Date();
      const year = now.getFullYear();
      const orderNumber = `WO-${year}-${orderCounter.toString().padStart(3, '0')}`;
      
      const newWorkOrder: MockWorkOrder = {
        _id: nextWorkOrderId.toString(),
        orderNumber,
        title: req.body.title,
        description: req.body.description,
        contractorId: req.body.contractorId || (req.user?.role === 'CONTRACTOR' ? req.user.contractorId : ''),
        applicantId: req.user?._id || 'user1',
        applicantName: req.body.applicantName || req.user?.username || '申請人',
        status: 'DRAFT',
        priority: req.body.priority || 'MEDIUM',
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        location: req.body.location,
        workType: req.body.workType,
        riskLevel: req.body.riskLevel || 'LOW',
        appliedAt: now,
        currentApprovalLevel: 'APPLICANT',
        approvalHistory: [],
        assignments: [],
        schedules: [],
        createdAt: now,
        updatedAt: now
      };

      mockWorkOrders.push(newWorkOrder);
      nextWorkOrderId++;
      orderCounter++;

      logger.info(`建立施工單: ${newWorkOrder.orderNumber}`, { 
        workOrderId: newWorkOrder._id,
        createdBy: req.user?._id 
      });

      res.status(201).json({
        success: true,
        message: '建立施工單成功',
        data: newWorkOrder
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
      const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);
      
      if (workOrderIndex === -1) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      const workOrder = mockWorkOrders[workOrderIndex];

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
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

      const updatedWorkOrder = {
        ...workOrder,
        ...req.body,
        _id: workOrder._id, // 保持原始 ID
        orderNumber: workOrder.orderNumber, // 保持原始單號
        appliedAt: workOrder.appliedAt, // 保持原始申請時間
        createdAt: workOrder.createdAt, // 保持原始建立時間
        updatedAt: new Date()
      };

      mockWorkOrders[workOrderIndex] = updatedWorkOrder;

      logger.info(`更新施工單: ${updatedWorkOrder.orderNumber}`, { 
        workOrderId: updatedWorkOrder._id,
        updatedBy: req.user?._id 
      });

      res.json({
        success: true,
        message: '更新施工單成功',
        data: updatedWorkOrder
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
      const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);

      if (workOrderIndex === -1) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      const workOrder = mockWorkOrders[workOrderIndex];

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
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

      mockWorkOrders.splice(workOrderIndex, 1);

      logger.info(`刪除施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        deletedBy: req.user?._id 
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

  // 簡化版本的人員指派功能
  static async assignPerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { personId, role, accessLevel } = req.body;
      
      const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);
      if (workOrderIndex === -1) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      const workOrder = mockWorkOrders[workOrderIndex];

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      // 檢查人員是否已被指派
      const existingAssignment = workOrder.assignments.find((a: any) => a.personId === personId);
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
        assignedBy: req.user?._id || 'admin'
      });

      workOrder.updatedAt = new Date();

      logger.info(`指派人員到施工單: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        personId,
        assignedBy: req.user?._id 
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
      
      const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);
      if (workOrderIndex === -1) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      const workOrder = mockWorkOrders[workOrderIndex];

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
        res.status(403).json({
          success: false,
          message: '無權修改此施工單'
        });
        return;
      }

      const assignmentIndex = workOrder.assignments.findIndex((a: any) => a.personId === assignmentId);
      if (assignmentIndex === -1) {
        res.status(404).json({
          success: false,
          message: '找不到此人員指派'
        });
        return;
      }

      workOrder.assignments.splice(assignmentIndex, 1);
      workOrder.updatedAt = new Date();

      logger.info(`移除人員指派: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        personId: assignmentId,
        removedBy: req.user?._id 
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
      
      const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);
      if (workOrderIndex === -1) {
        res.status(404).json({
          success: false,
          message: '施工單不存在'
        });
        return;
      }

      const workOrder = mockWorkOrders[workOrderIndex];

      // 權限檢查
      if (req.user?.role === 'CONTRACTOR' && workOrder.contractorId !== req.user.contractorId) {
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

      workOrder.updatedAt = new Date();

      logger.info(`新增施工時段: ${workOrder.orderNumber}`, { 
        workOrderId: workOrder._id,
        scheduleName,
        addedBy: req.user?._id 
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