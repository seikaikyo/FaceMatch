const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const { Client } = require('ldapts');
const bcrypt = require('bcrypt');

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

// AD 配置 (可以通過環境變數配置)
const AD_CONFIG = {
  enabled: process.env.AD_ENABLED === 'true' || false,
  url: process.env.AD_URL || 'ldap://your-domain.com:389',
  baseDN: process.env.AD_BASE_DN || 'DC=your-domain,DC=com',
  domain: process.env.AD_DOMAIN || 'your-domain.com'
};

// SQLite 連接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './facematch.sqlite',
  logging: false
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
  returnedBy: DataTypes.STRING,
  // 新增狀態變更相關欄位
  statusChangeRequested: DataTypes.STRING, // 請求的新狀態
  statusChangeReason: DataTypes.TEXT, // 狀態變更原因
  statusChangeRequestedBy: DataTypes.STRING, // 請求者
  statusChangeRequestedAt: DataTypes.DATE // 請求時間
});

const ApprovalHistory = sequelize.define('ApprovalHistory', {
  workOrderId: { type: DataTypes.INTEGER, allowNull: false },
  level: DataTypes.INTEGER,
  approver: DataTypes.STRING,
  action: { type: DataTypes.ENUM('APPROVED', 'REJECTED', 'RETURNED') },
  comment: DataTypes.TEXT,
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  // 新增欄位來區分是工作流程簽核還是狀態變更簽核
  type: { type: DataTypes.ENUM('WORKFLOW', 'STATUS_CHANGE'), defaultValue: 'WORKFLOW' },
  oldStatus: DataTypes.STRING,
  newStatus: DataTypes.STRING
});

const Qualification = sequelize.define('Qualification', {
  personName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('SAFETY', 'TECHNICAL'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  validTo: DataTypes.DATE,
  status: { type: DataTypes.ENUM('VALID', 'EXPIRES_SOON', 'EXPIRED', 'SUSPENDED'), defaultValue: 'VALID' },
  lastRenewedAt: DataTypes.DATE,
  lastRenewedBy: DataTypes.STRING,
  suspendedAt: DataTypes.DATE,
  suspendedBy: DataTypes.STRING,
  suspendReason: DataTypes.TEXT,
  renewalNotes: DataTypes.TEXT
});

const FaceMatchRecord = sequelize.define('FaceMatchRecord', {
  personName: { type: DataTypes.STRING, allowNull: false },
  workOrderId: DataTypes.INTEGER,
  status: { type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'), defaultValue: 'PENDING' },
  syncTime: DataTypes.DATE
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  displayName: DataTypes.STRING,
  email: DataTypes.STRING,
  department: DataTypes.STRING,
  role: { type: DataTypes.ENUM('管理員', '職環安', '再生經理', '一般使用者'), defaultValue: '一般使用者' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: DataTypes.DATE,
  authType: { type: DataTypes.ENUM('LOCAL', 'AD'), defaultValue: 'LOCAL' },
  // 新增欄位
  jobTitle: DataTypes.STRING, // 職稱
  phoneNumber: DataTypes.STRING, // 電話
  employeeId: DataTypes.STRING, // 員工編號
  approvalLevel: DataTypes.INTEGER, // 可簽核的層級 (1=職環安, 2=再生經理, 3=總經理)
  canApprove: { type: DataTypes.BOOLEAN, defaultValue: false }, // 是否有簽核權限
  // 本地帳號密碼 (僅限 LOCAL 類型)
  passwordHash: DataTypes.STRING,
  // AD 相關
  adGroups: DataTypes.TEXT, // AD 群組 (JSON 格式)
  lastADSync: DataTypes.DATE, // 最後 AD 同步時間
  // 備註
  notes: DataTypes.TEXT
});

// 關聯定義
WorkOrder.belongsTo(Contractor, { foreignKey: 'contractorId' });
ApprovalHistory.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });
FaceMatchRecord.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });

