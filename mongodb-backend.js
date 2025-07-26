const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

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

// MongoDB 連接
mongoose.connect('mongodb://localhost:27017/facematch', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 連接錯誤:'));
db.once('open', () => {
  console.log('✅ MongoDB 連接成功');
});

// MongoDB 模型定義
const ContractorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  contact: String,
  phone: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

const WorkOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  location: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'], default: 'PENDING' },
  submittedBy: String,
  currentApprover: String,
  approvalLevel: { type: Number, default: 1 },
  totalLevels: { type: Number, default: 2 },
  approvedAt: Date,
  approvedBy: String,
  rejectedAt: Date,
  rejectedBy: String,
  returnedAt: Date,
  returnedBy: String
}, { timestamps: true });

const ApprovalHistorySchema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  level: Number,
  approver: String,
  action: { type: String, enum: ['APPROVED', 'REJECTED', 'RETURNED'] },
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

const QualificationSchema = new mongoose.Schema({
  personName: { type: String, required: true },
  type: { type: String, enum: ['SAFETY', 'TECHNICAL'], required: true },
  name: { type: String, required: true },
  validTo: Date,
  status: { type: String, enum: ['VALID', 'EXPIRES_SOON', 'EXPIRED'], default: 'VALID' }
}, { timestamps: true });

const FaceMatchRecordSchema = new mongoose.Schema({
  personName: { type: String, required: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  syncTime: Date
}, { timestamps: true });

// 創建模型
const Contractor = mongoose.model('Contractor', ContractorSchema);
const WorkOrder = mongoose.model('WorkOrder', WorkOrderSchema);
const ApprovalHistory = mongoose.model('ApprovalHistory', ApprovalHistorySchema);
const Qualification = mongoose.model('Qualification', QualificationSchema);
const FaceMatchRecord = mongoose.model('FaceMatchRecord', FaceMatchRecordSchema);

// 初始化測試數據
async function initializeData() {
  try {
    // 檢查是否已有數據
    const contractorCount = await Contractor.countDocuments();
    if (contractorCount > 0) {
      console.log('📊 數據庫已有數據，跳過初始化');
      return;
    }

    console.log('🌱 初始化測試數據...');

    // 創建承攬商
    const contractors = await Contractor.insertMany([
      { name: '台積電承攬商', code: 'TSMC001', contact: '張三', phone: '02-1234-5678', status: 'ACTIVE' },
      { name: '聯發科承攬商', code: 'MTK002', contact: '李四', phone: '02-2345-6789', status: 'ACTIVE' },
      { name: '富士康承攬商', code: 'FOX003', contact: '王五', phone: '02-3456-7890', status: 'INACTIVE' }
    ]);

    // 創建施工單
    const workOrders = await WorkOrder.insertMany([
      {
        orderNumber: 'WO001',
        title: '設備維護',
        contractorId: contractors[0]._id,
        location: '廠區A',
        status: 'PENDING',
        submittedBy: '張承攬商',
        currentApprover: '職環安',
        approvalLevel: 1,
        totalLevels: 2
      },
      {
        orderNumber: 'WO002',
        title: '清潔作業',
        contractorId: contractors[1]._id,
        location: '廠區B',
        status: 'APPROVED',
        submittedBy: '王承攬商',
        currentApprover: null,
        approvalLevel: 2,
        totalLevels: 2,
        approvedAt: new Date('2025-07-19T14:20:00Z'),
        approvedBy: '再生經理'
      }
    ]);

    // 創建簽核歷史
    await ApprovalHistory.insertMany([
      {
        workOrderId: workOrders[1]._id,
        level: 1,
        approver: '職環安',
        action: 'APPROVED',
        comment: '初步審核通過',
        timestamp: new Date('2025-07-18T16:00:00Z')
      },
      {
        workOrderId: workOrders[1]._id,
        level: 2,
        approver: '再生經理',
        action: 'APPROVED',
        comment: '最終核准',
        timestamp: new Date('2025-07-19T14:20:00Z')
      }
    ]);

    // 創建資格記錄
    await Qualification.insertMany([
      { personName: '張工程師', type: 'SAFETY', name: '安全教育訓練', validTo: new Date('2025-12-31'), status: 'VALID' },
      { personName: '李技師', type: 'TECHNICAL', name: '電機技師', validTo: new Date('2025-06-30'), status: 'VALID' },
      { personName: '陳主任', type: 'SAFETY', name: '危險物品處理', validTo: new Date('2025-02-28'), status: 'EXPIRES_SOON' }
    ]);

    // 創建 FaceMatch 記錄
    await FaceMatchRecord.insertMany([
      { personName: '張工程師', workOrderId: workOrders[0]._id, status: 'SUCCESS', syncTime: new Date() },
      { personName: '李技師', workOrderId: workOrders[1]._id, status: 'PENDING', syncTime: null }
    ]);

    console.log('✅ 測試數據初始化完成');
  } catch (error) {
    console.error('❌ 數據初始化失敗:', error);
  }
}

// 簽核者層級設定（根據截圖更新）
function getNextApprover(level) {
  const approvers = {
    1: '職環安',
    2: '再生經理',
    3: '總經理'
  };
  return approvers[level] || null;
}

// 登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'mongo-token', user: { name: '管理員', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: '登入失敗' });
  }
});

