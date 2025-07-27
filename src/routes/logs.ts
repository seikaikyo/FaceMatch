import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: 獲取操作日誌統計
 *     tags: [日誌管理]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 統計天數
 *     responses:
 *       200:
 *         description: 日誌統計信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     moduleStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           module:
 *                             type: string
 *                           total:
 *                             type: integer
 *                           success:
 *                             type: integer
 *                           error:
 *                             type: integer
 *                     userStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           total:
 *                             type: integer
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           total:
 *                             type: integer
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    // 暫時返回模擬統計數據，後續會連接資料庫
    const stats = {
      moduleStats: [
        { module: 'contractors', total: 45, success: 43, error: 2 },
        { module: 'work-orders', total: 32, success: 30, error: 2 },
        { module: 'users', total: 28, success: 28, error: 0 },
        { module: 'qualifications', total: 15, success: 14, error: 1 },
        { module: 'facematch', total: 8, success: 8, error: 0 }
      ],
      userStats: [
        { username: 'admin', total: 67 },
        { username: 'safety', total: 34 },
        { username: 'manager', total: 27 }
      ],
      recentActivities: generateRecentActivities(days)
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// 生成最近活動模擬數據
function generateRecentActivities(days: number) {
  const activities = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    activities.push({
      date: date.toISOString().split('T')[0],
      total: Math.floor(Math.random() * 20) + 5
    });
  }
  
  return activities.reverse();
}

export default router;