import { Router } from 'express';
import { ContractorController } from '../../controllers/contractorController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { 
  createContractorSchema, 
  updateContractorSchema, 
  contractorQuerySchema,
  mongoIdSchema 
} from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 查詢承攬商列表 - 所有角色都可以查看
router.get('/', validateQuery(contractorQuerySchema), ContractorController.getContractors);

// 查詢單一承攬商 - 所有角色都可以查看
router.get('/:id', validateParams(Joi.object({ id: mongoIdSchema })), ContractorController.getContractor);

// 建立承攬商 - 僅管理員可以建立
router.post('/', 
  requireRole(['ADMIN']), 
  validateBody(createContractorSchema), 
  ContractorController.createContractor
);

// 更新承攬商 - 僅管理員可以更新
router.put('/:id', 
  requireRole(['ADMIN']), 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(updateContractorSchema), 
  ContractorController.updateContractor
);

// 刪除承攬商 - 僅管理員可以刪除
router.delete('/:id', 
  requireRole(['ADMIN']), 
  validateParams(Joi.object({ id: mongoIdSchema })),
  ContractorController.deleteContractor
);

export default router;