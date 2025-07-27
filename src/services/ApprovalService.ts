import { WorkOrder, User } from '../models';
import { IWorkOrder, IApprovalRecord } from '../types';
import { FaceMatchSyncService } from './FaceMatchSyncService';
import logger from '../utils/logger';

export class ApprovalService {
  private static faceMatchSyncService = new FaceMatchSyncService();
  /**
   * 提交施工單申請
   */
  static async submitWorkOrder(workOrderId: string, applicantId: string): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    if (workOrder.status !== 'DRAFT') {
      throw new Error('只有草稿狀態的施工單可以提交');
    }

    if (workOrder.applicantId.toString() !== applicantId) {
      throw new Error('只有申請人可以提交施工單');
    }

    // 驗證必要資料
    if (workOrder.assignments.length === 0) {
      throw new Error('請先指派人員到施工單');
    }

    if (workOrder.schedules.length === 0) {
      throw new Error('請先設定施工時段');
    }

    // 初始化簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.currentApprovalLevel = 'EHS';
    
    // 設定簽核歷史
    workOrder.approvalHistory = [
      {
        level: 'EHS',
        approverRole: '職環安',
        action: 'PENDING',
        isRequired: true
      },
      {
        level: 'MANAGER',
        approverRole: '再生經理',
        action: 'PENDING',
        isRequired: true
      }
    ];

    await workOrder.save();

    logger.info(`提交施工單申請: ${workOrder.orderNumber}`, {
      workOrderId: workOrder._id,
      applicantId
    });

