import Joi from 'joi';

// 通用驗證 Schema
export const mongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('無效的 ID 格式');

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// 認證相關
export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': '用戶名至少需要 3 個字符',
    'string.max': '用戶名不能超過 50 個字符',
    'any.required': '用戶名為必填項'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密碼至少需要 6 個字符',
    'any.required': '密碼為必填項'
  })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// 承攬商相關
export const createContractorSchema = Joi.object({
  name: Joi.string().max(200).required(),
  code: Joi.string().max(50).uppercase().required(),
  contactPerson: Joi.string().max(100).required(),
  contactPhone: Joi.string().max(20).required(),
  contractValidFrom: Joi.date().required(),
  contractValidTo: Joi.date().greater(Joi.ref('contractValidFrom')).required(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'TERMINATED').default('ACTIVE')
});

export const updateContractorSchema = createContractorSchema.fork(Object.keys(createContractorSchema.describe().keys), (schema) => schema.optional());

// 人員相關
export const createPersonSchema = Joi.object({
  contractorId: mongoIdSchema.required(),
  employeeId: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  idNumber: Joi.string().max(20).required(),
  phone: Joi.string().max(20).required(),
  email: Joi.string().email().max(100).optional(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'TERMINATED').default('ACTIVE')
});

export const updatePersonSchema = createPersonSchema.fork(Object.keys(createPersonSchema.describe().keys), (schema) => schema.optional());

// 年度資格相關
export const createQualificationSchema = Joi.object({
  personId: mongoIdSchema.required(),
  qualificationType: Joi.string().max(100).required(),
  trainingDate: Joi.date().required(),
  certificationDate: Joi.date().required(),
  validFrom: Joi.date().required(),
  validTo: Joi.date().greater(Joi.ref('validFrom')).required(),
  certificateNumber: Joi.string().max(100).optional(),
  status: Joi.string().valid('VALID', 'EXPIRED', 'REVOKED').default('VALID')
});

export const updateQualificationSchema = createQualificationSchema.fork(Object.keys(createQualificationSchema.describe().keys), (schema) => schema.optional());

export const renewQualificationSchema = Joi.object({
  newValidTo: Joi.date().required(),
  reason: Joi.string().max(500).required(),
  approvedBy: Joi.string().max(100).required()
});

export const batchCheckQualificationsSchema = Joi.object({
  personIds: Joi.array().items(mongoIdSchema).min(1).required(),
  checkDate: Joi.date().optional()
});

// 查詢參數驗證
export const contractorQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'TERMINATED').optional(),
  search: Joi.string().optional()
});

export const personQuerySchema = paginationSchema.keys({
  contractorId: mongoIdSchema.optional(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'TERMINATED').optional(),
  search: Joi.string().optional()
});

export const qualificationQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('VALID', 'EXPIRED', 'REVOKED').optional(),
  qualificationType: Joi.string().optional(),
  personId: mongoIdSchema.optional()
});