import { Router, Request, Response } from 'express';

const router = Router();

// 模擬年度資格數據
const mockQualifications = [
  {
    id: 1,
    personName: '王小明',
    type: 'SAFETY',
    name: '職業安全衛生管理員',
    validTo: new Date('2025-12-31'),
    status: 'VALID',
    lastRenewedAt: new Date('2024-01-15'),
    lastRenewedBy: '職環安專員',
    suspendedAt: null,
    suspendedBy: null,
    suspendReason: null,
    renewalNotes: '已完成安全訓練課程',
    contractorId: 1,
    employeeId: 'EMP001',
    certificateNumber: 'SAFETY-2024-001',
    issuingAuthority: '勞動部職業安全衛生署',
    trainingHours: 40,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 2,
    personName: '李小華',
    type: 'TECHNICAL',
    name: '電氣技術士證照',
    validTo: new Date('2025-06-30'),
    status: 'EXPIRES_SOON',
    lastRenewedAt: new Date('2023-07-01'),
    lastRenewedBy: '技術部經理',
    suspendedAt: null,
    suspendedBy: null,
    suspendReason: null,
    renewalNotes: '需要技術更新課程',
    contractorId: 2,
    employeeId: 'EMP002',
    certificateNumber: 'TECH-2023-042',
    issuingAuthority: '勞動部勞動力發展署',
    trainingHours: 80,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-07-01')
  },
  {
    id: 3,
    personName: '張大偉',
    type: 'SAFETY',
    name: '高處作業安全證照',
    validTo: new Date('2024-12-31'),
    status: 'EXPIRED',
    lastRenewedAt: new Date('2022-01-01'),
    lastRenewedBy: '安全部主管',
    suspendedAt: null,
    suspendedBy: null,
    suspendReason: null,
    renewalNotes: '需重新考證',
    contractorId: 3,
    employeeId: 'EMP003',
    certificateNumber: 'HIGH-2022-018',
    issuingAuthority: '職業安全衛生署',
    trainingHours: 24,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 4,
    personName: '陳美玲',
    type: 'TECHNICAL',
    name: '機械操作技術證照',
    validTo: new Date('2026-03-15'),
    status: 'SUSPENDED',
    lastRenewedAt: new Date('2024-03-15'),
    lastRenewedBy: '技術主管',
    suspendedAt: new Date('2024-11-01'),
    suspendedBy: '職環安專員',
    suspendReason: '違反安全操作規程',
    renewalNotes: '已完成進階技術訓練',
    contractorId: 4,
    employeeId: 'EMP004',
    certificateNumber: 'MECH-2024-089',
    issuingAuthority: '技能檢定中心',
    trainingHours: 60,
    createdAt: new Date('2021-03-15'),
    updatedAt: new Date('2024-11-01')
  }
];

/**
 * @swagger
 * /api/qualifications:
 *   get:
 *     summary: 獲取年度資格列表
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [VALID, EXPIRES_SOON, EXPIRED, SUSPENDED]
 *         description: 篩選資格狀態
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SAFETY, TECHNICAL]
 *         description: 篩選資格類型
 *       - in: query
 *         name: personName
 *         schema:
 *           type: string
 *         description: 搜尋人員姓名
 *     responses:
 *       200:
 *         description: 年度資格列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let filteredQualifications = [...mockQualifications];
    
    // 狀態篩選
    if (req.query.status) {
      filteredQualifications = filteredQualifications.filter(q => q.status === req.query.status);
    }
    
    // 類型篩選
    if (req.query.type) {
      filteredQualifications = filteredQualifications.filter(q => q.type === req.query.type);
    }
    
    // 人員姓名搜尋
    if (req.query.personName) {
      const searchTerm = (req.query.personName as string).toLowerCase();
      filteredQualifications = filteredQualifications.filter(q => 
        q.personName.toLowerCase().includes(searchTerm)
      );
    }
    
    // 按創建時間降序排列
    filteredQualifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: filteredQualifications });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}:
 *   get:
 *     summary: 獲取單一年度資格詳細資料
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 年度資格詳細資料
 *       404:
 *         description: 年度資格不存在
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    const qualification = mockQualifications.find(q => q.id === qualificationId);
    
    if (!qualification) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: qualification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}/quick-renew:
 *   post:
 *     summary: 快速續約年度資格
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               renewalPeriod:
 *                 type: number
 *                 description: 續約年數
 *                 default: 1
 *               renewalNotes:
 *                 type: string
 *                 description: 續約備註
 *               renewedBy:
 *                 type: string
 *                 description: 續約人員
 *     responses:
 *       200:
 *         description: 續約成功
 */