// 承攬商 CRUD
app.get('/api/contractors', async (req, res) => {
  try {
    const contractors = await Contractor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contractors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/contractors', async (req, res) => {
  try {
    const contractor = new Contractor(req.body);
    await contractor.save();
    res.json({ success: true, data: contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/contractors/:id', async (req, res) => {
  try {
    const contractor = await Contractor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contractor) {
      return res.status(404).json({ success: false, message: '承攬商不存在' });
    }
    res.json({ success: true, data: contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/contractors/:id', async (req, res) => {
  try {
    await Contractor.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 施工單 CRUD
app.get('/api/work-orders', async (req, res) => {
  try {
    const workOrders = await WorkOrder.find().populate('contractorId', 'name').sort({ createdAt: -1 });
    const ordersWithContractor = workOrders.map(order => ({
      ...order.toObject(),
      id: order._id,
      contractorName: order.contractorId?.name || '未知'
    }));
    res.json({ success: true, data: ordersWithContractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/work-orders', async (req, res) => {
  try {
    const workOrder = new WorkOrder({
      ...req.body,
      status: 'PENDING',
      submittedBy: req.body.submittedBy || '系統管理員',
      currentApprover: '職環安',
      approvalLevel: 1,
      totalLevels: 2
    });
    await workOrder.save();
    await workOrder.populate('contractorId', 'name');
    
    const response = {
      ...workOrder.toObject(),
      id: workOrder._id,
      contractorName: workOrder.contractorId?.name || '未知'
    };
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/work-orders/:id', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }
    res.json({ success: true, data: { ...workOrder.toObject(), id: workOrder._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    await WorkOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 施工單簽核 API
app.post('/api/work-orders/:id/approve', async (req, res) => {
  try {
    const { action, comment, approver } = req.body;
    
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    // 記錄簽核歷史
    const historyRecord = new ApprovalHistory({
      workOrderId: workOrder._id,
      level: workOrder.approvalLevel,
      approver: approver || '管理員',
      action,
      comment: comment || '',
      timestamp: new Date()
    });
    await historyRecord.save();

    // 更新施工單狀態
    if (action === 'APPROVED') {
      if (workOrder.approvalLevel >= workOrder.totalLevels) {
        // 最終核准
        workOrder.status = 'APPROVED';
        workOrder.approvedAt = new Date();
        workOrder.approvedBy = approver || '管理員';
        workOrder.currentApprover = null;
      } else {
        // 進入下一層審核
        workOrder.approvalLevel++;
        workOrder.currentApprover = getNextApprover(workOrder.approvalLevel);
      }
    } else if (action === 'REJECTED') {
      workOrder.status = 'REJECTED';
      workOrder.rejectedAt = new Date();
      workOrder.rejectedBy = approver || '管理員';
      workOrder.currentApprover = null;
    } else if (action === 'RETURNED') {
      workOrder.status = 'RETURNED';
      workOrder.returnedAt = new Date();
      workOrder.returnedBy = approver || '管理員';
      workOrder.currentApprover = null;
    }

    await workOrder.save();
    
    res.json({ 
      success: true, 
      data: { ...workOrder.toObject(), id: workOrder._id },
      history: { ...historyRecord.toObject(), id: historyRecord._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取簽核歷史
app.get('/api/work-orders/:id/history', async (req, res) => {
  try {
    const history = await ApprovalHistory.find({ workOrderId: req.params.id }).sort({ timestamp: 1 });
    const historyWithId = history.map(h => ({ ...h.toObject(), id: h._id }));
    res.json({ success: true, data: historyWithId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取待簽核清單
app.get('/api/work-orders/pending-approval', async (req, res) => {
  try {
    const pendingOrders = await WorkOrder.find({ 
      status: 'PENDING',
      currentApprover: { $ne: null }
    }).populate('contractorId', 'name').sort({ createdAt: -1 });
    
    const ordersWithContractor = pendingOrders.map(order => ({
      ...order.toObject(),
      id: order._id,
      contractorName: order.contractorId?.name || '未知'
    }));
    
    res.json({ success: true, data: ordersWithContractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 年度資格 CRUD
app.get('/api/qualifications', async (req, res) => {
  try {
    const qualifications = await Qualification.find().sort({ createdAt: -1 });
    const qualificationsWithId = qualifications.map(q => ({ ...q.toObject(), id: q._id }));
    res.json({ success: true, data: qualificationsWithId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/qualifications', async (req, res) => {
  try {
    const qualification = new Qualification(req.body);
    await qualification.save();
    res.json({ success: true, data: { ...qualification.toObject(), id: qualification._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/qualifications/:id', async (req, res) => {
  try {
    const qualification = await Qualification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!qualification) {
      return res.status(404).json({ success: false, message: '資格不存在' });
    }
    res.json({ success: true, data: { ...qualification.toObject(), id: qualification._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/qualifications/:id', async (req, res) => {
  try {
    await Qualification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// FaceMatch 整合 CRUD
app.get('/api/facematch', async (req, res) => {
  try {
    const records = await FaceMatchRecord.find().populate('workOrderId', 'orderNumber').sort({ createdAt: -1 });
    const recordsWithId = records.map(r => ({ ...r.toObject(), id: r._id }));
    res.json({ success: true, data: recordsWithId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/facematch', async (req, res) => {
  try {
    const record = new FaceMatchRecord({ ...req.body, syncTime: new Date() });
    await record.save();
    res.json({ success: true, data: { ...record.toObject(), id: record._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/facematch/:id', async (req, res) => {
  try {
    const record = await FaceMatchRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) {
      return res.status(404).json({ success: false, message: '記錄不存在' });
    }
    res.json({ success: true, data: { ...record.toObject(), id: record._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/facematch/:id', async (req, res) => {
  try {
    await FaceMatchRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 啟動服務器
app.listen(port, async () => {
  console.log(`🚀 MongoDB 版本後端服務啟動在 http://localhost:${port}`);
  console.log('📊 使用 MongoDB 數據庫');
  console.log('👥 簽核者: 職環安 → 再生經理');
  
  // 等待 MongoDB 連接後初始化數據
  if (mongoose.connection.readyState === 1) {
    await initializeData();
  } else {
    mongoose.connection.once('open', initializeData);
  }
});