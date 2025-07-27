import { Router, Request, Response } from 'express';

const router = Router();

// 模擬人臉辨識記錄數據
const mockFaceMatchRecords = [
  {
    id: 1,
    personName: '王小明',
    workOrderId: 1,
    workOrderNumber: 'WO-2025-001',
    status: 'SUCCESS',
    syncTime: new Date('2025-01-20T08:30:00'),
    matchScore: 0.98,
    imageUrl: '/images/face/20250120_083000_001.jpg',
    deviceId: 'CAMERA_001',
    location: '主機房A棟入口',
    verificationTime: new Date('2025-01-20T08:30:15'),
    notes: '身份驗證成功',
    createdAt: new Date('2025-01-20T08:30:00'),
    updatedAt: new Date('2025-01-20T08:30:15')
  },
  {
    id: 2,
    personName: '李小華',
    workOrderId: 2,
    workOrderNumber: 'WO-2025-002',
    status: 'PENDING',
    syncTime: new Date('2025-01-25T14:20:00'),
    matchScore: null,
    imageUrl: '/images/face/20250125_142000_002.jpg',
    deviceId: 'CAMERA_002',
    location: 'B棟冷卻塔區域',
    verificationTime: null,
    notes: '等待人臉比對',
    createdAt: new Date('2025-01-25T14:20:00'),
    updatedAt: new Date('2025-01-25T14:20:00')
  },
  {
    id: 3,
    personName: '張大偉',
    workOrderId: 3,
    workOrderNumber: 'WO-2025-003',
    status: 'FAILED',
    syncTime: new Date('2025-01-28T10:15:00'),
    matchScore: 0.45,
    imageUrl: '/images/face/20250128_101500_003.jpg',
    deviceId: 'CAMERA_003',
    location: 'C棟生產線入口',
    verificationTime: new Date('2025-01-28T10:15:30'),
    notes: '人臉比對失敗，相似度不足',
    createdAt: new Date('2025-01-28T10:15:00'),
    updatedAt: new Date('2025-01-28T10:15:30')
  },
  {
    id: 4,
    personName: '陳美玲',
    workOrderId: null,
    workOrderNumber: null,
    status: 'SUCCESS',
    syncTime: new Date('2025-01-30T16:45:00'),
    matchScore: 0.92,
    imageUrl: '/images/face/20250130_164500_004.jpg',
    deviceId: 'CAMERA_004',
    location: '辦公大樓入口',
    verificationTime: new Date('2025-01-30T16:45:10'),
    notes: '非施工期間進入記錄',
    createdAt: new Date('2025-01-30T16:45:00'),
    updatedAt: new Date('2025-01-30T16:45:10')
  }
];

