import { Router } from 'express';
import { WorkOrderController } from '../../controllers/workOrderController';
import { authenticateToken, requireRole, requireContractorAccess } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { 
  createWorkOrderSchema, 
  updateWorkOrderSchema,
  assignPersonSchema,
  addScheduleSchema,
  workOrderQuerySchema,
  mongoIdSchema 
} from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 查詢施工單列表 - 所有角色都可以查看，但會根據角色過濾
router.get('/', validateQuery(workOrderQuerySchema), WorkOrderController.getWorkOrders);

// 查詢單一施工單 - 需要權限檢查
router.get('/:id', validateParams(Joi.object({ id: mongoIdSchema })), WorkOrderController.getWorkOrder);

// 建立施工單 - 承攬商用戶和管理員可以建立
router.post('/', 
  requireRole(['CONTRACTOR', 'ADMIN']), 
  validateBody(createWorkOrderSchema), 
  WorkOrderController.createWorkOrder
);

// 更新施工單 - 需要權限檢查
router.put('/:id', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(updateWorkOrderSchema), 
  WorkOrderController.updateWorkOrder
);

// 刪除施工單 - 需要權限檢查
router.delete('/:id', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  WorkOrderController.deleteWorkOrder
);

// 指派人員 - 需要權限檢查
router.post('/:id/assignments', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(assignPersonSchema), 
  WorkOrderController.assignPerson
);

// 移除人員指派 - 需要權限檢查
router.delete('/:id/assignments/:assignmentId', 
  validateParams(Joi.object({ 
    id: mongoIdSchema, 
    assignmentId: mongoIdSchema 
  })),
  WorkOrderController.removeAssignment
);

// 新增施工時段 - 需要權限檢查
router.post('/:id/schedules', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(addScheduleSchema), 
  WorkOrderController.addSchedule
);

export default router;