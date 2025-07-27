import { Router, Request, Response } from 'express';

const router = Router();

// 模擬簽核歷史數據
const mockApprovalHistory = [
  {
    id: 1,
    workOrderId: 1,
    level: 1,
    approver: '職環安專員',
    action: 'APPROVED',
    comment: '安全措施完善，核准執行',
    timestamp: new Date('2025-01-12'),
    type: 'EHS_APPROVAL'
  },
  {
    id: 2,
    workOrderId: 1,
    level: 2,
    approver: '再生經理',
    action: 'APPROVED',
    comment: '同意執行',
    timestamp: new Date('2025-01-15'),
    type: 'MANAGER_APPROVAL'
  },
  {
    id: 3,
    workOrderId: 2,
    level: 0,
    approver: '張總監',
    action: 'SUBMIT',
    comment: '提交冷卻系統清潔申請',
    timestamp: new Date('2025-01-25'),
    type: 'SUBMIT'
  }
];

// 模擬施工單數據 (簡化版本，實際應從 work-orders 路由獲取)
const mockWorkOrders = [
  {
    id: 1,
    orderNumber: 'WO-2025-001',
    title: '電力系統維護作業',
    status: 'APPROVED',
    approvalLevel: 2,
    currentApprover: null
  },
  {
    id: 2,
    orderNumber: 'WO-2025-002',
    title: '冷卻系統清潔工程',
    status: 'PENDING_EHS',
    approvalLevel: 1,
    currentApprover: '職環安專員'
  },
  {
    id: 3,
    orderNumber: 'WO-2025-003',
    title: '機械設備維修',
    status: 'DRAFT',
    approvalLevel: 0,
    currentApprover: null
  }
];

/**
 * @swagger
 * /api/approvals/{workOrderId}/submit:
 *   post:
 *     summary: 提交施工單申請
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 提交申請成功
 *       400:
 *         description: 狀態不符合提交條件
 *       404:
 *         description: 施工單不存在
 */
