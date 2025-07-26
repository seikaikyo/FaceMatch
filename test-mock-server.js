const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8090;

// 中介軟體
app.use(cors());
app.use(express.json());

// 模擬承攬商資料
const mockContractors = [
  {
    _id: '1',
    code: 'CT001',
    name: '台積電承攬商',
    businessNumber: '12345678',
    contactPerson: '張三',
    phone: '02-1234-5678',
    email: 'tsmc@contractor.com',
    address: '新竹科學園區',
    status: 'ACTIVE',
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    description: '半導體設備維護',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    code: 'CT002',
    name: '聯發科承攬商',
    businessNumber: '87654321',
    contactPerson: '李四',
    phone: '03-9876-5432',
    email: 'mtk@contractor.com',
    address: '新竹科學園區',
    status: 'ACTIVE',
    contractStartDate: new Date('2024-02-01'),
    contractEndDate: new Date('2025-01-31'),
    description: 'IC設計服務',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

// 模擬工作單資料
const mockWorkOrders = [
  {
    _id: '1',
    orderNumber: 'WO-2024-001',
    title: '設備維護工程',
    description: '生產線設備定期維護',
    contractorId: '1',
    contractorName: '台積電承攬商',
    applicantId: 'user1',
    applicantName: '張工程師',
    status: 'APPROVED',
    priority: 'HIGH',
    startDate: new Date('2024-07-28'),
    endDate: new Date('2024-07-30'),
    location: 'Fab1 二樓',
    workType: '設備維護',
    riskLevel: 'MEDIUM',
    appliedAt: new Date('2024-07-25'),
    finalApprovedBy: 'admin',
    finalApprovedAt: new Date('2024-07-26'),
    currentApprovalLevel: 'APPROVED',
    approvalHistory: [],
    assignments: [],
    schedules: [],
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-07-26')
  }
];

let nextContractorId = 3;
let nextWorkOrderId = 2;

// 承攬商 API
app.get('/api/contractors', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;

  let filteredContractors = [...mockContractors];
  
  if (status) {
    filteredContractors = filteredContractors.filter(c => c.status === status);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredContractors = filteredContractors.filter(c => 
      c.name.toLowerCase().includes(searchLower) || 
      c.code.toLowerCase().includes(searchLower)
    );
  }

  const total = filteredContractors.length;
  const skip = (page - 1) * limit;
  const contractors = filteredContractors.slice(skip, skip + limit);

  res.json({
    success: true,
    message: '獲取承攬商列表成功',
    data: contractors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/contractors/:id', (req, res) => {
  const contractor = mockContractors.find(c => c._id === req.params.id);
  
  if (!contractor) {
    return res.status(404).json({
      success: false,
      message: '承攬商不存在'
    });
  }

  res.json({
    success: true,
    message: '獲取承攬商成功',
    data: contractor
  });
});

app.post('/api/contractors', (req, res) => {
  const now = new Date();
  const newContractor = {
    _id: nextContractorId.toString(),
    code: req.body.code,
    name: req.body.name,
    businessNumber: req.body.businessNumber,
    contactPerson: req.body.contactPerson,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
    status: req.body.status || 'ACTIVE',
    contractStartDate: new Date(req.body.contractStartDate),
    contractEndDate: new Date(req.body.contractEndDate),
    description: req.body.description,
    createdAt: now,
    updatedAt: now
  };

  mockContractors.push(newContractor);
  nextContractorId++;

  res.status(201).json({
    success: true,
    message: '建立承攬商成功',
    data: newContractor
  });
});

app.put('/api/contractors/:id', (req, res) => {
  const contractorIndex = mockContractors.findIndex(c => c._id === req.params.id);
  
  if (contractorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '承攬商不存在'
    });
  }

  const contractor = mockContractors[contractorIndex];
  const updatedContractor = {
    ...contractor,
    ...req.body,
    _id: contractor._id,
    createdAt: contractor.createdAt,
    updatedAt: new Date()
  };

  mockContractors[contractorIndex] = updatedContractor;

  res.json({
    success: true,
    message: '更新承攬商成功',
    data: updatedContractor
  });
});

app.delete('/api/contractors/:id', (req, res) => {
  const contractorIndex = mockContractors.findIndex(c => c._id === req.params.id);

  if (contractorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '承攬商不存在'
    });
  }

  mockContractors.splice(contractorIndex, 1);

  res.json({
    success: true,
    message: '刪除承攬商成功'
  });
});