router.post('/:id/quick-renew', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    const { renewalPeriod, renewalNotes, renewedBy } = req.body;
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === qualificationId);
    if (qualificationIndex === -1) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 計算新的到期日 (以現有到期日為基準，加上續約期限)
    const currentValidTo = qualification.validTo ? new Date(qualification.validTo) : new Date();
    const newValidTo = new Date(currentValidTo);
    newValidTo.setFullYear(newValidTo.getFullYear() + (renewalPeriod || 1));
    
    // 更新資格
    const updatedQualification = {
      ...qualification,
      validTo: newValidTo,
      status: 'VALID',
      lastRenewedAt: new Date(),
      lastRenewedBy: renewedBy || '系統管理員',
      renewalNotes: renewalNotes || '快速續約',
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null,
      updatedAt: new Date()
    };
    
    mockQualifications[qualificationIndex] = updatedQualification;
    
    res.json({
      success: true,
      data: updatedQualification,
      message: `資格已續約至 ${newValidTo.toLocaleDateString('zh-TW')}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}/quick-suspend:
 *   post:
 *     summary: 快速停用年度資格
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               suspendReason:
 *                 type: string
 *                 description: 停用原因
 *               suspendedBy:
 *                 type: string
 *                 description: 停用人員
 *     responses:
 *       200:
 *         description: 停用成功
 */
router.post('/:id/quick-suspend', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    const { suspendReason, suspendedBy } = req.body;
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === qualificationId);
    if (qualificationIndex === -1) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 更新資格為停用狀態
    const updatedQualification = {
      ...qualification,
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspendedBy: suspendedBy || '系統管理員',
      suspendReason: suspendReason || '管理員停用',
      updatedAt: new Date()
    };
    
    mockQualifications[qualificationIndex] = updatedQualification;
    
    res.json({
      success: true,
      data: updatedQualification,
      message: '資格已停用'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}/reactivate:
 *   post:
 *     summary: 重新啟用年度資格
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reactivatedBy:
 *                 type: string
 *                 description: 重新啟用人員
 *               notes:
 *                 type: string
 *                 description: 重新啟用備註
 *     responses:
 *       200:
 *         description: 重新啟用成功
 */
router.post('/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    const { reactivatedBy, notes } = req.body;
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === qualificationId);
    if (qualificationIndex === -1) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 檢查到期日決定狀態
    const now = new Date();
    const validTo = qualification.validTo ? new Date(qualification.validTo) : null;
    let newStatus = 'VALID';
    
    if (validTo) {
      if (validTo < now) {
        newStatus = 'EXPIRED';
      } else if (validTo.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) { // 30天內到期
        newStatus = 'EXPIRES_SOON';
      }
    }
    
    // 重新啟用資格
    const updatedQualification = {
      ...qualification,
      status: newStatus,
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null,
      renewalNotes: notes || '重新啟用',
      updatedAt: new Date()
    };
    
    mockQualifications[qualificationIndex] = updatedQualification;
    
    res.json({
      success: true,
      data: updatedQualification,
      message: '資格已重新啟用'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications:
 *   post:
 *     summary: 創建新年度資格
 *     tags: [年度資格管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQualificationRequest'
 *     responses:
 *       201:
 *         description: 年度資格創建成功
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const qualificationData = req.body;
    
    // 基本驗證
    if (!qualificationData.personName || !qualificationData.type || !qualificationData.name) {
      res.status(400).json({
        success: false,
        message: '人員姓名、資格類型和資格名稱為必填項'
      });
      return;
    }
    
    // 設定狀態
    const validTo = qualificationData.validTo ? new Date(qualificationData.validTo) : null;
    let status = 'VALID';
    
    if (validTo) {
      const now = new Date();
      if (validTo < now) {
        status = 'EXPIRED';
      } else if (validTo.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) { // 30天內到期
        status = 'EXPIRES_SOON';
      }
    }
    
    const newQualification = {
      id: Math.max(...mockQualifications.map(q => q.id)) + 1,
      personName: qualificationData.personName,
      type: qualificationData.type,
      name: qualificationData.name,
      validTo: validTo,
      status: qualificationData.status || status,
      lastRenewedAt: qualificationData.lastRenewedAt ? new Date(qualificationData.lastRenewedAt) : null,
      lastRenewedBy: qualificationData.lastRenewedBy || null,
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null,
      renewalNotes: qualificationData.renewalNotes || '',
      contractorId: qualificationData.contractorId || null,
      employeeId: qualificationData.employeeId || '',
      certificateNumber: qualificationData.certificateNumber || '',
      issuingAuthority: qualificationData.issuingAuthority || '',
      trainingHours: qualificationData.trainingHours || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockQualifications.push(newQualification as any);
    
    res.status(201).json({
      success: true,
      message: '年度資格創建成功',
      data: newQualification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}:
 *   put:
 *     summary: 更新年度資格資料
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQualificationRequest'
 *     responses:
 *       200:
 *         description: 年度資格更新成功
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    const qualificationData = req.body;
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === qualificationId);
    if (qualificationIndex === -1) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    // 更新年度資格資料
    const updatedQualification = {
      ...mockQualifications[qualificationIndex],
      ...qualificationData,
      id: qualificationId, // 確保 ID 不被覆蓋
      updatedAt: new Date()
    };
    
    mockQualifications[qualificationIndex] = updatedQualification;
    
    res.json({
      success: true,
      message: '年度資格資料更新成功',
      data: updatedQualification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/qualifications/{id}:
 *   delete:
 *     summary: 刪除年度資格
 *     tags: [年度資格管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 年度資格刪除成功
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const qualificationId = parseInt(req.params.id);
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === qualificationId);
    if (qualificationIndex === -1) {
      res.status(404).json({
        success: false,
        message: '年度資格不存在'
      });
      return;
    }
    
    const deletedQualification = mockQualifications.splice(qualificationIndex, 1)[0];
    
    res.json({
      success: true,
      message: '年度資格刪除成功',
      data: deletedQualification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;