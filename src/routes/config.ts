import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/ad-config:
 *   get:
 *     summary: 獲取 AD 配置
 *     tags: [配置管理]
 *     responses:
 *       200:
 *         description: AD 配置信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   description: AD 是否啟用
 *                 domain:
 *                   type: string
 *                   description: AD 網域
 */
router.get('/ad-config', (req: Request, res: Response) => {
  // 從環境變數讀取 AD 設定，與 Legacy API 保持一致
  const adConfig = {
    enabled: process.env.AD_ENABLED === 'true' || false,
    domain: process.env.AD_DOMAIN || 'your-domain.com'
  };
  
  res.json(adConfig);
});

/**
 * @swagger
 * /api/approvers:
 *   get:
 *     summary: 獲取簽核者清單
 *     tags: [用戶管理]
 *     responses:
 *       200:
 *         description: 簽核者列表
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       role:
 *                         type: string
 *                       approvalLevel:
 *                         type: integer
 *                       department:
 *                         type: string
 */
router.get('/approvers', async (req: Request, res: Response) => {
  try {
    // 暫時返回模擬數據，後續會連接資料庫
    const approvers = [
      {
        id: 2,
        username: 'safety',
        displayName: '職環安專員',
        role: 'EHS',
        approvalLevel: 1,
        department: '職業安全衛生室'
      },
      {
        id: 3,
        username: 'manager',
        displayName: '再生經理',
        role: 'MANAGER',
        approvalLevel: 2,
        department: '再生事業部'
      }
    ];
    
    res.json({ success: true, data: approvers });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;