// 工作單 API
app.get('/api/work-orders', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const contractorId = req.query.contractorId;

  let filteredWorkOrders = [...mockWorkOrders];
  
  if (status) {
    filteredWorkOrders = filteredWorkOrders.filter(w => w.status === status);
  }
  
  if (contractorId) {
    filteredWorkOrders = filteredWorkOrders.filter(w => w.contractorId === contractorId);
  }

  const total = filteredWorkOrders.length;
  const skip = (page - 1) * limit;
  const workOrders = filteredWorkOrders.slice(skip, skip + limit);

  res.json({
    success: true,
    message: '獲取施工單列表成功',
    data: workOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/work-orders/:id', (req, res) => {
  const workOrder = mockWorkOrders.find(w => w._id === req.params.id);
  
  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: '施工單不存在'
    });
  }

  res.json({
    success: true,
    message: '獲取施工單成功',
    data: workOrder
  });
});

app.post('/api/work-orders', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const orderNumber = `WO-${year}-${(nextWorkOrderId).toString().padStart(3, '0')}`;
  
  const newWorkOrder = {
    _id: nextWorkOrderId.toString(),
    orderNumber,
    title: req.body.title,
    description: req.body.description,
    contractorId: req.body.contractorId,
    applicantId: req.body.applicantId || 'user1',
    applicantName: req.body.applicantName || '申請人',
    status: 'DRAFT',
    priority: req.body.priority || 'MEDIUM',
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    location: req.body.location,
    workType: req.body.workType,
    riskLevel: req.body.riskLevel || 'LOW',
    appliedAt: now,
    currentApprovalLevel: 'APPLICANT',
    approvalHistory: [],
    assignments: [],
    schedules: [],
    createdAt: now,
    updatedAt: now
  };

  mockWorkOrders.push(newWorkOrder);
  nextWorkOrderId++;

  res.status(201).json({
    success: true,
    message: '建立施工單成功',
    data: newWorkOrder
  });
});

app.put('/api/work-orders/:id', (req, res) => {
  const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);
  
  if (workOrderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '施工單不存在'
    });
  }

  const workOrder = mockWorkOrders[workOrderIndex];
  
  if (workOrder.status !== 'DRAFT') {
    return res.status(400).json({
      success: false,
      message: '只有草稿狀態的施工單可以修改'
    });
  }

  const updatedWorkOrder = {
    ...workOrder,
    ...req.body,
    _id: workOrder._id,
    orderNumber: workOrder.orderNumber,
    appliedAt: workOrder.appliedAt,
    createdAt: workOrder.createdAt,
    updatedAt: new Date()
  };

  mockWorkOrders[workOrderIndex] = updatedWorkOrder;

  res.json({
    success: true,
    message: '更新施工單成功',
    data: updatedWorkOrder
  });
});

app.delete('/api/work-orders/:id', (req, res) => {
  const workOrderIndex = mockWorkOrders.findIndex(w => w._id === req.params.id);

  if (workOrderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '施工單不存在'
    });
  }

  const workOrder = mockWorkOrders[workOrderIndex];
  
  if (workOrder.status !== 'DRAFT') {
    return res.status(400).json({
      success: false,
      message: '只有草稿狀態的施工單可以刪除'
    });
  }

  mockWorkOrders.splice(workOrderIndex, 1);

  res.json({
    success: true,
    message: '刪除施工單成功'
  });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 FaceMatch 承攬商管理系統 - 模擬資料模式',
    timestamp: new Date(),
    data: {
      contractors: mockContractors.length,
      workOrders: mockWorkOrders.length
    }
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`✅ 測試伺服器已啟動在 http://localhost:${PORT}`);
  console.log(`📊 模擬資料模式 - 承攬商: ${mockContractors.length}, 工作單: ${mockWorkOrders.length}`);
  console.log(`🔗 健康檢查: http://localhost:${PORT}/health`);
  console.log(`📋 承攬商 API: http://localhost:${PORT}/api/contractors`);
  console.log(`📋 工作單 API: http://localhost:${PORT}/api/work-orders`);
});