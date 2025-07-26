import { Router } from 'express';
import { PersonController } from '../../controllers/personController';
import { authenticateToken, requireContractorAccess } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { 
  createPersonSchema, 
  updatePersonSchema, 
  personQuerySchema,
  mongoIdSchema 
} from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 查詢人員列表 - 需要承攬商權限檢查
router.get('/', validateQuery(personQuerySchema), requireContractorAccess, PersonController.getPersons);

// 查詢單一人員 - 需要承攬商權限檢查
router.get('/:id', validateParams(Joi.object({ id: mongoIdSchema })), requireContractorAccess, PersonController.getPerson);

// 建立人員 - 需要承攬商權限檢查
router.post('/', validateBody(createPersonSchema), requireContractorAccess, PersonController.createPerson);

// 更新人員 - 需要承攬商權限檢查
router.put('/:id', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  validateBody(updatePersonSchema), 
  requireContractorAccess, 
  PersonController.updatePerson
);

// 刪除人員 - 需要承攬商權限檢查
router.delete('/:id', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  requireContractorAccess, 
  PersonController.deletePerson
);

// 查詢人員資格
router.get('/:id/qualifications', 
  validateParams(Joi.object({ id: mongoIdSchema })),
  requireContractorAccess, 
  PersonController.getPersonQualifications
);

export default router;