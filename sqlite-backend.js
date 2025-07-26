const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

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

// SQLite 連接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './facematch.sqlite',
  logging: false // 關閉 SQL 日誌輸出
});

// 模型定義
const Contractor = sequelize.define('Contractor', {
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  contact: DataTypes.STRING,
  phone: DataTypes.STRING,
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
});

const WorkOrder = sequelize.define('WorkOrder', {
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  contractorId: { type: DataTypes.INTEGER, allowNull: false },
  location: DataTypes.STRING,
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'RETURNED'), defaultValue: 'PENDING' },
  submittedBy: DataTypes.STRING,
  currentApprover: DataTypes.STRING,
  approvalLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
  totalLevels: { type: DataTypes.INTEGER, defaultValue: 2 },
  approvedAt: DataTypes.DATE,
  approvedBy: DataTypes.STRING,
  rejectedAt: DataTypes.DATE,
  rejectedBy: DataTypes.STRING,
  returnedAt: DataTypes.DATE,
  returnedBy: DataTypes.STRING
});

const ApprovalHistory = sequelize.define('ApprovalHistory', {
  workOrderId: { type: DataTypes.INTEGER, allowNull: false },
  level: DataTypes.INTEGER,
  approver: DataTypes.STRING,
  action: { type: DataTypes.ENUM('APPROVED', 'REJECTED', 'RETURNED') },
  comment: DataTypes.TEXT,
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Qualification = sequelize.define('Qualification', {
  personName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('SAFETY', 'TECHNICAL'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  validTo: DataTypes.DATE,
  status: { type: DataTypes.ENUM('VALID', 'EXPIRES_SOON', 'EXPIRED'), defaultValue: 'VALID' }
});

const FaceMatchRecord = sequelize.define('FaceMatchRecord', {
  personName: { type: DataTypes.STRING, allowNull: false },
  workOrderId: DataTypes.INTEGER,
  status: { type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'), defaultValue: 'PENDING' },
  syncTime: DataTypes.DATE
});

// 關聯定義
WorkOrder.belongsTo(Contractor, { foreignKey: 'contractorId' });
ApprovalHistory.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });
FaceMatchRecord.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });

// 簽核者層級設定（根據截圖更新）
function getNextApprover(level) {
  const approvers = {
    1: '職環安',
    2: '再生經理',
    3: '總經理'
  };
  return approvers[level] || null;
}

// 初始化數據庫和測試數據
async function initializeDatabase() {
  try {
    // 同步數據庫結構
    await sequelize.sync({ force: false });
    console.log('✅ SQLite 數據庫連接成功');

    // 檢查是否已有數據
    const contractorCount = await Contractor.count();
    if (contractorCount > 0) {
      console.log('📊 數據庫已有數據，跳過初始化');
      return;
    }

    console.log('🌱 初始化測試數據...');

    // 創建承攬商
    const contractors = await Contractor.bulkCreate([
      { name: '台積電承攬商', code: 'TSMC001', contact: '張三', phone: '02-1234-5678', status: 'ACTIVE' },
      { name: '聯發科承攬商', code: 'MTK002', contact: '李四', phone: '02-2345-6789', status: 'ACTIVE' },
      { name: '富士康承攬商', code: 'FOX003', contact: '王五', phone: '02-3456-7890', status: 'INACTIVE' }
    ]);

    // 創建施工單
    const workOrders = await WorkOrder.bulkCreate([
      {
        orderNumber: 'WO001',
        title: '設備維護',
        contractorId: contractors[0].id,
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
        contractorId: contractors[1].id,
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
    await ApprovalHistory.bulkCreate([
      {
        workOrderId: workOrders[1].id,
        level: 1,
        approver: '職環安',
        action: 'APPROVED',
        comment: '初步審核通過',
        timestamp: new Date('2025-07-18T16:00:00Z')
      },
      {
        workOrderId: workOrders[1].id,
        level: 2,
        approver: '再生經理',
        action: 'APPROVED',
        comment: '最終核准',
        timestamp: new Date('2025-07-19T14:20:00Z')
      }
    ]);

    // 創建資格記錄
    await Qualification.bulkCreate([
      { personName: '張工程師', type: 'SAFETY', name: '安全教育訓練', validTo: new Date('2025-12-31'), status: 'VALID' },
      { personName: '李技師', type: 'TECHNICAL', name: '電機技師', validTo: new Date('2025-06-30'), status: 'VALID' },
      { personName: '陳主任', type: 'SAFETY', name: '危險物品處理', validTo: new Date('2025-02-28'), status: 'EXPIRES_SOON' }
    ]);

    // 創建 FaceMatch 記錄
    await FaceMatchRecord.bulkCreate([
      { personName: '張工程師', workOrderId: workOrders[0].id, status: 'SUCCESS', syncTime: new Date() },
      { personName: '李技師', workOrderId: workOrders[1].id, status: 'PENDING', syncTime: null }
    ]);

    console.log('✅ 測試數據初始化完成');
  } catch (error) {
    console.error('❌ 數據庫初始化失敗:', error);
  }
}

// 登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'sqlite-token', user: { name: '管理員', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: '登入失敗' });
  }
});

