import { Router, Request, Response } from 'express';

const router = Router();

// 模擬施工單數據
const mockWorkOrders = [
  {
    id: 1,
    orderNumber: 'WO-2025-001',
    title: '電力系統維護作業',
    contractorId: 1,
    contractorName: '台灣電力工程公司',
    location: '主機房A棟',
    status: 'APPROVED',
    submittedBy: '王經理',
    currentApprover: null,
    approvalLevel: 2,
    totalLevels: 2,
    approvedAt: new Date('2025-01-15'),
    approvedBy: '再生經理',
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    returnedAt: null,
    returnedBy: null,
    statusChangeRequested: null,
    statusChangeReason: null,
    statusChangeRequestedBy: null,
    statusChangeRequestedAt: null,
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-22'),
    description: '定期電力系統檢查與維護',
    riskLevel: 'MEDIUM',
    safetyMeasures: '配戴安全帽、絕緣手套，斷電作業',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 2,
    orderNumber: 'WO-2025-002',
    title: '冷卻系統清潔工程',
    contractorId: 3,
    contractorName: '大眾環保工程有限公司',
    location: 'B棟冷卻塔',
    status: 'PENDING',
    submittedBy: '張總監',
    currentApprover: '職環安專員',
    approvalLevel: 1,
    totalLevels: 2,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    returnedAt: null,
    returnedBy: null,
    statusChangeRequested: null,
    statusChangeReason: null,
    statusChangeRequestedBy: null,
    statusChangeRequestedAt: null,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-03'),
    description: '冷卻塔清潔與水質檢測',
    riskLevel: 'HIGH',
    safetyMeasures: '高處作業安全繩索、防毒面具',
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-01-25')
  },
  {
    id: 3,
    orderNumber: 'WO-2025-003',
    title: '機械設備維修',
    contractorId: 4,
    contractorName: '精密機械維修公司',
    location: 'C棟生產線',
    status: 'DRAFT',
    submittedBy: '陳工程師',
    currentApprover: null,
    approvalLevel: 0,
    totalLevels: 2,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    returnedAt: null,
    returnedBy: null,
    statusChangeRequested: null,
    statusChangeReason: null,
    statusChangeRequestedBy: null,
    statusChangeRequestedAt: null,
    startDate: new Date('2025-02-10'),
    endDate: new Date('2025-02-12'),
    description: '生產線設備定期保養',
    riskLevel: 'LOW',
    safetyMeasures: '標準作業程序、設備停機',
    createdAt: new Date('2025-01-28'),
    updatedAt: new Date('2025-01-28')
  }
];

// 簽核歷史模擬數據
const mockApprovalHistory = [
  {
    id: 1,
    workOrderId: 1,
    level: 1,
    approver: '職環安專員',
    action: 'APPROVED',
    comment: '安全措施完善，核准執行',
    timestamp: new Date('2025-01-12'),
    type: 'WORKFLOW'
  },
  {
    id: 2,
    workOrderId: 1,
    level: 2,
    approver: '再生經理',
    action: 'APPROVED',
    comment: '同意執行',
    timestamp: new Date('2025-01-15'),
    type: 'WORKFLOW'
  }
];

