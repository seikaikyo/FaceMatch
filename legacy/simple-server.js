const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

// 中間件
app.use(cors());
app.use(express.json());

// 模擬資料
let contractors = [
  {
    _id: '1',
    name: '台積電承攬商',
    code: 'TSMC001',
    contactPerson: '張三',
    contactPhone: '02-1234-5678',
    contractValidFrom: '2025-01-01',
    contractValidTo: '2025-12-31',
    status: 'ACTIVE'
  },
  {
    _id: '2', 
    name: '聯發科承攬商',
    code: 'MTK002',
    contactPerson: '李四',
    contactPhone: '02-2345-6789',
    contractValidFrom: '2025-01-01',
    contractValidTo: '2025-12-31',
    status: 'ACTIVE'
  },
  {
    _id: '3',
    name: '富士康承攬商',
    code: 'FOXCONN003',
    contactPerson: '王五',
    contactPhone: '02-3456-7890',
    contractValidFrom: '2024-06-01',
    contractValidTo: '2025-05-31',
    status: 'INACTIVE'
  }
];

// 年度資格模擬資料
let qualifications = [
  {
    _id: '1',
    contractorId: '1',
    personId: 'P001',
    personName: '張工程師',
    qualificationType: 'SAFETY',
    qualificationName: '職業安全衛生教育訓練',
    obtainedDate: '2024-01-15',
    expiryDate: '2025-01-15',
    status: 'VALID',
    certificateNumber: 'CERT-2024-001',
    issuingAuthority: '勞動部職業安全衛生署'
  },
  {
    _id: '2',
    contractorId: '1',
    personId: 'P002',
    personName: '李技師',
    qualificationType: 'TECHNICAL',
    qualificationName: '電機技師證照',
    obtainedDate: '2023-03-20',
    expiryDate: '2025-03-20',
    status: 'VALID',
    certificateNumber: 'EE-2023-002',
    issuingAuthority: '經濟部'
  },
  {
    _id: '3',
    contractorId: '2',
    personId: 'P003',
    personName: '陳主任',
    qualificationType: 'SAFETY',
    qualificationName: '危險物品處理證照',
    obtainedDate: '2024-06-10',
    expiryDate: '2025-08-10',
    status: 'EXPIRES_SOON',
    certificateNumber: 'HAZ-2024-003',
    issuingAuthority: '消防署'
  }
];

// FaceMatch 整合模擬資料
let faceMatchIntegrations = [
  {
    _id: '1',
    workOrderId: '1',
    personId: 'P001',
    personName: '張工程師',
    photoUrl: '/uploads/photos/person_001.jpg',
    syncStatus: 'SUCCESS',
    lastSyncAt: '2025-01-20T10:30:00Z',
    faceMatchId: 'FM001'
  },
  {
    _id: '2',
    workOrderId: '1',
    personId: 'P002',
    personName: '李技師',
    photoUrl: '/uploads/photos/person_002.jpg',
    syncStatus: 'PENDING',
    lastSyncAt: null,
    faceMatchId: null
  }
];

let workOrders = [
  {
    _id: '1',
    orderNumber: 'WO-2025-001',
    title: '設備維護工程',
    description: '定期設備維護',
    contractorId: '1',
    siteLocation: '廠區A',
    workType: '維修作業',
    riskLevel: 'LOW',
    status: 'APPROVED',
    plannedStartTime: '2025-08-01T09:00:00',
    plannedEndTime: '2025-08-01T17:00:00',
    safetyRequirements: ['穿戴安全帽', '穿戴安全鞋'],
    emergencyContact: '緊急聯絡人 02-1234-5678'
  }
];

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Test server is running'
  });
});

// 登入
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: '登入成功',
      data: {
        token: 'test-token-12345',
        user: {
          id: '1',
          username: 'admin',
          name: '系統管理員',
          role: 'ADMIN'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用戶名或密碼錯誤'
    });
  }
});

// 中間件：驗證 token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token === 'test-token-12345') {
    req.user = { _id: '1', username: 'admin', role: 'ADMIN' };
    next();
  } else {
    res.status(401).json({ success: false, message: '無效的認證 Token' });
  }
};

// 承攬商 API
app.get('/api/contractors', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '獲取承攬商列表成功',
    data: contractors,
    pagination: {
      page: 1,
      limit: 10,
      total: contractors.length,
      totalPages: 1
    }
  });
});

app.get('/api/contractors/:id', authenticateToken, (req, res) => {
  const contractor = contractors.find(c => c._id === req.params.id);
  if (contractor) {
    res.json({ success: true, data: contractor });
  } else {
    res.status(404).json({ success: false, message: '承攬商不存在' });
  }
});

app.post('/api/contractors', authenticateToken, (req, res) => {
  const newContractor = {
    _id: String(contractors.length + 1),
    ...req.body,
    status: 'ACTIVE'
  };
  contractors.push(newContractor);
  res.json({ success: true, data: newContractor });
});

app.put('/api/contractors/:id', authenticateToken, (req, res) => {
  const index = contractors.findIndex(c => c._id === req.params.id);
  if (index !== -1) {
    contractors[index] = { ...contractors[index], ...req.body };
    res.json({ success: true, data: contractors[index] });
  } else {
    res.status(404).json({ success: false, message: '承攬商不存在' });
  }
});

