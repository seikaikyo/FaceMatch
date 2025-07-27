import { Router, Request, Response } from 'express';

const router = Router();

// 模擬用戶數據 (後續會連接真實資料庫)
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    displayName: '系統管理員',
    email: 'admin@company.local',
    department: 'IT部門',
    role: 'ADMIN',
    isActive: true,
    lastLogin: new Date(),
    authType: 'LOCAL',
    jobTitle: '系統管理員',
    phoneNumber: '02-1234-5678',
    employeeId: 'EMP001',
    approvalLevel: 999,
    canApprove: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    username: 'safety',
    displayName: '職環安專員',
    email: 'safety@company.com',
    department: '職業安全衛生室',
    role: 'EHS',
    isActive: true,
    lastLogin: new Date(),
    authType: 'LOCAL',
    jobTitle: '職環安專員',
    phoneNumber: '02-1234-5679',
    employeeId: 'EMP002',
    approvalLevel: 1,
    canApprove: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    username: 'manager',
    displayName: '再生經理',
    email: 'manager@company.com',
    department: '再生事業部',
    role: 'MANAGER',
    isActive: true,
    lastLogin: new Date(),
    authType: 'LOCAL',
    jobTitle: '部門經理',
    phoneNumber: '02-1234-5680',
    employeeId: 'EMP003',
    approvalLevel: 2,
    canApprove: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    username: 'user001',
    displayName: '一般使用者',
    email: 'user001@company.com',
    department: '營運部門',
    role: 'CONTRACTOR',
    isActive: true,
    lastLogin: null,
    authType: 'LOCAL',
    jobTitle: '業務專員',
    phoneNumber: '02-1234-5681',
    employeeId: 'EMP004',
    approvalLevel: null,
    canApprove: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 獲取用戶列表
 *     tags: [用戶管理]
 *     responses:
 *       200:
 *         description: 用戶列表
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
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // 移除密碼欄位
    const users = mockUsers.map(user => {
      const { ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 創建新用戶
 *     tags: [用戶管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: 用戶創建成功
 *       400:
 *         description: 請求參數錯誤
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    // 基本驗證
    if (!userData.username || !userData.email) {
      res.status(400).json({
        success: false,
        message: '用戶名和電子郵件為必填項'
      });
      return;
    }
    
    // 檢查用戶名是否已存在
    const existingUser = mockUsers.find(u => u.username === userData.username);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '用戶名已存在'
      });
      return;
    }
    
    // 創建新用戶 (模擬)
    const newUser = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      email: userData.email,
      department: userData.department || '',
      role: userData.role || 'CONTRACTOR',
      isActive: true,
      lastLogin: null,
      authType: 'LOCAL',
      jobTitle: userData.jobTitle || '',
      phoneNumber: userData.phoneNumber || '',
      employeeId: userData.employeeId || '',
      approvalLevel: userData.approvalLevel || null,
      canApprove: userData.canApprove || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    res.status(201).json({
      success: true,
      message: '用戶創建成功',
      data: newUser
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
 * /api/users/{id}:
 *   put:
 *     summary: 更新用戶資料
 *     tags: [用戶管理]
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
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 用戶更新成功
 *       404:
 *         description: 用戶不存在
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const userData = req.body;
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
      return;
    }
    
    // 更新用戶資料
    const updatedUser = {
      ...mockUsers[userIndex],
      ...userData,
      id: userId, // 確保 ID 不被覆蓋
      updatedAt: new Date()
    };
    
    mockUsers[userIndex] = updatedUser;
    
    res.json({
      success: true,
      message: '用戶資料更新成功',
      data: updatedUser
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
 * /api/users/{id}:
 *   delete:
 *     summary: 刪除用戶
 *     tags: [用戶管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 用戶刪除成功
 *       404:
 *         description: 用戶不存在
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
      return;
    }
    
    // 刪除用戶
    const deletedUser = mockUsers.splice(userIndex, 1)[0];
    
    res.json({
      success: true,
      message: '用戶刪除成功',
      data: deletedUser
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
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重置用戶密碼
 *     tags: [用戶管理]
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
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 密碼重置成功
 *       404:
 *         description: 用戶不存在
 */
router.post('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '新密碼長度至少需要 6 個字元'
      });
      return;
    }
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
      return;
    }
    
    // 模擬密碼重置 (實際應用中會進行加密)
    res.json({
      success: true,
      message: '密碼重置成功'
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
 * /api/users/{id}/toggle-status:
 *   post:
 *     summary: 切換用戶狀態 (啟用/停用)
 *     tags: [用戶管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 用戶狀態更新成功
 *       404:
 *         description: 用戶不存在
 */
router.post('/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
      return;
    }
    
    // 切換用戶狀態
    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      message: `用戶已${user.isActive ? '啟用' : '停用'}`,
      data: user
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
 * /api/users/sync-ad:
 *   post:
 *     summary: 從 AD 同步用戶
 *     tags: [用戶管理]
 *     responses:
 *       200:
 *         description: AD 同步完成
 *       503:
 *         description: AD 服務未啟用
 */
router.post('/sync-ad', async (req: Request, res: Response) => {
  try {
    // 檢查 AD 是否啟用
    const adEnabled = process.env.AD_ENABLED === 'true';
    
    if (!adEnabled) {
      res.status(503).json({
        success: false,
        message: 'AD 服務未啟用'
      });
      return;
    }
    
    // 模擬 AD 同步過程
    res.json({
      success: true,
      message: 'AD 同步完成',
      data: {
        synchronized: 0,
        added: 0,
        updated: 0,
        disabled: 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;