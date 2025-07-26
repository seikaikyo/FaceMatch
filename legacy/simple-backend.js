const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5001;

// 中間件
app.use(cors({
  origin: ['http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 模擬資料庫
let contractors = [
  { id: 1, name: '台積電承攬商', code: 'TSMC001', contact: '張三', phone: '02-1234-5678', status: 'ACTIVE' },
  { id: 2, name: '聯發科承攬商', code: 'MTK002', contact: '李四', phone: '02-2345-6789', status: 'ACTIVE' },
  { id: 3, name: '富士康承攬商', code: 'FOX003', contact: '王五', phone: '02-3456-7890', status: 'INACTIVE' }
];

let workOrders = [
  { 
    id: 1, 
    orderNumber: 'WO001', 
    title: '設備維護', 
    contractorId: 1, 
    location: '廠區A', 
    status: 'PENDING',
    createdAt: '2025-07-20T08:00:00Z',
    submittedBy: '張承攬商',
    currentApprover: '李主管',
    approvalLevel: 1,
    totalLevels: 2
  },
  { 
    id: 2, 
    orderNumber: 'WO002', 
    title: '清潔作業', 
    contractorId: 2, 
    location: '廠區B', 
    status: 'APPROVED',
    createdAt: '2025-07-18T10:30:00Z',
    submittedBy: '王承攬商',
    currentApprover: null,
    approvalLevel: 2,
    totalLevels: 2,
    approvedAt: '2025-07-19T14:20:00Z',
    approvedBy: '陳經理'
  }
];

// 簽核歷史記錄
let approvalHistory = [
  {
    id: 1,
    workOrderId: 2,
    level: 1,
    approver: '李主管',
    action: 'APPROVED',
    comment: '初步審核通過',
    timestamp: '2025-07-18T16:00:00Z'
  },
  {
    id: 2,
    workOrderId: 2,
    level: 2,
    approver: '陳經理',
    action: 'APPROVED',
    comment: '最終核准',
    timestamp: '2025-07-19T14:20:00Z'
  }
];

let qualifications = [
  { id: 1, personName: '張工程師', type: 'SAFETY', name: '安全教育訓練', validTo: '2025-12-31', status: 'VALID' },
  { id: 2, personName: '李技師', type: 'TECHNICAL', name: '電機技師', validTo: '2025-06-30', status: 'VALID' },
  { id: 3, personName: '陳主任', type: 'SAFETY', name: '危險物品處理', validTo: '2025-02-28', status: 'EXPIRES_SOON' }
];

let faceMatchRecords = [
  { id: 1, personName: '張工程師', workOrderId: 1, status: 'SUCCESS', syncTime: new Date().toISOString() },
  { id: 2, personName: '李技師', workOrderId: 2, status: 'PENDING', syncTime: null }
];

// 登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'simple-token', user: { name: '管理員', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: '登入失敗' });
  }
});

// 承攬商 CRUD
app.get('/api/contractors', (req, res) => {
  res.json({ success: true, data: contractors });
});

app.post('/api/contractors', (req, res) => {
  const newContractor = { id: Date.now(), ...req.body };
  contractors.push(newContractor);
  res.json({ success: true, data: newContractor });
});

app.put('/api/contractors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = contractors.findIndex(c => c.id === id);
  if (index !== -1) {
    contractors[index] = { ...contractors[index], ...req.body };
    res.json({ success: true, data: contractors[index] });
  } else {
    res.status(404).json({ success: false, message: '承攬商不存在' });
  }
});

app.delete('/api/contractors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  contractors = contractors.filter(c => c.id !== id);
  res.json({ success: true });
});

// 施工單 CRUD
app.get('/api/work-orders', (req, res) => {
  const ordersWithContractor = workOrders.map(order => ({
    ...order,
    contractorName: contractors.find(c => c.id === order.contractorId)?.name || '未知'
  }));
  res.json({ success: true, data: ordersWithContractor });
});

app.post('/api/work-orders', (req, res) => {
  const newOrder = { 
    id: Date.now(), 
    ...req.body,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    submittedBy: req.body.submittedBy || '系統管理員',
    currentApprover: '李主管',
    approvalLevel: 1,
    totalLevels: 2
  };
  workOrders.push(newOrder);
  res.json({ success: true, data: newOrder });
});

app.put('/api/work-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = workOrders.findIndex(w => w.id === id);
  if (index !== -1) {
    workOrders[index] = { ...workOrders[index], ...req.body };
    res.json({ success: true, data: workOrders[index] });
  } else {
    res.status(404).json({ success: false, message: '施工單不存在' });
  }
});