    return workOrder;
  }

  /**
   * 職環安簽核
   */
  static async ehsApproval(
    workOrderId: string, 
    approverId: string, 
    action: 'APPROVED' | 'REJECTED', 
    comments?: string,
    rejectTo?: 'APPLICANT' | 'PREVIOUS_LEVEL'
  ): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    if (workOrder.status !== 'PENDING_EHS') {
      throw new Error('此施工單目前不在職環安簽核階段');
    }

    const approver = await User.findById(approverId);
    if (!approver || approver.role !== 'EHS') {
      throw new Error('只有職環安人員可以進行此簽核');
    }

    // 更新 EHS 簽核記錄
    const ehsApproval = workOrder.approvalHistory.find(h => h.level === 'EHS');
    if (ehsApproval) {
      ehsApproval.approverId = approverId as any;
      ehsApproval.approverName = approver.name;
      ehsApproval.action = action;
      ehsApproval.comments = comments;
      ehsApproval.actionAt = new Date();
    }

    if (action === 'APPROVED') {
      // 進入下一階段：經理審核
      workOrder.status = 'PENDING_MANAGER';
      workOrder.currentApprovalLevel = 'MANAGER';

      logger.info(`職環安核准施工單: ${workOrder.orderNumber}`, {
        workOrderId: workOrder._id,
        approverId,
        comments
      });
    } else {
      // 駁回申請 - 職環安只能駁回給申請人
      workOrder.status = 'RETURNED_TO_APPLICANT';
      workOrder.currentApprovalLevel = 'RETURNED';
      workOrder.rejectionReason = comments || '職環安駁回申請';
      workOrder.returnedFrom = 'EHS';
      workOrder.returnedAt = new Date();

      logger.warn(`職環安駁回施工單: ${workOrder.orderNumber}`, {
        workOrderId: workOrder._id,
        approverId,
        reason: comments,
        returnedTo: 'APPLICANT'
      });
    }

    await workOrder.save();
    return workOrder;
  }

  /**
   * 再生經理簽核
   */
  static async managerApproval(
    workOrderId: string, 
    approverId: string, 
    action: 'APPROVED' | 'REJECTED', 
    comments?: string,
    rejectTo?: 'APPLICANT' | 'PREVIOUS_LEVEL'
  ): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    if (workOrder.status !== 'PENDING_MANAGER') {
      throw new Error('此施工單目前不在經理簽核階段');
    }

    const approver = await User.findById(approverId);
    if (!approver || approver.role !== 'MANAGER') {
      throw new Error('只有經理可以進行此簽核');
    }

    // 更新經理簽核記錄
    const managerApproval = workOrder.approvalHistory.find(h => h.level === 'MANAGER');
    if (managerApproval) {
      managerApproval.approverId = approverId as any;
      managerApproval.approverName = approver.name;
      managerApproval.action = action;
      managerApproval.comments = comments;
      managerApproval.actionAt = new Date();
    }

    if (action === 'APPROVED') {
      // 最終核准
      workOrder.status = 'APPROVED';
      workOrder.currentApprovalLevel = 'COMPLETED';
      workOrder.finalApprovedBy = approverId as any;
      workOrder.finalApprovedAt = new Date();

      logger.info(`經理核准施工單: ${workOrder.orderNumber}`, {
        workOrderId: workOrder._id,
        approverId,
        comments
      });

      // 觸發 FaceMatch 同步
      try {
        await this.faceMatchSyncService.syncWorkOrder(workOrder._id.toString());
        logger.info(`FaceMatch 同步已觸發: ${workOrder.orderNumber}`);
      } catch (syncError) {
        logger.error(`FaceMatch 同步失敗: ${workOrder.orderNumber}`, syncError);
        // 同步失敗不影響審核流程，只記錄錯誤
      }
    } else {
      // 駁回申請 - 再生經理可選擇駁回給申請人或上一層職環安
      const rejectTarget = rejectTo || 'APPLICANT';
      
      if (rejectTarget === 'PREVIOUS_LEVEL') {
        // 駁回給上一層職環安重新審核
        workOrder.status = 'PENDING_EHS';
        workOrder.currentApprovalLevel = 'EHS';
        workOrder.rejectionReason = comments || '經理要求職環安重新審核';
        workOrder.returnedFrom = 'MANAGER';
        workOrder.returnedAt = new Date();
        
        // 重置職環安簽核記錄
        const ehsApproval = workOrder.approvalHistory.find(h => h.level === 'EHS');
        if (ehsApproval) {
          ehsApproval.action = 'PENDING';
          ehsApproval.approverId = undefined;
          ehsApproval.approverName = undefined;
          ehsApproval.comments = undefined;
          ehsApproval.actionAt = undefined;
        }

        logger.warn(`經理駁回施工單給職環安: ${workOrder.orderNumber}`, {
          workOrderId: workOrder._id,
          approverId,
          reason: comments,
          returnedTo: 'EHS'
        });
      } else {
        // 駁回給申請人
        workOrder.status = 'RETURNED_TO_APPLICANT';
        workOrder.currentApprovalLevel = 'RETURNED';
        workOrder.rejectionReason = comments || '經理駁回申請';
        workOrder.returnedFrom = 'MANAGER';
        workOrder.returnedAt = new Date();

        logger.warn(`經理駁回施工單給申請人: ${workOrder.orderNumber}`, {
          workOrderId: workOrder._id,
          approverId,
          reason: comments,
          returnedTo: 'APPLICANT'
        });
      }
    }

    await workOrder.save();
    return workOrder;
  }

  /**
   * 查詢待簽核項目
   */
  static async getPendingApprovals(userId: string, role: 'EHS' | 'MANAGER'): Promise<IWorkOrder[]> {
    const status = role === 'EHS' ? 'PENDING_EHS' : 'PENDING_MANAGER';
    
    const workOrders = await WorkOrder.find({ status })
      .populate('contractorId', 'name code')
      .populate('applicantId', 'name username')
      .populate('assignments.personId', 'name employeeId')
      .sort({ appliedAt: 1 }); // 按申請時間排序

    logger.info(`查詢 ${role} 待簽核項目`, {
      userId,
      role,
      count: workOrders.length
    });

    return workOrders;
  }

  /**
   * 查詢簽核歷史
   */
  static async getApprovalHistory(workOrderId: string): Promise<IApprovalRecord[]> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    return workOrder.approvalHistory;
  }

  /**
   * 檢查簽核權限
   */
  static async canApprove(userId: string, workOrderId: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return false;
    }

    // 檢查當前簽核階段是否匹配用戶角色
    if (workOrder.status === 'PENDING_EHS' && user.role === 'EHS') {
      return true;
    }

    if (workOrder.status === 'PENDING_MANAGER' && user.role === 'MANAGER') {
      return true;
    }

    return false;
  }

  /**
   * 管理員特殊駁回權限 (管理員可以在任何階段駁回)
   */
  static async adminReject(
    workOrderId: string, 
    adminId: string, 
    rejectTo: 'APPLICANT' | 'EHS' | 'MANAGER',
    comments?: string
  ): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('只有管理員可以執行此操作');
    }

    // 添加管理員操作記錄
    workOrder.approvalHistory.push({
      level: 'MANAGER',
      approverRole: '管理員',
      approverId: adminId as any,
      approverName: admin.name,
      action: 'REJECTED',
      comments: `管理員駁回: ${comments || ''}`,
      actionAt: new Date(),
      isRequired: false
    });

    workOrder.returnedFrom = 'ADMIN';
    workOrder.returnedAt = new Date();
    workOrder.rejectionReason = `管理員駁回: ${comments || ''}`;

    switch (rejectTo) {
      case 'EHS':
        workOrder.status = 'PENDING_EHS';
        workOrder.currentApprovalLevel = 'EHS';
        // 重置職環安簽核記錄
        const ehsApproval = workOrder.approvalHistory.find(h => h.level === 'EHS');
        if (ehsApproval) {
          ehsApproval.action = 'PENDING';
          ehsApproval.approverId = undefined;
          ehsApproval.approverName = undefined;
          ehsApproval.comments = undefined;
          ehsApproval.actionAt = undefined;
        }
        break;
      case 'MANAGER':
        workOrder.status = 'PENDING_MANAGER';
        workOrder.currentApprovalLevel = 'MANAGER';
        // 重置經理簽核記錄
        const managerApproval = workOrder.approvalHistory.find(h => h.level === 'MANAGER');
        if (managerApproval) {
          managerApproval.action = 'PENDING';
          managerApproval.approverId = undefined;
          managerApproval.approverName = undefined;
          managerApproval.comments = undefined;
          managerApproval.actionAt = undefined;
        }
        break;
      default: // APPLICANT
        workOrder.status = 'RETURNED_TO_APPLICANT';
        workOrder.currentApprovalLevel = 'RETURNED';
        break;
    }

    await workOrder.save();

    logger.warn(`管理員駁回施工單: ${workOrder.orderNumber}`, {
      workOrderId: workOrder._id,
      adminId,
      reason: comments,
      returnedTo: rejectTo
    });

    return workOrder;
  }

  /**
   * 重新提交被駁回的申請
   */
  static async resubmitWorkOrder(workOrderId: string, applicantId: string): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    if (workOrder.status !== 'RETURNED_TO_APPLICANT') {
      throw new Error('只有被駁回的施工單可以重新提交');
    }

    if (workOrder.applicantId.toString() !== applicantId) {
      throw new Error('只有申請人可以重新提交施工單');
    }

    // 重新開始簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.currentApprovalLevel = 'EHS';
    workOrder.rejectionReason = undefined;
    workOrder.returnedFrom = undefined;
    workOrder.returnedAt = undefined;

    // 重置所有簽核記錄
    workOrder.approvalHistory.forEach(approval => {
      if (approval.level === 'EHS' || approval.level === 'MANAGER') {
        approval.action = 'PENDING';
        approval.approverId = undefined;
        approval.approverName = undefined;
        approval.comments = undefined;
        approval.actionAt = undefined;
      }
    });

    await workOrder.save();

    logger.info(`重新提交施工單: ${workOrder.orderNumber}`, {
      workOrderId: workOrder._id,
      applicantId
    });

    return workOrder;
  }

  /**
   * 撤回申請 (只有申請人可以撤回處於待審核狀態的申請)
   */
  static async withdrawApplication(workOrderId: string, applicantId: string): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error('施工單不存在');
    }

    if (workOrder.applicantId.toString() !== applicantId) {
      throw new Error('只有申請人可以撤回申請');
    }

    if (!['PENDING_EHS', 'PENDING_MANAGER'].includes(workOrder.status)) {
      throw new Error('只有待審核狀態的申請可以撤回');
    }

    workOrder.status = 'CANCELLED';
    workOrder.currentApprovalLevel = 'COMPLETED';
    workOrder.rejectionReason = '申請人撤回申請';

    await workOrder.save();

    logger.info(`撤回施工單申請: ${workOrder.orderNumber}`, {
      workOrderId: workOrder._id,
      applicantId
    });

    return workOrder;
  }

  /**
   * 獲取簽核統計
   */
  static async getApprovalStatistics(role?: 'EHS' | 'MANAGER'): Promise<any> {
    const pipeline: any[] = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    if (role) {
      const statusFilter = role === 'EHS' ? 'PENDING_EHS' : 'PENDING_MANAGER';
      pipeline.unshift({
        $match: { status: statusFilter }
      });
    }

    const stats = await WorkOrder.aggregate(pipeline);
    
    const result: any = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      
      switch (stat._id) {
        case 'PENDING_EHS':
        case 'PENDING_MANAGER':
          result.pending += stat.count;
          break;
        case 'APPROVED':
          result.approved += stat.count;
          break;
        case 'REJECTED':
          result.rejected += stat.count;
          break;
        case 'CANCELLED':
          result.cancelled += stat.count;
          break;
      }
    });

    return result;
  }
}