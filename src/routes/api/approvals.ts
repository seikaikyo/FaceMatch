import { Router } from 'express';
import { ApprovalController } from '../../controllers/approvalController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validation';
import { approvalActionSchema, mongoIdSchema } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 提交施工單申請 - 承攬商用戶可以提交
router.post('/:id/submit', 
  requireRole(['CONTRACTOR', 'ADMIN']),
  validateParams(Joi.object({ id: mongoIdSchema })),
  ApprovalController.submitWorkOrder
);

// 查詢待簽核項目 - EHS、MANAGER、ADMIN 可以查看
router.get('/pending', 
  requireRole(['EHS', 'MANAGER', 'ADMIN']),
  ApprovalController.getPendingApprovals
);

// 查詢我的待簽核項目 - EHS、MANAGER 可以查看
router.get('/my-pending', 
  requireRole(['EHS', 'MANAGER']),
  ApprovalController.getMyPendingApprovals
);

// 職環安簽核 - 僅 EHS 可以操作
router.post('/:workOrderId/ehs', 
  requireRole(['EHS']),
  validateParams(Joi.object({ workOrderId: mongoIdSchema })),
  validateBody(approvalActionSchema),
  ApprovalController.ehsApproval
);

// 再生經理簽核 - 僅 MANAGER 可以操作
router.post('/:workOrderId/manager', 
  requireRole(['MANAGER']),
  validateParams(Joi.object({ workOrderId: mongoIdSchema })),
  validateBody(approvalActionSchema),
  ApprovalController.managerApproval
);

// 查詢簽核歷史 - 所有角色都可以查看
router.get('/:workOrderId/history', 
  validateParams(Joi.object({ workOrderId: mongoIdSchema })),
  ApprovalController.getApprovalHistory
);

// 查詢簽核統計 - EHS、MANAGER、ADMIN 可以查看
router.get('/statistics', 
  requireRole(['EHS', 'MANAGER', 'ADMIN']),
  ApprovalController.getApprovalStatistics
);

// 撤回申請 - 承攬商用戶可以撤回
router.post('/:workOrderId/withdraw', 
  requireRole(['CONTRACTOR', 'ADMIN']),
  validateParams(Joi.object({ workOrderId: mongoIdSchema })),
  ApprovalController.withdrawApplication
);

// 檢查簽核權限
router.get('/:workOrderId/can-approve', 
  validateParams(Joi.object({ workOrderId: mongoIdSchema })),
  ApprovalController.canApprove
);

export default router;