// 獲取下一級簽核者
function getNextApprover(level: number): string | null {
  switch (level) {
    case 1:
      return '職環安專員';
    case 2:
      return '再生經理';
    default:
      return null;
  }
}

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: 獲取施工單列表
 *     tags: [施工單管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, REJECTED, RETURNED]
 *         description: 篩選施工單狀態
 *       - in: query
 *         name: contractorId
 *         schema:
 *           type: integer
 *         description: 篩選承攬商
 *     responses:
 *       200:
 *         description: 施工單列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let filteredOrders = [...mockWorkOrders];
    
    // 狀態篩選
    if (req.query.status) {
      filteredOrders = filteredOrders.filter(order => order.status === req.query.status);
    }
    
    // 承攬商篩選
    if (req.query.contractorId) {
      const contractorId = parseInt(req.query.contractorId as string);
      filteredOrders = filteredOrders.filter(order => order.contractorId === contractorId);
    }
    
    // 按創建時間降序排列
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: filteredOrders });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: 創建新施工單
 *     tags: [施工單管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkOrderRequest'
 *     responses:
 *       201:
 *         description: 施工單創建成功
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    
    // 基本驗證
    if (!orderData.title || !orderData.contractorId) {
      res.status(400).json({
        success: false,
        message: '施工單標題和承攬商為必填項'
      });
      return;
    }
    
    // 生成施工單編號
    const orderNumber = `WO-${new Date().getFullYear()}-${String(mockWorkOrders.length + 1).padStart(3, '0')}`;
    
    // 設定初始狀態
    const status = orderData.status || 'DRAFT';
    const approvalLevel = status === 'DRAFT' ? 0 : 1;
    const currentApprover = status === 'DRAFT' ? null : getNextApprover(1);
    
    const newWorkOrder = {
      id: Math.max(...mockWorkOrders.map(o => o.id)) + 1,
      orderNumber,
      title: orderData.title,
      contractorId: orderData.contractorId,
      contractorName: `承攬商-${orderData.contractorId}`, // 實際應從承攬商數據獲取
      location: orderData.location || '',
      status,
      submittedBy: orderData.submittedBy || '系統管理員',
      currentApprover,
      approvalLevel,
      totalLevels: 2,
      approvedAt: null as Date | null,
      approvedBy: null as string | null,
      rejectedAt: null as Date | null,
      rejectedBy: null as string | null,
      rejectionReason: null as string | null,
      returnedAt: null as Date | null,
      returnedBy: null as string | null,
      statusChangeRequested: null as string | null,
      statusChangeReason: null as string | null,
      statusChangeRequestedBy: null as string | null,
      statusChangeRequestedAt: null as Date | null,
      startDate: orderData.startDate ? new Date(orderData.startDate) : null as Date | null,
      endDate: orderData.endDate ? new Date(orderData.endDate) : null as Date | null,
      description: orderData.description || '',
      riskLevel: orderData.riskLevel || 'MEDIUM',
      safetyMeasures: orderData.safetyMeasures || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockWorkOrders.push(newWorkOrder as any);
    
    res.status(201).json({
      success: true,
      message: '施工單創建成功',
      data: newWorkOrder
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
 * /api/work-orders/{id}:
 *   get:
 *     summary: 獲取單一施工單詳細資料
 *     tags: [施工單管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 施工單詳細資料
 *       404:
 *         description: 施工單不存在
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    const workOrder = mockWorkOrders.find(o => o.id === workOrderId);
    
    if (!workOrder) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    res.json({
      success: true,
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
 * /api/work-orders/{id}:
 *   put:
 *     summary: 更新施工單資料
 *     tags: [施工單管理]
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
 *             $ref: '#/components/schemas/UpdateWorkOrderRequest'
 *     responses:
 *       200:
 *         description: 施工單更新成功
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    const orderData = req.body;
    
    const orderIndex = mockWorkOrders.findIndex(o => o.id === workOrderId);
    if (orderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    // 更新施工單資料
    const updatedOrder = {
      ...mockWorkOrders[orderIndex],
      ...orderData,
      id: workOrderId, // 確保 ID 不被覆蓋
      updatedAt: new Date()
    };
    
    mockWorkOrders[orderIndex] = updatedOrder;
    
    res.json({
      success: true,
      message: '施工單資料更新成功',
      data: updatedOrder
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
 * /api/work-orders/{id}:
 *   delete:
 *     summary: 刪除施工單
 *     tags: [施工單管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 施工單刪除成功
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    
    const orderIndex = mockWorkOrders.findIndex(o => o.id === workOrderId);
    if (orderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const deletedOrder = mockWorkOrders.splice(orderIndex, 1)[0];
    
    res.json({
      success: true,
      message: '施工單刪除成功',
      data: deletedOrder
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
 * /api/work-orders/{id}/request-status-change:
 *   post:
 *     summary: 請求狀態變更
 *     tags: [施工單管理]
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
 *               newStatus:
 *                 type: string
 *               reason:
 *                 type: string
 *               requestedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: 狀態變更請求成功
 */
router.post('/:id/request-status-change', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    const { newStatus, reason, requestedBy } = req.body;
    
    const orderIndex = mockWorkOrders.findIndex(o => o.id === workOrderId);
    if (orderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    // 更新狀態變更請求
    const updatedOrder = {
      ...mockWorkOrders[orderIndex],
      statusChangeRequested: newStatus,
      statusChangeReason: reason,
      statusChangeRequestedBy: requestedBy,
      statusChangeRequestedAt: new Date(),
      updatedAt: new Date()
    };
    mockWorkOrders[orderIndex] = updatedOrder as any;
    
    res.json({
      success: true,
      message: '狀態變更請求已提交',
      data: mockWorkOrders[orderIndex]
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
 * /api/work-orders/{id}/approve:
 *   post:
 *     summary: 施工單簽核
 *     tags: [施工單管理]
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
 *               action:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, RETURNED]
 *               comment:
 *                 type: string
 *               approver:
 *                 type: string
 *     responses:
 *       200:
 *         description: 簽核完成
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    const { action, comment, approver } = req.body;
    
    const orderIndex = mockWorkOrders.findIndex(o => o.id === workOrderId);
    if (orderIndex === -1) {
      res.status(404).json({
        success: false,
        message: '施工單不存在'
      });
      return;
    }
    
    const workOrder = { ...mockWorkOrders[orderIndex] };
    
    // 記錄簽核歷史
    const historyRecord = {
      id: mockApprovalHistory.length + 1,
      workOrderId: workOrder.id,
      level: workOrder.approvalLevel,
      approver: approver || '管理員',
      action,
      comment: comment || '',
      timestamp: new Date(),
      type: 'WORKFLOW'
    };
    
    mockApprovalHistory.push(historyRecord);
    
    // 更新施工單狀態
    if (action === 'APPROVED') {
      if (workOrder.approvalLevel >= workOrder.totalLevels) {
        workOrder.status = 'APPROVED';
        workOrder.approvedAt = new Date();
        workOrder.approvedBy = approver || '管理員';
        workOrder.currentApprover = null;
      } else {
        workOrder.approvalLevel++;
        workOrder.currentApprover = getNextApprover(workOrder.approvalLevel);
      }
    } else if (action === 'REJECTED') {
      workOrder.status = 'REJECTED';
      (workOrder as any).rejectedAt = new Date();
      workOrder.rejectedBy = approver || '管理員';
      workOrder.rejectionReason = comment || '';
      workOrder.currentApprover = null;
    } else if (action === 'RETURNED') {
      workOrder.status = 'RETURNED';
      (workOrder as any).returnedAt = new Date();
      workOrder.returnedBy = approver || '管理員';
      workOrder.currentApprover = null;
    }
    
    workOrder.updatedAt = new Date();
    mockWorkOrders[orderIndex] = workOrder;
    
    res.json({
      success: true,
      message: '簽核完成',
      data: workOrder,
      history: historyRecord
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
 * /api/work-orders/{id}/history:
 *   get:
 *     summary: 獲取施工單簽核歷史
 *     tags: [施工單管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 簽核歷史
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const workOrderId = parseInt(req.params.id);
    
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
 * /api/work-orders/pending-approval:
 *   get:
 *     summary: 獲取待簽核施工單列表
 *     tags: [施工單管理]
 *     responses:
 *       200:
 *         description: 待簽核施工單列表
 */
router.get('/pending-approval', async (req: Request, res: Response) => {
  try {
    const pendingOrders = mockWorkOrders.filter(order => 
      order.status === 'PENDING' && order.currentApprover
    );
    
    // 按創建時間降序排列
    pendingOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
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