// AD 驗證函數
async function authenticateAD(username, password) {
  if (!AD_CONFIG.enabled) {
    return null;
  }

  const client = new Client({
    url: AD_CONFIG.url,
  });

  try {
    const userDN = `${username}@${AD_CONFIG.domain}`;
    await client.bind(userDN, password);
    
    // 搜尋使用者資訊
    const searchResult = await client.search(AD_CONFIG.baseDN, {
      scope: 'sub',
      filter: `(sAMAccountName=${username})`,
      attributes: ['displayName', 'mail', 'department', 'memberOf']
    });

    const user = searchResult.searchEntries[0];
    if (user) {
      // 根據 AD 群組確定角色
      const memberOf = user.memberOf || [];
      let role = '一般使用者';
      
      if (memberOf.some(group => group.includes('管理員') || group.includes('Admin'))) {
        role = '管理員';
      } else if (memberOf.some(group => group.includes('職環安') || group.includes('Safety'))) {
        role = '職環安';
      } else if (memberOf.some(group => group.includes('再生經理') || group.includes('Manager'))) {
        role = '再生經理';
      }

      return {
        username,
        displayName: user.displayName,
        email: user.mail,
        department: user.department,
        role,
        authType: 'AD'
      };
    }
  } catch (error) {
    console.error('AD 驗證失敗:', error.message);
    return null;
  } finally {
    await client.unbind();
  }

  return null;
}

// 簽核者層級設定
function getNextApprover(level) {
  const approvers = {
    1: '職環安',
    2: '再生經理',
    3: '總經理'
  };
  return approvers[level] || null;
}

// 檢查使用者是否有簽核權限
function canUserApprove(userRole, requiredApprover) {
  if (userRole === '管理員') return true;
  return userRole === requiredApprover;
}

// 初始化數據庫和測試數據
async function initializeDatabase() {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ SQLite 數據庫連接成功');

    // 檢查是否已有數據
    const contractorCount = await Contractor.count();
    if (contractorCount > 0) {
      console.log('📊 數據庫已有數據，跳過初始化');
      return;
    }

    console.log('🌱 初始化測試數據...');

    // 創建測試使用者 (包含密碼雜湊)
    const saltRounds = 10;
    await User.bulkCreate([
      { 
        username: 'admin', 
        displayName: '系統管理員', 
        email: 'admin@company.com',
        department: 'IT部門',
        jobTitle: '系統管理員',
        employeeId: 'EMP001',
        role: '管理員', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 999, // 管理員可以簽核所有層級
        passwordHash: await bcrypt.hash('admin123', saltRounds),
        phoneNumber: '02-1234-5678'
      },
      { 
        username: 'safety', 
        displayName: '職環安專員', 
        email: 'safety@company.com',
        department: '職業安全衛生室',
        jobTitle: '職環安專員',
        employeeId: 'EMP002',
        role: '職環安', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 1, // 第一層簽核
        passwordHash: await bcrypt.hash('safety123', saltRounds),
        phoneNumber: '02-1234-5679'
      },
      { 
        username: 'manager', 
        displayName: '再生經理', 
        email: 'manager@company.com',
        department: '再生事業部',
        jobTitle: '部門經理',
        employeeId: 'EMP003',
        role: '再生經理', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 2, // 第二層簽核
        passwordHash: await bcrypt.hash('manager123', saltRounds),
        phoneNumber: '02-1234-5680'
      },
      {
        username: 'user001',
        displayName: '一般使用者',
        email: 'user001@company.com',
        department: '營運部門',
        jobTitle: '業務專員',
        employeeId: 'EMP004',
        role: '一般使用者',
        authType: 'LOCAL',
        canApprove: false,
        passwordHash: await bcrypt.hash('user123', saltRounds),
        phoneNumber: '02-1234-5681'
      }
    ]);

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
      },
      {
        orderNumber: 'WO003',
        title: '系統升級',
        contractorId: contractors[0].id,
        location: '機房',
        status: 'PENDING',
        submittedBy: '系統管理員',
        currentApprover: '職環安',
        approvalLevel: 1,
        totalLevels: 2,
        // 模擬狀態變更請求
        statusChangeRequested: 'APPROVED',
        statusChangeReason: '緊急維護需求',
        statusChangeRequestedBy: '維護部門',
        statusChangeRequestedAt: new Date()
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
        timestamp: new Date('2025-07-18T16:00:00Z'),
        type: 'WORKFLOW'
      },
      {
        workOrderId: workOrders[1].id,
        level: 2,
        approver: '再生經理',
        action: 'APPROVED',
        comment: '最終核准',
        timestamp: new Date('2025-07-19T14:20:00Z'),
        type: 'WORKFLOW'
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

// 登入 API (支援 AD 和本地驗證)
app.post('/api/login', async (req, res) => {
  const { username, password, useAD } = req.body;
  
  try {
    let userInfo = null;

    // AD 驗證
    if (useAD && AD_CONFIG.enabled) {
      userInfo = await authenticateAD(username, password);
      if (userInfo) {
        // 更新或創建用戶記錄
        const [user] = await User.findOrCreate({
          where: { username: userInfo.username },
          defaults: userInfo
        });
        await user.update({ lastLogin: new Date() });
      }
    } else {
      // 本地驗證 (使用資料庫)
      const user = await User.findOne({ where: { username, authType: 'LOCAL', isActive: true } });
      if (user && user.passwordHash) {
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (isValidPassword) {
          userInfo = {
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            authType: user.authType,
            email: user.email,
            department: user.department,
            canApprove: user.canApprove,
            approvalLevel: user.approvalLevel
          };
          // 更新最後登入時間
          await user.update({ lastLogin: new Date() });
        }
      }
    }

    if (userInfo) {
      res.json({
        success: true,
        token: `token-${userInfo.username}-${Date.now()}`,
        user: userInfo
      });
    } else {
      res.status(401).json({ success: false, message: '登入失敗：帳號或密碼錯誤' });
    }
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ success: false, message: '登入系統錯誤' });
  }
});