router.post('/:workOrderId/submit', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    const workOrderIndex = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
    
    if (workOrderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = mockWorkOrders[workOrderIndex];
    
    if (workOrder.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: '只有草稿狀態的施工單可以提交'
      });
      return;
    }
    
    // 開始簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.approvalLevel = 1;
    workOrder.currentApprover = '職環安專員';
    
    // 記錄提交歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: 0,
      approver: req.body.submittedBy || '申請人',
      action: 'SUBMIT',
      comment: '提交施工單申請',
      timestamp: new Date(),
      type: 'SUBMIT'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    res.json({
      success: true,
      message: '提交申請成功',
      data: workOrder
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
 * /api/approvals/{workOrderId}/ehs:
 *   post:
 *     summary: 職環安簽核
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
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
 *               action:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: 職環安簽核完成
 */
router.post('/:workOrderId/ehs', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    const { action, comments } = req.body;
    
    const workOrderIndex = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
    
    if (workOrderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = mockWorkOrders[workOrderIndex];
    
    if (workOrder.status !== 'PENDING_EHS') {
      res.status(400).json({
        success: false,
        message: '此施工單目前不在職環安簽核階段'
      });
      return;
    }
    
    // 記錄簽核歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: 1,
      approver: '職環安專員',
      action,
      comment: comments || '',
      timestamp: new Date(),
      type: 'EHS_APPROVAL'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    if (action === 'APPROVED') {
      // 進入經理審核階段
      workOrder.status = 'PENDING_MANAGER';
      workOrder.approvalLevel = 2;
      workOrder.currentApprover = '再生經理';
    } else {
      // 職環安駁回只能退回給申請人
      workOrder.status = 'RETURNED_TO_APPLICANT';
      workOrder.currentApprover = null;
    }
    
    res.json({
      success: true,
      message: `職環安${action === 'APPROVED' ? '核准' : '駁回'}成功`,
      data: workOrder
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
 * /api/approvals/{workOrderId}/manager:
 *   post:
 *     summary: 經理簽核
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
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
 *               action:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               comments:
 *                 type: string
 *               rejectTo:
 *                 type: string
 *                 enum: [APPLICANT, PREVIOUS_LEVEL]
 *     responses:
 *       200:
 *         description: 經理簽核完成
 */
router.post('/:workOrderId/manager', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    const { action, comments, rejectTo } = req.body;
    
    const workOrderIndex = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
    
    if (workOrderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = mockWorkOrders[workOrderIndex];
    
    if (workOrder.status !== 'PENDING_MANAGER') {
      res.status(400).json({
        success: false,
        message: '此施工單目前不在經理簽核階段'
      });
      return;
    }
    
    // 記錄簽核歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: 2,
      approver: '再生經理',
      action,
      comment: comments || '',
      timestamp: new Date(),
      type: 'MANAGER_APPROVAL'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    if (action === 'APPROVED') {
      // 最終核准
      workOrder.status = 'APPROVED';
      workOrder.currentApprover = null;
    } else {
      // 經理可選擇駁回對象
      const targetTo = rejectTo || 'APPLICANT';
      
      if (targetTo === 'PREVIOUS_LEVEL') {
        // 駁回給職環安重新審核
        workOrder.status = 'PENDING_EHS';
        workOrder.approvalLevel = 1;
        workOrder.currentApprover = '職環安專員';
      } else {
        // 駁回給申請人
        workOrder.status = 'RETURNED_TO_APPLICANT';
        workOrder.currentApprover = null;
      }
    }
    
    res.json({
      success: true,
      message: `經理${action === 'APPROVED' ? '核准' : '駁回'}成功`,
      data: workOrder
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
 * /api/approvals/{workOrderId}/admin-reject:
 *   post:
 *     summary: 管理員特殊駁回
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
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
 *               rejectTo:
 *                 type: string
 *                 enum: [APPLICANT, EHS, MANAGER]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: 管理員駁回成功
 */
router.post('/:workOrderId/admin-reject', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    const { rejectTo, comments } = req.body;
    
    const workOrderIndex = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
    
    if (workOrderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = mockWorkOrders[workOrderIndex];
    
    // 記錄管理員操作歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: workOrder.approvalLevel || 0,
      approver: '管理員',
      action: 'REJECTED',
      comment: `管理員駁回: ${comments || ''}`,
      timestamp: new Date(),
      type: 'ADMIN_OVERRIDE'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    switch (rejectTo) {
      case 'EHS':
        workOrder.status = 'PENDING_EHS';
        workOrder.approvalLevel = 1;
        workOrder.currentApprover = '職環安專員';
        break;
      case 'MANAGER':
        workOrder.status = 'PENDING_MANAGER';
        workOrder.approvalLevel = 2;
        workOrder.currentApprover = '再生經理';
        break;
      default: // APPLICANT
        workOrder.status = 'RETURNED_TO_APPLICANT';
        workOrder.currentApprover = null;
        break;
    }
    
    const targetName = rejectTo === 'APPLICANT' ? '申請人' : 
                      rejectTo === 'EHS' ? '職環安' : '再生經理';
    
    res.json({
      success: true,
      message: `管理員駁回成功，已退回給${targetName}`,
      data: workOrder
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
 * /api/approvals/{workOrderId}/resubmit:
 *   post:
 *     summary: 重新提交被駁回的申請
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 重新提交申請成功
 *       400:
 *         description: 狀態不符合重新提交條件
 */
router.post('/:workOrderId/resubmit', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    
    const workOrderIndex = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
    
    if (workOrderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = mockWorkOrders[workOrderIndex];
    
    if (workOrder.status !== 'RETURNED_TO_APPLICANT') {
      res.status(400).json({
        success: false,
        message: '只有被駁回的施工單可以重新提交'
      });
      return;
    }
    
    // 重新開始簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.approvalLevel = 1;
    workOrder.currentApprover = '職環安專員';
    
    // 記錄重新提交歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: 0,
      approver: req.body.submittedBy || '申請人',
      action: 'RESUBMIT',
      comment: '重新提交被駁回的申請',
      timestamp: new Date(),
      type: 'RESUBMIT'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    res.json({
      success: true,
      message: '重新提交申請成功',
      data: workOrder
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
 * /api/approvals/{workOrderId}/history:
 *   get:
 *     summary: 查詢簽核歷史
 *     tags: [簽核管理]
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 簽核歷史列表
 */
router.get('/:workOrderId/history', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.workOrderId);
    
    const history = mockApprovalHistory
      .filter(h => h.workOrderId === workOrderId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    res.json({
      success: true,
      data: history
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
 * /api/approvals/pending:
 *   get:
 *     summary: 獲取待簽核列表
 *     tags: [簽核管理]
 *     parameters:
 *       - in: query
 *         name: approver
 *         schema:
 *           type: string
 *         description: 簽核者篩選
 *     responses:
 *       200:
 *         description: 待簽核列表
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    let pendingOrders = mockWorkOrders.filter(wo => 
      wo.status.startsWith('PENDING_') && wo.currentApprover
    );
    
    // 簽核者篩選
    if (req.query.approver) {
      const approver = req.query.approver as string;
      pendingOrders = pendingOrders.filter(wo => wo.currentApprover === approver);
    }
    
    res.json({
      success: true,
      data: pendingOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;