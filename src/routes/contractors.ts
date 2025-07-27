import { Router, Request, Response } from 'express';

const router = Router();

// 模擬承攬商數據 (後續會連接真實資料庫)
const mockContractors = [
  {
    id: 1,
    name: '台灣電力工程公司',
    code: 'TAIPOWER001',
    contact: '王經理',
    phone: '02-2345-6789',
    status: 'ACTIVE',
    address: '台北市信義區松仁路100號',
    email: 'contact@taipower.com',
    businessLicense: 'B123456789',
    taxId: '12345678',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: '中華建設股份有限公司',
    code: 'CHUNGHWA002',
    contact: '李主任',
    phone: '02-2456-7890',
    status: 'ACTIVE',
    address: '台北市大安區復興南路200號',
    email: 'info@chunghwa.com',
    businessLicense: 'B987654321',
    taxId: '87654321',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: '大眾環保工程有限公司',
    code: 'ECOFRIEND003',
    contact: '張總監',
    phone: '02-2567-8901',
    status: 'INACTIVE',
    address: '新北市板橋區中山路300號',
    email: 'service@ecofriend.com',
    businessLicense: 'B456789123',
    taxId: '45678912',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: '精密機械維修公司',
    code: 'PRECISION004',
    contact: '陳工程師',
    phone: '03-3456-7890',
    status: 'ACTIVE',
    address: '桃園市中壢區環北路400號',
    email: 'tech@precision.com',
    businessLicense: 'B789123456',
    taxId: '78912345',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * @swagger
 * /api/contractors:
 *   get:
 *     summary: 獲取承攬商列表
 *     tags: [承攬商管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: 篩選承攬商狀態
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋承攬商名稱或代碼
 *     responses:
 *       200:
 *         description: 承攬商列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contractor'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let filteredContractors = [...mockContractors];
    
    // 狀態篩選
    if (req.query.status) {
      filteredContractors = filteredContractors.filter(c => c.status === req.query.status);
    }
    
    // 搜尋功能
    if (req.query.search) {
      const searchTerm = (req.query.search as string).toLowerCase();
      filteredContractors = filteredContractors.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.code.toLowerCase().includes(searchTerm)
      );
    }
    
    // 按創建時間降序排列
    filteredContractors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: filteredContractors });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/contractors:
 *   post:
 *     summary: 創建新承攬商
 *     tags: [承攬商管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContractorRequest'
 *     responses:
 *       201:
 *         description: 承攬商創建成功
 *       400:
 *         description: 請求參數錯誤
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const contractorData = req.body;
    
    // 基本驗證
    if (!contractorData.name || !contractorData.code) {
      res.status(400).json({
        success: false,
        message: '承攬商名稱和代碼為必填項'
      });
      return;
    }
    
    // 檢查代碼是否已存在
    const existingContractor = mockContractors.find(c => c.code === contractorData.code);
    if (existingContractor) {
      res.status(400).json({
        success: false,
        message: '承攬商代碼已存在'
      });
      return;
    }
    
    // 創建新承攬商
    const newContractor = {
      id: Math.max(...mockContractors.map(c => c.id)) + 1,
      name: contractorData.name,
      code: contractorData.code,
      contact: contractorData.contact || '',
      phone: contractorData.phone || '',
      status: contractorData.status || 'ACTIVE',
      address: contractorData.address || '',
      email: contractorData.email || '',
      businessLicense: contractorData.businessLicense || '',
      taxId: contractorData.taxId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockContractors.push(newContractor);
    
    res.status(201).json({
      success: true,
      message: '承攬商創建成功',
      data: newContractor
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
 * /api/contractors/{id}:
 *   get:
 *     summary: 獲取單一承攬商詳細資料
 *     tags: [承攬商管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 承攬商詳細資料
 *       404:
 *         description: 承攬商不存在
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    const contractor = mockContractors.find(c => c.id === contractorId);
    
    if (!contractor) {
      res.status(404).json({
        success: false,
        message: '承攬商不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: contractor
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
 * /api/contractors/{id}:
 *   put:
 *     summary: 更新承攬商資料
 *     tags: [承攬商管理]
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
 *             $ref: '#/components/schemas/UpdateContractorRequest'
 *     responses:
 *       200:
 *         description: 承攬商更新成功
 *       404:
 *         description: 承攬商不存在
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    const contractorData = req.body;
    
    const contractorIndex = mockContractors.findIndex(c => c.id === contractorId);
    if (contractorIndex === -1) {
      res.status(404).json({
        success: false,
        message: '承攬商不存在'
      });
      return;
    }
    
    // 如果更新代碼，檢查是否與其他承攬商重複
    if (contractorData.code && contractorData.code !== mockContractors[contractorIndex].code) {
      const existingContractor = mockContractors.find(c => c.code === contractorData.code && c.id !== contractorId);
      if (existingContractor) {
        res.status(400).json({
          success: false,
          message: '承攬商代碼已存在'
        });
        return;
      }
    }
    
    // 更新承攬商資料
    const updatedContractor = {
      ...mockContractors[contractorIndex],
      ...contractorData,
      id: contractorId, // 確保 ID 不被覆蓋
      updatedAt: new Date()
    };
    
    mockContractors[contractorIndex] = updatedContractor;
    
    res.json({
      success: true,
      message: '承攬商資料更新成功',
      data: updatedContractor
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
 * /api/contractors/{id}:
 *   delete:
 *     summary: 刪除承攬商
 *     tags: [承攬商管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 承攬商刪除成功
 *       404:
 *         description: 承攬商不存在
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const contractorId = parseInt(req.params.id);
    
    const contractorIndex = mockContractors.findIndex(c => c.id === contractorId);
    if (contractorIndex === -1) {
      res.status(404).json({
        success: false,
        message: '承攬商不存在'
      });
      return;
    }
    
    // 刪除承攬商
    const deletedContractor = mockContractors.splice(contractorIndex, 1)[0];
    
    res.json({
      success: true,
      message: '承攬商刪除成功',
      data: deletedContractor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;