// 承攬商 CRUD
app.get('/api/contractors', async (req, res) => {
  try {
    const contractors = await Contractor.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: contractors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/contractors', async (req, res) => {
  try {
    const contractor = await Contractor.create(req.body);
    res.json({ success: true, data: contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/contractors/:id', async (req, res) => {
  try {
    const contractor = await Contractor.findByPk(req.params.id);
    if (!contractor) {
      return res.status(404).json({ success: false, message: '承攬商不存在' });
    }
    await contractor.update(req.body);
    res.json({ success: true, data: contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/contractors/:id', async (req, res) => {
  try {
    await Contractor.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 施工單 CRUD
app.get('/api/work-orders', async (req, res) => {
  try {
    const workOrders = await WorkOrder.findAll({ 
      include: [{ model: Contractor, attributes: ['name'] }],
      order: [['createdAt', 'DESC']] 
    });
    const ordersWithContractor = workOrders.map(order => ({
      ...order.toJSON(),
      contractorName: order.Contractor?.name || '未知'
    }));
    res.json({ success: true, data: ordersWithContractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/work-orders', async (req, res) => {
  try {
    const workOrder = await WorkOrder.create({
      ...req.body,
      status: 'PENDING',
      submittedBy: req.body.submittedBy || '系統管理員',
      currentApprover: '職環安',
      approvalLevel: 1,
      totalLevels: 2
    });
    
    const workOrderWithContractor = await WorkOrder.findByPk(workOrder.id, {
      include: [{ model: Contractor, attributes: ['name'] }]
    });
    
    const response = {
      ...workOrderWithContractor.toJSON(),
      contractorName: workOrderWithContractor.Contractor?.name || '未知'
    };
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/work-orders/:id', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }
    await workOrder.update(req.body);
    res.json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    await WorkOrder.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 施工單簽核 API
app.post('/api/work-orders/:id/approve', async (req, res) => {
  try {
    const { action, comment, approver } = req.body;
    
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    // 記錄簽核歷史
    const historyRecord = await ApprovalHistory.create({
      workOrderId: workOrder.id,
      level: workOrder.approvalLevel,
      approver: approver || '管理員',
      action,
      comment: comment || '',
      timestamp: new Date()
    });

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
      data: workOrder,
      history: historyRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取簽核歷史
app.get('/api/work-orders/:id/history', async (req, res) => {
  try {
    const history = await ApprovalHistory.findAll({ 
      where: { workOrderId: req.params.id },
      order: [['timestamp', 'ASC']]
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取待簽核清單
app.get('/api/work-orders/pending-approval', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const pendingOrders = await WorkOrder.findAll({ 
      where: { 
        status: 'PENDING',
        currentApprover: { [Op.ne]: null }
      },
      include: [{ model: Contractor, attributes: ['name'] }],
      order: [['createdAt', 'DESC']] 
    });
    
    const ordersWithContractor = pendingOrders.map(order => ({
      ...order.toJSON(),
      contractorName: order.Contractor?.name || '未知'
    }));
    
    res.json({ success: true, data: ordersWithContractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 年度資格 CRUD
app.get('/api/qualifications', async (req, res) => {
  try {
    const qualifications = await Qualification.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: qualifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/qualifications', async (req, res) => {
  try {
    const qualification = await Qualification.create(req.body);
    res.json({ success: true, data: qualification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/qualifications/:id', async (req, res) => {
  try {
    const qualification = await Qualification.findByPk(req.params.id);
    if (!qualification) {
      return res.status(404).json({ success: false, message: '資格不存在' });
    }
    await qualification.update(req.body);
    res.json({ success: true, data: qualification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/qualifications/:id', async (req, res) => {
  try {
    await Qualification.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// FaceMatch 整合 CRUD
app.get('/api/facematch', async (req, res) => {
  try {
    const records = await FaceMatchRecord.findAll({ 
      include: [{ model: WorkOrder, attributes: ['orderNumber'] }],
      order: [['createdAt', 'DESC']] 
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/facematch', async (req, res) => {
  try {
    const record = await FaceMatchRecord.create({ ...req.body, syncTime: new Date() });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/facematch/:id', async (req, res) => {
  try {
    const record = await FaceMatchRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: '記錄不存在' });
    }
    await record.update(req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/facematch/:id', async (req, res) => {
  try {
    await FaceMatchRecord.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'SQLite Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      timestamp: new Date().toISOString(),
      database: 'SQLite Disconnected',
      error: error.message
    });
  }
});

// 啟動服務器
app.listen(port, async () => {
  console.log(`🚀 SQLite 版本後端服務啟動在 http://localhost:${port}`);
  console.log('📊 使用 SQLite 數據庫');
  console.log('👥 簽核者: 職環安 → 再生經理');
  
  await initializeDatabase();
});