app.delete('/api/work-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  workOrders = workOrders.filter(w => w.id !== id);
  res.json({ success: true });
});

// 施工單簽核 API
app.post('/api/work-orders/:id/approve', (req, res) => {
  const id = parseInt(req.params.id);
  const { action, comment, approver } = req.body; // action: 'APPROVED' | 'REJECTED' | 'RETURNED'
  
  const workOrder = workOrders.find(w => w.id === id);
  if (!workOrder) {
    return res.status(404).json({ success: false, message: '施工單不存在' });
  }

  // 記錄簽核歷史
  const historyRecord = {
    id: Date.now(),
    workOrderId: id,
    level: workOrder.approvalLevel,
    approver: approver || '管理員',
    action,
    comment: comment || '',
    timestamp: new Date().toISOString()
  };
  approvalHistory.push(historyRecord);

  // 更新施工單狀態
  if (action === 'APPROVED') {
    if (workOrder.approvalLevel >= workOrder.totalLevels) {
      // 最終核准
      workOrder.status = 'APPROVED';
      workOrder.approvedAt = new Date().toISOString();
      workOrder.approvedBy = approver || '管理員';
      workOrder.currentApprover = null;
    } else {
      // 進入下一層審核
      workOrder.approvalLevel++;
      workOrder.currentApprover = getNextApprover(workOrder.approvalLevel);
    }
  } else if (action === 'REJECTED') {
    workOrder.status = 'REJECTED';
    workOrder.rejectedAt = new Date().toISOString();
    workOrder.rejectedBy = approver || '管理員';
    workOrder.currentApprover = null;
  } else if (action === 'RETURNED') {
    workOrder.status = 'RETURNED';
    workOrder.returnedAt = new Date().toISOString();
    workOrder.returnedBy = approver || '管理員';
    workOrder.currentApprover = null;
  }

  res.json({ success: true, data: workOrder, history: historyRecord });
});

// 獲取簽核歷史
app.get('/api/work-orders/:id/history', (req, res) => {
  const id = parseInt(req.params.id);
  const history = approvalHistory.filter(h => h.workOrderId === id);
  res.json({ success: true, data: history });
});

// 獲取待簽核清單
app.get('/api/work-orders/pending-approval', (req, res) => {
  const pendingOrders = workOrders.filter(order => 
    order.status === 'PENDING' && order.currentApprover
  ).map(order => ({
    ...order,
    contractorName: contractors.find(c => c.id === order.contractorId)?.name || '未知'
  }));
  res.json({ success: true, data: pendingOrders });
});

// 輔助函數：獲取下一層簽核者
function getNextApprover(level) {
  const approvers = {
    1: '李主管',
    2: '陳經理',
    3: '總經理'
  };
  return approvers[level] || null;
}

// 年度資格 CRUD
app.get('/api/qualifications', (req, res) => {
  res.json({ success: true, data: qualifications });
});

app.post('/api/qualifications', (req, res) => {
  const newQualification = { id: Date.now(), ...req.body };
  qualifications.push(newQualification);
  res.json({ success: true, data: newQualification });
});

app.put('/api/qualifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = qualifications.findIndex(q => q.id === id);
  if (index !== -1) {
    qualifications[index] = { ...qualifications[index], ...req.body };
    res.json({ success: true, data: qualifications[index] });
  } else {
    res.status(404).json({ success: false, message: '資格不存在' });
  }
});

app.delete('/api/qualifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  qualifications = qualifications.filter(q => q.id !== id);
  res.json({ success: true });
});

// FaceMatch 整合 CRUD
app.get('/api/facematch', (req, res) => {
  res.json({ success: true, data: faceMatchRecords });
});

app.post('/api/facematch', (req, res) => {
  const newRecord = { id: Date.now(), ...req.body, syncTime: new Date().toISOString() };
  faceMatchRecords.push(newRecord);
  res.json({ success: true, data: newRecord });
});

app.put('/api/facematch/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = faceMatchRecords.findIndex(f => f.id === id);
  if (index !== -1) {
    faceMatchRecords[index] = { ...faceMatchRecords[index], ...req.body };
    res.json({ success: true, data: faceMatchRecords[index] });
  } else {
    res.status(404).json({ success: false, message: '記錄不存在' });
  }
});

app.delete('/api/facematch/:id', (req, res) => {
  const id = parseInt(req.params.id);
  faceMatchRecords = faceMatchRecords.filter(f => f.id !== id);
  res.json({ success: true });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 極簡後端服務啟動在 http://localhost:${port}`);
});