// 獲取 AD 設定
app.get('/api/ad-config', (req, res) => {
  res.json({
    enabled: AD_CONFIG.enabled,
    domain: AD_CONFIG.domain
  });
});

// 承攬商 CRUD (保持原有邏輯)
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

// 施工單 CRUD (增強版本)
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

// 狀態變更請求 API
app.post('/api/work-orders/:id/request-status-change', async (req, res) => {
  try {
    const { newStatus, reason, requestedBy } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    // 更新狀態變更請求
    await workOrder.update({
      statusChangeRequested: newStatus,
      statusChangeReason: reason,
      statusChangeRequestedBy: requestedBy,
      statusChangeRequestedAt: new Date()
    });

    res.json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 快速簽核 API
app.post('/api/work-orders/:id/quick-approve', async (req, res) => {
  try {
    const { action, approver } = req.body; // action: 'APPROVE' | 'REJECT'
    const workOrder = await WorkOrder.findByPk(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    // 記錄快速簽核歷史
    const historyRecord = await ApprovalHistory.create({
      workOrderId: workOrder.id,
      level: workOrder.approvalLevel,
      approver: approver,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      comment: `快速${action === 'APPROVE' ? '核准' : '駁回'}`,
      timestamp: new Date(),
      type: 'WORKFLOW'
    });

    // 更新施工單狀態
    if (action === 'APPROVE') {
      if (workOrder.approvalLevel >= workOrder.totalLevels) {
        workOrder.status = 'APPROVED';
        workOrder.approvedAt = new Date();
        workOrder.approvedBy = approver;
        workOrder.currentApprover = null;
      } else {
        workOrder.approvalLevel++;
        workOrder.currentApprover = getNextApprover(workOrder.approvalLevel);
      }
    } else {
      workOrder.status = 'REJECTED';
      workOrder.rejectedAt = new Date();
      workOrder.rejectedBy = approver;
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

// 施工單簽核 API (保持原有邏輯)
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
      timestamp: new Date(),
      type: 'WORKFLOW'
    });

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

// 年度資格 CRUD (保持原有邏輯)
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

// 快速續約年度資格
app.post('/api/qualifications/:id/quick-renew', async (req, res) => {
  try {
    const { renewalPeriod, renewalNotes, renewedBy } = req.body;
    const qualification = await Qualification.findByPk(req.params.id);
    
    if (!qualification) {
      return res.status(404).json({ success: false, message: '資格不存在' });
    }

    // 計算新的到期日 (以現有到期日為基準，加上續約期限)
    const currentValidTo = new Date(qualification.validTo);
    const newValidTo = new Date(currentValidTo);
    newValidTo.setFullYear(newValidTo.getFullYear() + (renewalPeriod || 1));

    await qualification.update({
      validTo: newValidTo,
      status: 'VALID',
      lastRenewedAt: new Date(),
      lastRenewedBy: renewedBy || '系統管理員',
      renewalNotes: renewalNotes || '快速續約',
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null
    });

    res.json({ 
      success: true, 
      data: qualification,
      message: `資格已續約至 ${newValidTo.toLocaleDateString('zh-TW')}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 快速停用年度資格
app.post('/api/qualifications/:id/quick-suspend', async (req, res) => {
  try {
    const { suspendReason, suspendedBy } = req.body;
    const qualification = await Qualification.findByPk(req.params.id);
    
    if (!qualification) {
      return res.status(404).json({ success: false, message: '資格不存在' });
    }

    await qualification.update({
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspendedBy: suspendedBy || '系統管理員',
      suspendReason: suspendReason || '管理員停用'
    });

    res.json({ 
      success: true, 
      data: qualification,
      message: '資格已停用'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 重新啟用年度資格
app.post('/api/qualifications/:id/reactivate', async (req, res) => {
  try {
    const { reactivatedBy, notes } = req.body;
    const qualification = await Qualification.findByPk(req.params.id);
    
    if (!qualification) {
      return res.status(404).json({ success: false, message: '資格不存在' });
    }

    // 檢查到期日決定狀態
    const now = new Date();
    const validTo = new Date(qualification.validTo);
    let newStatus = 'VALID';
    
    if (validTo < now) {
      newStatus = 'EXPIRED';
    } else if (validTo - now < 30 * 24 * 60 * 60 * 1000) { // 30天內到期
      newStatus = 'EXPIRES_SOON';
    }

    await qualification.update({
      status: newStatus,
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null,
      renewalNotes: notes || '重新啟用'
    });

    res.json({ 
      success: true, 
      data: qualification,
      message: '資格已重新啟用'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// FaceMatch 整合 CRUD (保持原有邏輯)
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

// 使用者管理 CRUD
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ 
      attributes: { exclude: ['passwordHash'] }, // 不返回密碼雜湊
      order: [['createdAt', 'DESC']] 
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = { ...req.body };
    
    // 如果是本地帳號且有提供密碼，進行雜湊
    if (userData.authType === 'LOCAL' && userData.password) {
      const saltRounds = 10;
      userData.passwordHash = await bcrypt.hash(userData.password, saltRounds);
      delete userData.password; // 移除明文密碼
    }
    
    const user = await User.create(userData);
    
    // 返回時排除密碼雜湊
    const { passwordHash, ...userResponse } = user.toJSON();
    res.json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '使用者不存在' });
    }
    
    const updateData = { ...req.body };
    
    // 如果有提供新密碼，進行雜湊
    if (updateData.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password;
    }
    
    await user.update(updateData);
    
    // 返回時排除密碼雜湊
    const { passwordHash, ...userResponse } = user.toJSON();
    res.json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '使用者不存在' });
    }
    
    // 檢查是否為系統管理員
    if (user.role === '管理員' && user.username === 'admin') {
      return res.status(400).json({ success: false, message: '無法刪除預設管理員帳號' });
    }
    
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 重設使用者密碼
app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '使用者不存在' });
    }
    
    if (user.authType !== 'LOCAL') {
      return res.status(400).json({ success: false, message: '只能重設本地帳號密碼' });
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await user.update({ passwordHash });
    res.json({ success: true, message: '密碼重設成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 停用/啟用使用者
app.post('/api/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '使用者不存在' });
    }
    
    await user.update({ isActive: !user.isActive });
    
    const { passwordHash, ...userResponse } = user.toJSON();
    res.json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 同步 AD 使用者
app.post('/api/users/sync-ad', async (req, res) => {
  try {
    if (!AD_CONFIG.enabled) {
      return res.status(400).json({ success: false, message: 'AD 功能未啟用' });
    }
    
    // 這裡可以實現 AD 使用者同步邏輯
    // 搜尋 AD 中的使用者並更新本地資料庫
    
    res.json({ success: true, message: 'AD 同步功能開發中' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取簽核者清單
app.get('/api/approvers', async (req, res) => {
  try {
    const approvers = await User.findAll({
      where: { 
        canApprove: true,
        isActive: true
      },
      attributes: ['id', 'username', 'displayName', 'role', 'approvalLevel', 'department'],
      order: [['approvalLevel', 'ASC']]
    });
    res.json({ success: true, data: approvers });
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
      database: 'SQLite Connected',
      adEnabled: AD_CONFIG.enabled
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
  console.log(`🚀 增強版後端服務啟動在 http://localhost:${port}`);
  console.log('📊 使用 SQLite 數據庫');
  console.log('👥 簽核者: 職環安 → 再生經理');
  console.log('🔐 AD 支援:', AD_CONFIG.enabled ? '啟用' : '停用');
  
  await initializeDatabase();
});