/**
 * @swagger
 * /api/facematch:
 *   get:
 *     summary: 獲取人臉辨識記錄列表
 *     tags: [人臉辨識管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *         description: 篩選辨識狀態
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *         description: 篩選施工單ID
 *       - in: query
 *         name: personName
 *         schema:
 *           type: string
 *         description: 搜尋人員姓名
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: 篩選設備ID
 *     responses:
 *       200:
 *         description: 人臉辨識記錄列表
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
 *                     $ref: '#/components/schemas/FaceMatchRecord'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let filteredRecords = [...mockFaceMatchRecords];
    
    // 狀態篩選
    if (req.query.status) {
      filteredRecords = filteredRecords.filter(record => record.status === req.query.status);
    }
    
    // 施工單篩選
    if (req.query.workOrderId) {
      const workOrderId = parseInt(req.query.workOrderId as string);
      filteredRecords = filteredRecords.filter(record => record.workOrderId === workOrderId);
    }
    
    // 人員姓名搜尋
    if (req.query.personName) {
      const searchTerm = (req.query.personName as string).toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        record.personName.toLowerCase().includes(searchTerm)
      );
    }
    
    // 設備ID篩選
    if (req.query.deviceId) {
      filteredRecords = filteredRecords.filter(record => record.deviceId === req.query.deviceId);
    }
    
    // 按同步時間降序排列
    filteredRecords.sort((a, b) => new Date(b.syncTime).getTime() - new Date(a.syncTime).getTime());
    
    res.json({ success: true, data: filteredRecords });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * @swagger
 * /api/facematch:
 *   post:
 *     summary: 創建新人臉辨識記錄
 *     tags: [人臉辨識管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFaceMatchRecordRequest'
 *     responses:
 *       201:
 *         description: 人臉辨識記錄創建成功
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const recordData = req.body;
    
    // 基本驗證
    if (!recordData.personName) {
      res.status(400).json({
        success: false,
        message: '人員姓名為必填項'
      });
      return;
    }
    
    const newRecord = {
      id: Math.max(...mockFaceMatchRecords.map(r => r.id)) + 1,
      personName: recordData.personName,
      workOrderId: recordData.workOrderId || null,
      workOrderNumber: recordData.workOrderNumber || null,
      status: recordData.status || 'PENDING',
      syncTime: new Date(),
      matchScore: recordData.matchScore || null,
      imageUrl: recordData.imageUrl || '',
      deviceId: recordData.deviceId || '',
      location: recordData.location || '',
      verificationTime: recordData.verificationTime ? new Date(recordData.verificationTime) : null,
      notes: recordData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockFaceMatchRecords.push(newRecord);
    
    res.status(201).json({
      success: true,
      message: '人臉辨識記錄創建成功',
      data: newRecord
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
 * /api/facematch/{id}:
 *   get:
 *     summary: 獲取單一人臉辨識記錄詳細資料
 *     tags: [人臉辨識管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 人臉辨識記錄詳細資料
 *       404:
 *         description: 記錄不存在
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.id);
    const record = mockFaceMatchRecords.find(r => r.id === recordId);
    
    if (!record) {
      res.status(404).json({
        success: false,
        message: '人臉辨識記錄不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: record
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
 * /api/facematch/{id}:
 *   put:
 *     summary: 更新人臉辨識記錄
 *     tags: [人臉辨識管理]
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
 *             $ref: '#/components/schemas/UpdateFaceMatchRecordRequest'
 *     responses:
 *       200:
 *         description: 人臉辨識記錄更新成功
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.id);
    const recordData = req.body;
    
    const recordIndex = mockFaceMatchRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
      res.status(404).json({
        success: false,
        message: '人臉辨識記錄不存在'
      });
      return;
    }
    
    // 更新記錄
    const updatedRecord = {
      ...mockFaceMatchRecords[recordIndex],
      ...recordData,
      id: recordId, // 確保 ID 不被覆蓋
      updatedAt: new Date()
    };
    
    mockFaceMatchRecords[recordIndex] = updatedRecord;
    
    res.json({
      success: true,
      message: '人臉辨識記錄更新成功',
      data: updatedRecord
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
 * /api/facematch/{id}:
 *   delete:
 *     summary: 刪除人臉辨識記錄
 *     tags: [人臉辨識管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 人臉辨識記錄刪除成功
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.id);
    
    const recordIndex = mockFaceMatchRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
      res.status(404).json({
        success: false,
        message: '人臉辨識記錄不存在'
      });
      return;
    }
    
    const deletedRecord = mockFaceMatchRecords.splice(recordIndex, 1)[0];
    
    res.json({
      success: true,
      message: '人臉辨識記錄刪除成功',
      data: deletedRecord
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
 * /api/facematch/verify:
 *   post:
 *     summary: 執行人臉驗證
 *     tags: [人臉辨識管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personName:
 *                 type: string
 *                 description: 待驗證人員姓名
 *               imageUrl:
 *                 type: string
 *                 description: 人臉圖片URL
 *               deviceId:
 *                 type: string
 *                 description: 設備ID
 *               location:
 *                 type: string
 *                 description: 驗證地點
 *     responses:
 *       200:
 *         description: 驗證完成
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { personName, imageUrl, deviceId, location } = req.body;
    
    if (!personName || !imageUrl) {
      res.status(400).json({
        success: false,
        message: '人員姓名和圖片URL為必填項'
      });
      return;
    }
    
    // 模擬人臉驗證過程
    const matchScore = Math.random(); // 隨機生成相似度分數
    const isSuccess = matchScore > 0.8; // 閾值為 0.8
    
    const verificationRecord = {
      id: Math.max(...mockFaceMatchRecords.map(r => r.id)) + 1,
      personName,
      workOrderId: null,
      workOrderNumber: null,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      syncTime: new Date(),
      matchScore: parseFloat(matchScore.toFixed(2)),
      imageUrl,
      deviceId: deviceId || '',
      location: location || '',
      verificationTime: new Date(),
      notes: isSuccess ? '人臉驗證成功' : '人臉驗證失敗，相似度不足',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockFaceMatchRecords.push(verificationRecord);
    
    res.json({
      success: true,
      message: isSuccess ? '人臉驗證成功' : '人臉驗證失敗',
      data: verificationRecord,
      verified: isSuccess
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
 * /api/facematch/sync:
 *   post:
 *     summary: 同步人臉辨識數據
 *     tags: [人臉辨識管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: 設備ID
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: 同步開始時間
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: 同步結束時間
 *     responses:
 *       200:
 *         description: 同步完成
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { deviceId, startTime, endTime } = req.body;
    
    // 模擬同步過程
    let syncedRecords = mockFaceMatchRecords;
    
    if (deviceId) {
      syncedRecords = syncedRecords.filter(record => record.deviceId === deviceId);
    }
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      syncedRecords = syncedRecords.filter(record => {
        const syncTime = new Date(record.syncTime);
        return syncTime >= start && syncTime <= end;
      });
    }
    
    // 更新同步時間
    syncedRecords.forEach(record => {
      const recordIndex = mockFaceMatchRecords.findIndex(r => r.id === record.id);
      if (recordIndex !== -1) {
        mockFaceMatchRecords[recordIndex].syncTime = new Date();
        mockFaceMatchRecords[recordIndex].updatedAt = new Date();
      }
    });
    
    res.json({
      success: true,
      message: '數據同步完成',
      data: {
        syncedCount: syncedRecords.length,
        syncTime: new Date(),
        deviceId: deviceId || 'ALL',
        timeRange: { startTime, endTime }
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