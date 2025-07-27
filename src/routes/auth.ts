import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';

const router = Router();

// 模擬用戶數據 (實際應從資料庫獲取)
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    displayName: '系統管理員',
    email: 'admin@company.local',
    department: 'IT部門',
    role: 'ADMIN',
    authType: 'LOCAL',
    isActive: true,
    canApprove: true,
    approvalLevel: 999,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCwIH7vr9.KLqzO', // admin123
    phoneNumber: '02-1234-5678',
    lastLogin: null
  },
  {
    id: 2,
    username: 'safety',
    displayName: '職環安專員',
    email: 'safety@company.com',
    department: '職業安全衛生室',
    role: 'EHS',
    authType: 'LOCAL',
    isActive: true,
    canApprove: true,
    approvalLevel: 1,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCwIH7vr9.KLqzO', // safety123
    phoneNumber: '02-1234-5679',
    lastLogin: null
  },
  {
    id: 3,
    username: 'manager',
    displayName: '再生經理',
    email: 'manager@company.com',
    department: '再生事業部',
    role: 'MANAGER',
    authType: 'LOCAL',
    isActive: true,
    canApprove: true,
    approvalLevel: 2,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCwIH7vr9.KLqzO', // manager123
    phoneNumber: '02-1234-5680',
    lastLogin: null
  },
  {
    id: 4,
    username: 'user001',
    displayName: '一般使用者',
    email: 'user001@company.com',
    department: '營運部門',
    role: 'CONTRACTOR',
    authType: 'LOCAL',
    isActive: true,
    canApprove: false,
    approvalLevel: null,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCwIH7vr9.KLqzO', // user123
    phoneNumber: '02-1234-5681',
    lastLogin: null
  }
];

// 模擬會話存儲
const mockSessions = new Map<string, any>();

// AD 配置 (模擬)
const AD_CONFIG = {
  enabled: process.env.AD_ENABLED === 'true' || false,
  domain: process.env.AD_DOMAIN || 'company.local',
  url: process.env.AD_URL || 'ldap://company.local:389',
  baseDN: process.env.AD_BASE_DN || 'dc=company,dc=local'
};

// AD 驗證函數 (模擬)
async function authenticateAD(username: string, password: string) {
  if (!AD_CONFIG.enabled) {
    return null;
  }
  
  // 模擬 AD 驗證 (實際應連接 LDAP)
  if (username === 'aduser' && password === 'adpassword') {
    return {
      id: 999,
      username: 'aduser',
      displayName: 'AD 使用者',
      email: `${username}@${AD_CONFIG.domain}`,
      department: 'AD部門',
      role: 'CONTRACTOR',
      authType: 'AD',
      isActive: true,
      canApprove: false,
      approvalLevel: null,
      phoneNumber: '',
      lastLogin: new Date()
    };
  }
  
  return null;
}

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 用戶登入認證
 *     tags: [認證管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用戶名
 *               password:
 *                 type: string
 *                 description: 密碼
 *               useAD:
 *                 type: boolean
 *                 description: 是否使用 AD 驗證
 *                 default: false
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     authType:
 *                       type: string
 *                     email:
 *                       type: string
 *                     department:
 *                       type: string
 *                     canApprove:
 *                       type: boolean
 *                     approvalLevel:
 *                       type: number
 *       401:
 *         description: 登入失敗
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 系統錯誤
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, password, useAD } = req.body;
  
  try {
    let userInfo = null;

    // AD 驗證
    if (useAD && AD_CONFIG.enabled) {
      userInfo = await authenticateAD(username, password);
      if (userInfo) {
        // 模擬更新最後登入時間
        userInfo.lastLogin = new Date();
      }
    } else {
      // 本地驗證 (使用模擬數據)
      const user = mockUsers.find(u => 
        u.username === username && 
        u.authType === 'LOCAL' && 
        u.isActive === true
      );
      
      if (user && user.passwordHash) {
        // 降級處理：直接比較明文密碼 (開發測試用)
        const testPasswords: { [key: string]: string } = {
          'admin': 'admin123',
          'safety': 'safety123', 
          'manager': 'manager123',
          'user001': 'user123'
        };
        let isValidPassword = password === testPasswords[username];
        
        // 如果明文比較失敗，嘗試 bcrypt
        if (!isValidPassword) {
          try {
            isValidPassword = await bcrypt.compare(password, user.passwordHash);
          } catch (error) {
            console.log('bcrypt 比較失敗，使用明文密碼驗證:', error);
          }
        }
        
        if (isValidPassword) {
          userInfo = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            authType: user.authType,
            email: user.email,
            department: user.department,
            canApprove: user.canApprove,
            approvalLevel: user.approvalLevel
          };
          
          // 更新最後登入時間 (模擬)
          const userIndex = mockUsers.findIndex(u => u.id === user.id);
          if (userIndex !== -1) {
            (mockUsers[userIndex] as any).lastLogin = new Date();
          }
        }
      }
    }

    if (userInfo) {
      // 創建會話
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      mockSessions.set(sessionId, userInfo);
      
      res.json({
        success: true,
        token: `token-${userInfo.username}-${Date.now()}`,
        sessionId: sessionId,
        user: userInfo
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: '登入失敗：帳號或密碼錯誤' 
      });
    }
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '登入系統錯誤' 
    });
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: 用戶登出
 *     tags: [認證管理]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 會話ID
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['session-id'] || req.headers['sessionid'];
    
    if (sessionId && typeof sessionId === 'string') {
      // 移除會話
      mockSessions.delete(sessionId);
    }
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登出系統錯誤'
    });
  }
});

/**
 * @swagger
 * /api/verify-session:
 *   get:
 *     summary: 驗證會話狀態
 *     tags: [認證管理]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 會話ID
 *     responses:
 *       200:
 *         description: 會話有效
 *       401:
 *         description: 會話無效
 */
router.get('/verify-session', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['session-id'] || req.headers['sessionid'];
    
    if (sessionId && typeof sessionId === 'string' && mockSessions.has(sessionId)) {
      const userInfo = mockSessions.get(sessionId);
      res.json({
        success: true,
        user: userInfo
      });
    } else {
      res.status(401).json({
        success: false,
        message: '會話無效'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '驗證系統錯誤'
    });
  }
});

export default router;