app.delete('/api/contractors/:id', authenticateToken, (req, res) => {
  const index = contractors.findIndex(c => c._id === req.params.id);
  if (index !== -1) {
    contractors.splice(index, 1);
    res.json({ success: true, message: '刪除成功' });
  } else {
    res.status(404).json({ success: false, message: '承攬商不存在' });
  }
});

// 工作單 API
app.get('/api/work-orders', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '獲取工作單列表成功',
    data: workOrders,
    pagination: {
      page: 1,
      limit: 10,
      total: workOrders.length,
      totalPages: 1
    }
  });
});

app.get('/api/work-orders/:id', authenticateToken, (req, res) => {
  const workOrder = workOrders.find(w => w._id === req.params.id);
  if (workOrder) {
    res.json({ success: true, data: workOrder });
  } else {
    res.status(404).json({ success: false, message: '工作單不存在' });
  }
});

app.post('/api/work-orders', authenticateToken, (req, res) => {
  const newWorkOrder = {
    _id: String(workOrders.length + 1),
    orderNumber: `WO-2025-${String(workOrders.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'DRAFT'
  };
  workOrders.push(newWorkOrder);
  res.json({ success: true, data: newWorkOrder });
});

app.put('/api/work-orders/:id', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w._id === req.params.id);
  if (index !== -1) {
    workOrders[index] = { ...workOrders[index], ...req.body };
    res.json({ success: true, data: workOrders[index] });
  } else {
    res.status(404).json({ success: false, message: '工作單不存在' });
  }
});

app.delete('/api/work-orders/:id', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w._id === req.params.id);
  if (index !== -1) {
    workOrders.splice(index, 1);
    res.json({ success: true, message: '刪除成功' });
  } else {
    res.status(404).json({ success: false, message: '工作單不存在' });
  }
});

// 年度資格 API
app.get('/api/qualifications', authenticateToken, (req, res) => {
  const { contractorId, status, qualificationType } = req.query;
  let filteredQualifications = qualifications;
  
  if (contractorId) {
    filteredQualifications = filteredQualifications.filter(q => q.contractorId === contractorId);
  }
  if (status) {
    filteredQualifications = filteredQualifications.filter(q => q.status === status);
  }
  if (qualificationType) {
    filteredQualifications = filteredQualifications.filter(q => q.qualificationType === qualificationType);
  }
  
  res.json({
    success: true,
    message: '獲取資格列表成功',
    data: filteredQualifications,
    pagination: {
      page: 1,
      limit: 10,
      total: filteredQualifications.length,
      totalPages: 1
    }
  });
});

app.post('/api/qualifications', authenticateToken, (req, res) => {
  const newQualification = {
    _id: String(qualifications.length + 1),
    ...req.body,
    status: 'VALID'
  };
  qualifications.push(newQualification);
  res.json({ success: true, data: newQualification });
});

app.put('/api/qualifications/:id', authenticateToken, (req, res) => {
  const index = qualifications.findIndex(q => q._id === req.params.id);
  if (index !== -1) {
    qualifications[index] = { ...qualifications[index], ...req.body };
    res.json({ success: true, data: qualifications[index] });
  } else {
    res.status(404).json({ success: false, message: '資格不存在' });
  }
});

app.delete('/api/qualifications/:id', authenticateToken, (req, res) => {
  const index = qualifications.findIndex(q => q._id === req.params.id);
  if (index !== -1) {
    qualifications.splice(index, 1);
    res.json({ success: true, message: '刪除成功' });
  } else {
    res.status(404).json({ success: false, message: '資格不存在' });
  }
});

// FaceMatch 整合 API
app.get('/api/facematch/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      connected: true,
      server: '10.6.116.200:80',
      lastCheck: new Date().toISOString(),
      version: '2.0'
    }
  });
});

app.get('/api/facematch/integrations', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '獲取整合記錄成功',
    data: faceMatchIntegrations,
    pagination: {
      page: 1,
      limit: 10,
      total: faceMatchIntegrations.length,
      totalPages: 1
    }
  });
});

app.post('/api/facematch/sync', authenticateToken, (req, res) => {
  const { workOrderIds } = req.body;
  const results = workOrderIds.map(id => ({
    workOrderId: id,
    success: Math.random() > 0.3, // 70% 成功率
    message: Math.random() > 0.3 ? '同步成功' : '同步失敗：網路連線問題'
  }));
  
  res.json({
    success: true,
    message: '批次同步完成',
    data: { results, totalCount: workOrderIds.length }
  });
});

app.post('/api/facematch/upload', authenticateToken, (req, res) => {
  // 模擬照片上傳
  const newIntegration = {
    _id: String(faceMatchIntegrations.length + 1),
    workOrderId: req.body.workOrderId,
    personId: req.body.personId,
    personName: req.body.personName,
    photoUrl: '/uploads/photos/mock_photo.jpg',
    syncStatus: 'SUCCESS',
    lastSyncAt: new Date().toISOString(),
    faceMatchId: `FM${String(faceMatchIntegrations.length + 1).padStart(3, '0')}`
  };
  
  faceMatchIntegrations.push(newIntegration);
  res.json({ success: true, data: newIntegration });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '找不到該路由' });
});

app.listen(port, () => {
  console.log(`🚀 測試伺服器已啟動在 http://localhost:${port}`);
  console.log(`📝 健康檢查: http://localhost:${port}/health`);
});