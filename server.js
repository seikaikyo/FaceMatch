require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const { Client } = require('ldapts');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5001;

// 中間件
app.use(cors({
  origin: ['http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 會話檢查中間件 - 在所有路由之前
app.use(checkSession);

// 日誌中間件 - 記錄請求資訊
app.use((req, res, next) => {
  req.startTime = Date.now();
  req.clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  req.sessionId = req.headers['session-id'] || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// 日誌記錄幫助函數
async function logOperation(req, operation, module, targetType, targetId, targetName, description, details = null, status = 'SUCCESS', errorMessage = null) {
  try {
    const executionTime = Date.now() - req.startTime;
    await OperationLog.create({
      userId: req.user?.id || null,
      username: req.user?.username || 'anonymous',
      userRole: req.user?.role || 'unknown',
      operation,
      module,
      targetType,
      targetId: targetId?.toString(),
      targetName,
      description,
      details: details ? JSON.stringify(details) : null,
      ipAddress: req.clientIp,
      userAgent: req.headers['user-agent'] || '',
      status,
      errorMessage,
      executionTime,
      sessionId: req.sessionId
    });
  } catch (error) {
    console.error('記錄操作日誌失敗:', error);
  }
}

// 認證中間件
function requireAuth(req, res, next) {
  // 模擬簡單的認證檢查 - 在實際應用中會檢查JWT token等
  if (!req.user) {
    return res.status(401).json({ success: false, message: '需要登入' });
  }
  next();
}

// 權限檢查中間件
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '需要登入' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }
    
    next();
  };
}

// 會話存儲 (簡單實現，生產環境建議使用 Redis)
const sessions = new Map();

// 會話檢查中間件
function checkSession(req, res, next) {
  const sessionId = req.headers['session-id'] || req.headers['sessionid'];
  
  if (sessionId && sessions.has(sessionId)) {
    req.user = sessions.get(sessionId);
  }
  
  next();
}

// 日誌記錄包裝器
function withLogging(operation, module, targetType) {
  return (originalFunction) => {
    return async (req, res, ...args) => {
      const startTime = Date.now();
      try {
        const result = await originalFunction(req, res, ...args);
        
        // 如果是成功的回應且有資料
        if (res.statusCode < 400) {
          const targetId = req.params.id || result?.data?.id || 'unknown';
          const targetName = result?.data?.name || result?.data?.title || result?.data?.displayName || result?.data?.username || 'unknown';
          await logOperation(req, operation, module, targetType, targetId, targetName, 
            `${operation} ${targetType} successfully`, result?.data, 'SUCCESS');
        }
        
        return result;
      } catch (error) {
        const targetId = req.params.id || 'unknown';
        await logOperation(req, operation, module, targetType, targetId, 'unknown', 
          `${operation} ${targetType} failed`, { error: error.message }, 'ERROR', error.message);
        throw error;
      }
    };
  };
}

// AD 配置 (從環境變數讀取)
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
  status: { 
    type: DataTypes.ENUM('DRAFT', 'PENDING_EHS', 'PENDING_MANAGER', 'APPROVED', 'REJECTED', 'RETURNED_TO_APPLICANT', 'PENDING', 'RETURNED'), 
    defaultValue: 'DRAFT' 
  },
  submittedBy: DataTypes.STRING,
  currentApprover: DataTypes.STRING,
  approvalLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
  totalLevels: { type: DataTypes.INTEGER, defaultValue: 2 },
  approvedAt: DataTypes.DATE,
  approvedBy: DataTypes.STRING,
  rejectedAt: DataTypes.DATE,
  rejectedBy: DataTypes.STRING,
  rejectionReason: DataTypes.TEXT,
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
  role: { type: DataTypes.ENUM('ADMIN', 'EHS', 'MANAGER', 'CONTRACTOR'), defaultValue: 'CONTRACTOR' },
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

// 操作日誌模型
const OperationLog = sequelize.define('OperationLog', {
  userId: DataTypes.INTEGER,
  username: { type: DataTypes.STRING, allowNull: false },
  userRole: DataTypes.STRING,
  operation: { type: DataTypes.STRING, allowNull: false }, // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, RENEW, SUSPEND
  module: { type: DataTypes.STRING, allowNull: false }, // contractors, workorders, qualifications, users, facematch, auth
  targetType: DataTypes.STRING, // 操作目標類型
  targetId: DataTypes.STRING, // 操作目標ID
  targetName: DataTypes.STRING, // 操作目標名稱
  description: { type: DataTypes.TEXT, allowNull: false }, // 操作描述
  details: DataTypes.TEXT, // JSON 格式的詳細資訊
  ipAddress: DataTypes.STRING,
  userAgent: DataTypes.STRING,
  status: { type: DataTypes.ENUM('SUCCESS', 'FAILED', 'ERROR'), defaultValue: 'SUCCESS' },
  errorMessage: DataTypes.TEXT,
  executionTime: DataTypes.INTEGER, // 執行時間(毫秒)
  sessionId: DataTypes.STRING
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['username'] },
    { fields: ['operation'] },
    { fields: ['module'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['module', 'operation'] },
    { fields: ['userId', 'createdAt'] }
  ]
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

    // 創建測試使用者 (從環境變數讀取密碼)
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    await User.bulkCreate([
      { 
        username: 'admin', 
        displayName: '系統管理員', 
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com',
        department: 'IT部門',
        jobTitle: '系統管理員',
        employeeId: 'EMP001',
        role: 'ADMIN', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 999, // 管理員可以簽核所有層級
        passwordHash: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', saltRounds),
        phoneNumber: '02-1234-5678'
      },
      { 
        username: 'safety', 
        displayName: '職環安專員', 
        email: 'safety@company.com',
        department: '職業安全衛生室',
        jobTitle: '職環安專員',
        employeeId: 'EMP002',
        role: 'EHS', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 1, // 第一層簽核
        passwordHash: await bcrypt.hash(process.env.DEFAULT_SAFETY_PASSWORD || 'safety123', saltRounds),
        phoneNumber: '02-1234-5679'
      },
      { 
        username: 'manager', 
        displayName: '再生經理', 
        email: 'manager@company.com',
        department: '再生事業部',
        jobTitle: '部門經理',
        employeeId: 'EMP003',
        role: 'MANAGER', 
        authType: 'LOCAL',
        canApprove: true,
        approvalLevel: 2, // 第二層簽核
        passwordHash: await bcrypt.hash(process.env.DEFAULT_MANAGER_PASSWORD || 'manager123', saltRounds),
        phoneNumber: '02-1234-5680'
      },
      {
        username: 'user001',
        displayName: '一般使用者',
        email: 'user001@company.com',
        department: '營運部門',
        jobTitle: '業務專員',
        employeeId: 'EMP004',
        role: 'CONTRACTOR',
        authType: 'LOCAL',
        canApprove: false,
        passwordHash: await bcrypt.hash(process.env.DEFAULT_USER_PASSWORD || 'user123', saltRounds),
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
      // 創建會話
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessions.set(sessionId, userInfo);
      
      // 記錄登入成功日誌
      req.user = userInfo; // 設置用戶資訊以便日誌記錄
      await logOperation(req, 'LOGIN', 'auth', 'user', userInfo.id, userInfo.username, 
        `使用者 ${userInfo.username} (${userInfo.role}) 登入成功`, 
        { authType: useAD ? 'AD' : 'LOCAL', loginTime: new Date() });
      
      res.json({
        success: true,
        token: `token-${userInfo.username}-${Date.now()}`,
        sessionId: sessionId,
        user: userInfo
      });
    } else {
      // 記錄登入失敗日誌
      await logOperation(req, 'LOGIN', 'auth', 'user', null, username, 
        `使用者 ${username} 登入失敗`, 
        { authType: useAD ? 'AD' : 'LOCAL', attemptTime: new Date() }, 'FAILED', '帳號或密碼錯誤');
      
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

// 增強型簽核系統 - 提交申請
app.post('/api/approvals/:workOrderId/submit', requireAuth, requireRole(['CONTRACTOR', 'ADMIN']), async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.workOrderId);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    if (workOrder.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: '只有草稿狀態的施工單可以提交' });
    }

    // 開始簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.approvalLevel = 1;
    workOrder.currentApprover = '職環安';
    await workOrder.save();

    await logOperation(req, 'SUBMIT', 'approval', 'workorder', workOrder.id, workOrder.title, '提交施工單申請');

    res.json({ success: true, message: '提交申請成功', data: workOrder });
  } catch (error) {
    await logOperation(req, 'SUBMIT', 'approval', 'workorder', req.params.workOrderId, 'unknown', '提交申請失敗', { error: error.message }, 'ERROR', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 職環安簽核
app.post('/api/approvals/:workOrderId/ehs', requireAuth, requireRole(['EHS', 'ADMIN']), async (req, res) => {
  try {
    const { action, comments, rejectTo } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.workOrderId);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    if (workOrder.status !== 'PENDING_EHS') {
      return res.status(400).json({ success: false, message: '此施工單目前不在職環安簽核階段' });
    }

    // 記錄簽核歷史
    await ApprovalHistory.create({
      workOrderId: workOrder.id,
      level: 1,
      approver: '職環安',
      action,
      comment: comments || '',
      timestamp: new Date(),
      type: 'EHS_APPROVAL'
    });

    if (action === 'APPROVED') {
      // 進入經理審核階段
      workOrder.status = 'PENDING_MANAGER';
      workOrder.approvalLevel = 2;
      workOrder.currentApprover = '再生經理';
      
      await logOperation(req, 'APPROVE', 'approval', 'workorder', workOrder.id, workOrder.title, '職環安核准', { comments });
    } else {
      // 職環安駁回只能退回給申請人
      workOrder.status = 'RETURNED_TO_APPLICANT';
      workOrder.currentApprover = null;
      workOrder.rejectedAt = new Date();
      workOrder.rejectedBy = '職環安';
      workOrder.rejectionReason = comments || '職環安駁回申請';
      
      await logOperation(req, 'REJECT', 'approval', 'workorder', workOrder.id, workOrder.title, '職環安駁回給申請人', { comments });
    }

    await workOrder.save();
    res.json({ success: true, message: `職環安${action === 'APPROVED' ? '核准' : '駁回'}成功`, data: workOrder });
  } catch (error) {
    await logOperation(req, 'EHS_APPROVAL', 'approval', 'workorder', req.params.workOrderId, 'unknown', '職環安簽核失敗', { error: error.message }, 'ERROR', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 經理簽核
app.post('/api/approvals/:workOrderId/manager', requireAuth, requireRole(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { action, comments, rejectTo } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.workOrderId);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    if (workOrder.status !== 'PENDING_MANAGER') {
      return res.status(400).json({ success: false, message: '此施工單目前不在經理簽核階段' });
    }

    // 記錄簽核歷史
    await ApprovalHistory.create({
      workOrderId: workOrder.id,
      level: 2,
      approver: '再生經理',
      action,
      comment: comments || '',
      timestamp: new Date(),
      type: 'MANAGER_APPROVAL'
    });

    if (action === 'APPROVED') {
      // 最終核准
      workOrder.status = 'APPROVED';
      workOrder.approvedAt = new Date();
      workOrder.approvedBy = '再生經理';
      workOrder.currentApprover = null;
      
      await logOperation(req, 'APPROVE', 'approval', 'workorder', workOrder.id, workOrder.title, '經理最終核准', { comments });
    } else {
      // 經理可選擇駁回對象
      const targetTo = rejectTo || 'APPLICANT';
      
      if (targetTo === 'PREVIOUS_LEVEL') {
        // 駁回給職環安重新審核
        workOrder.status = 'PENDING_EHS';
        workOrder.approvalLevel = 1;
        workOrder.currentApprover = '職環安';
        workOrder.rejectionReason = comments || '經理要求職環安重新審核';
        
        await logOperation(req, 'REJECT', 'approval', 'workorder', workOrder.id, workOrder.title, '經理駁回給職環安', { comments, rejectTo });
      } else {
        // 駁回給申請人
        workOrder.status = 'RETURNED_TO_APPLICANT';
        workOrder.currentApprover = null;
        workOrder.rejectedAt = new Date();
        workOrder.rejectedBy = '再生經理';
        workOrder.rejectionReason = comments || '經理駁回申請';
        
        await logOperation(req, 'REJECT', 'approval', 'workorder', workOrder.id, workOrder.title, '經理駁回給申請人', { comments, rejectTo });
      }
    }

    await workOrder.save();
    res.json({ success: true, message: `經理${action === 'APPROVED' ? '核准' : '駁回'}成功`, data: workOrder });
  } catch (error) {
    await logOperation(req, 'MANAGER_APPROVAL', 'approval', 'workorder', req.params.workOrderId, 'unknown', '經理簽核失敗', { error: error.message }, 'ERROR', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 管理員特殊駁回
app.post('/api/approvals/:workOrderId/admin-reject', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { rejectTo, comments } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.workOrderId);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    // 記錄管理員操作歷史
    await ApprovalHistory.create({
      workOrderId: workOrder.id,
      level: workOrder.approvalLevel || 0,
      approver: '管理員',
      action: 'REJECTED',
      comment: `管理員駁回: ${comments || ''}`,
      timestamp: new Date(),
      type: 'ADMIN_OVERRIDE'
    });

    workOrder.rejectedAt = new Date();
    workOrder.rejectedBy = '管理員';
    workOrder.rejectionReason = `管理員駁回: ${comments || ''}`;

    switch (rejectTo) {
      case 'EHS':
        workOrder.status = 'PENDING_EHS';
        workOrder.approvalLevel = 1;
        workOrder.currentApprover = '職環安';
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

    await workOrder.save();
    await logOperation(req, 'ADMIN_REJECT', 'approval', 'workorder', workOrder.id, workOrder.title, `管理員駁回至${rejectTo}`, { comments, rejectTo });

    res.json({ 
      success: true, 
      message: `管理員駁回成功，已退回給${rejectTo === 'APPLICANT' ? '申請人' : rejectTo === 'EHS' ? '職環安' : '再生經理'}`,
      data: workOrder 
    });
  } catch (error) {
    await logOperation(req, 'ADMIN_REJECT', 'approval', 'workorder', req.params.workOrderId, 'unknown', '管理員駁回失敗', { error: error.message }, 'ERROR', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 重新提交被駁回的申請
app.post('/api/approvals/:workOrderId/resubmit', requireAuth, requireRole(['CONTRACTOR', 'ADMIN']), async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.workOrderId);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: '施工單不存在' });
    }

    if (workOrder.status !== 'RETURNED_TO_APPLICANT') {
      return res.status(400).json({ success: false, message: '只有被駁回的施工單可以重新提交' });
    }

    // 重新開始簽核流程
    workOrder.status = 'PENDING_EHS';
    workOrder.approvalLevel = 1;
    workOrder.currentApprover = '職環安';
    workOrder.rejectionReason = null;
    workOrder.rejectedAt = null;
    workOrder.rejectedBy = null;

    await workOrder.save();
    await logOperation(req, 'RESUBMIT', 'approval', 'workorder', workOrder.id, workOrder.title, '重新提交被駁回的申請');

    res.json({ success: true, message: '重新提交申請成功', data: workOrder });
  } catch (error) {
    await logOperation(req, 'RESUBMIT', 'approval', 'workorder', req.params.workOrderId, 'unknown', '重新提交失敗', { error: error.message }, 'ERROR', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 查詢簽核歷史
app.get('/api/approvals/:workOrderId/history', async (req, res) => {
  try {
    const history = await ApprovalHistory.findAll({ 
      where: { workOrderId: req.params.workOrderId },
      order: [['timestamp', 'ASC']]
    });
    res.json({ success: true, data: history });
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
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
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
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
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
    
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
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

// 操作日誌 API
app.get('/api/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      module, 
      operation, 
      username, 
      status, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const whereClause = {};
    
    // 過濾條件
    if (module) whereClause.module = module;
    if (operation) whereClause.operation = operation;
    if (username) whereClause.username = { [sequelize.Op.like]: `%${username}%` };
    if (status) whereClause.status = status;
    
    // 日期範圍過濾
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(endDate);
    }
    
    // 通用搜尋
    if (search) {
      whereClause[sequelize.Op.or] = [
        { description: { [sequelize.Op.like]: `%${search}%` } },
        { targetName: { [sequelize.Op.like]: `%${search}%` } },
        { username: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await OperationLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 統計資訊
    const stats = await OperationLog.findAll({
      attributes: [
        'module',
        'operation',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['module', 'operation', 'status'],
      raw: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 操作日誌統計 API
app.get('/api/logs/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // 按模組統計
    const moduleStats = await OperationLog.findAll({
      attributes: [
        'module',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'SUCCESS' THEN 1 END")), 'success'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'ERROR' THEN 1 END")), 'error']
      ],
      where: {
        createdAt: { [sequelize.Op.gte]: startDate }
      },
      group: ['module'],
      raw: true
    });

    // 按操作統計
    const operationStats = await OperationLog.findAll({
      attributes: [
        'operation',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [sequelize.Op.gte]: startDate }
      },
      group: ['operation'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // 按使用者統計
    const userStats = await OperationLog.findAll({
      attributes: [
        'username',
        'userRole',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [sequelize.Op.gte]: startDate }
      },
      group: ['username', 'userRole'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // 每日趨勢
    const dailyTrend = await OperationLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [sequelize.Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        moduleStats,
        operationStats,
        userStats,
        dailyTrend,
        period: `${days} 天`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 清理舊日誌 API (管理員專用)
app.delete('/api/logs/cleanup', async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deletedCount = await OperationLog.destroy({
      where: {
        createdAt: { [sequelize.Op.lt]: cutoffDate }
      }
    });

    await logOperation(req, 'DELETE', 'logs', 'cleanup', null, 'old_logs', 
      `清理 ${days} 天前的日誌，共刪除 ${deletedCount} 條記錄`, { deletedCount, days });

    res.json({
      success: true,
      message: `成功清理 ${deletedCount} 條舊日誌`,
      deletedCount
    });
  } catch (error) {
    await logOperation(req, 'DELETE', 'logs', 'cleanup', null, 'old_logs', 
      '清理舊日誌失敗', { error: error.message }, 'ERROR', error.message);
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