import { Router } from 'express';
import { QualificationController } from '../../controllers/qualificationController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { 
  createQualificationSchema, 
  updateQualificationSchema,
  renewQualificationSchema,
  batchCheckQualificationsSchema,
  qualificationQuerySchema,
  mongoIdSchema 
} from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 查詢資格列表 - EHS、MANAGER、ADMIN 可以查看
router.get('/', 
  requireRole(['EHS', 'MANAGER', 'ADMIN']),
  validateQuery(qualificationQuerySchema), 
  QualificationController.getQualifications
);

// 查詢單一資格
router.get('/:id', 
  requireRole(['EHS', 'MANAGER', 'ADMIN']),
  validateParams(Joi.object({ id: mongoIdSchema })), 
  QualificationController.getQualification
);

// 建立資格 - EHS、ADMIN 可以建立
router.post('/', 
  requireRole(['EHS', 'ADMIN']), 
  validateBody(createQualificationSchema), 
  QualificationController.createQualification
);

// 更新資格 - EHS、ADMIN 可以更新
router.put('/:id', 
  requireRole(['EHS', 'ADMIN']), 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(updateQualificationSchema), 
  QualificationController.updateQualification
);

// 刪除資格 - 僅 ADMIN 可以刪除
router.delete('/:id', 
  requireRole(['ADMIN']), 
  validateParams(Joi.object({ id: mongoIdSchema })),
  QualificationController.deleteQualification
);

// 資格展延 - EHS、ADMIN 可以展延
router.post('/:id/renew', 
  requireRole(['EHS', 'ADMIN']), 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(renewQualificationSchema), 
  QualificationController.renewQualification
);

// 批次資格檢核 - EHS、MANAGER、ADMIN 可以執行
router.post('/batch-check', 
  requireRole(['EHS', 'MANAGER', 'ADMIN']), 
  validateBody(batchCheckQualificationsSchema), 
  QualificationController.batchCheckQualifications
);

export default router;