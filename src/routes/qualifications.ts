import { Router } from 'express';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import logger from '../utils/logger';

const router = Router();

// 模擬 Qualification 模型 (暫時使用，之後會改為實際 Sequelize 模型)
interface QualificationData {
  id: number;
  employeeName: string;
  qualificationType: string;
  qualificationName: string;
  validTo: string;
  status: string;
  lastRenewedAt?: string;
  lastRenewedBy?: string;
  renewalNotes?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendReason?: string;
}

// 暫時模擬資格資料 (之後會改為資料庫查詢)
const mockQualifications: QualificationData[] = [
  {
    id: 1,
    employeeName: '張工程師',
    qualificationType: '安全資格',
    qualificationName: '安全教育訓練',
    validTo: '2025-12-31',
    status: 'VALID'
  },
  {
    id: 2,
    employeeName: '李技師',
    qualificationType: '技術資格',
    qualificationName: '電機技師',
    validTo: '2025-06-30',
    status: 'VALID'
  },
  {
    id: 3,
    employeeName: '陳主任',
    qualificationType: '安全資格',
    qualificationName: '危險物品管理',
    validTo: '2025-02-28',
    status: 'EXPIRED'
  }
];

// 取得所有年度資格
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('取得年度資格清單');
    
    // 模擬資料庫查詢
    const qualifications = mockQualifications;
    
    return res.json({
      success: true,
      data: qualifications,
      total: qualifications.length
    });
  } catch (error) {
    logger.error('取得年度資格清單失敗:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得年度資格清單失敗' 
    });
  }
});

// 取得單一年度資格
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    logger.info(`取得年度資格詳細資料: ${id}`);
    
    const qualification = mockQualifications.find(q => q.id === id);
    
    if (!qualification) {
      return res.status(404).json({ 
        success: false, 
        message: '資格不存在' 
      });
    }
    
    return res.json({
      success: true,
      data: qualification
    });
  } catch (error) {
    logger.error('取得年度資格詳細資料失敗:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得年度資格詳細資料失敗' 
    });
  }
});

// 快速續約年度資格
router.post('/:id/quick-renew', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { renewalPeriod, renewalNotes, renewedBy } = req.body;
    
    logger.info(`快速續約年度資格: ${id}`, { renewalPeriod, renewedBy });
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === id);
    
    if (qualificationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: '資格不存在' 
      });
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 計算新的到期日 (以現有到期日為基準，加上續約期限)
    const currentValidTo = new Date(qualification.validTo);
    const newValidTo = new Date(currentValidTo);
    newValidTo.setFullYear(newValidTo.getFullYear() + (renewalPeriod || 1));
    
    // 更新資格資料
    mockQualifications[qualificationIndex] = {
      ...qualification,
      validTo: newValidTo.toISOString().split('T')[0],
      status: 'VALID',
      lastRenewedAt: new Date().toISOString(),
      lastRenewedBy: renewedBy || '系統管理員',
      renewalNotes: renewalNotes || '快速續約',
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspendReason: undefined
    };
    
    logger.info(`資格續約成功: ${id} -> ${newValidTo.toLocaleDateString('zh-TW')}`);
    
    return res.json({ 
      success: true, 
      data: mockQualifications[qualificationIndex],
      message: `資格已續約至 ${newValidTo.toLocaleDateString('zh-TW')}`
    });
  } catch (error) {
    logger.error('快速續約年度資格失敗:', error);
    return res.status(500).json({ 
      success: false, 
      message: '快速續約年度資格失敗' 
    });
  }
});

// 快速停用年度資格
router.post('/:id/quick-suspend', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { suspendReason, suspendedBy } = req.body;
    
    logger.info(`快速停用年度資格: ${id}`, { suspendReason, suspendedBy });
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === id);
    
    if (qualificationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: '資格不存在' 
      });
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 更新資格狀態為停用
    mockQualifications[qualificationIndex] = {
      ...qualification,
      status: 'SUSPENDED',
      suspendedAt: new Date().toISOString(),
      suspendedBy: suspendedBy || '系統管理員',
      suspendReason: suspendReason || '管理員停用'
    };
    
    logger.info(`資格停用成功: ${id}`);
    
    return res.json({ 
      success: true, 
      data: mockQualifications[qualificationIndex],
      message: '資格已停用'
    });
  } catch (error) {
    logger.error('快速停用年度資格失敗:', error);
    return res.status(500).json({ 
      success: false, 
      message: '快速停用年度資格失敗' 
    });
  }
});

// 啟用年度資格
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { activatedBy } = req.body;
    
    logger.info(`啟用年度資格: ${id}`, { activatedBy });
    
    const qualificationIndex = mockQualifications.findIndex(q => q.id === id);
    
    if (qualificationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: '資格不存在' 
      });
    }
    
    const qualification = mockQualifications[qualificationIndex];
    
    // 更新資格狀態為有效
    mockQualifications[qualificationIndex] = {
      ...qualification,
      status: 'VALID',
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspendReason: undefined
    };
    
    logger.info(`資格啟用成功: ${id}`);
    
    return res.json({ 
      success: true, 
      data: mockQualifications[qualificationIndex],
      message: '資格已啟用'
    });
  } catch (error) {
    logger.error('啟用年度資格失敗:', error);
    return res.status(500).json({ 
      success: false, 
      message: '啟用年度資格失敗' 
    });
  }
});

export default router;