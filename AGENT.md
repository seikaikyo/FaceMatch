# FaceMatch 承攬商管理系統開發 Agent

## 專案概述

本專案旨在開發一個承攬商施工申請單與研華 FaceMatch 人臉辨識系統的自動化整合系統，實現雙層效期管理、自動排程產生、資格檢核等核心業務需求。

## 技術架構選型

### 核心技術棧
```typescript
後端框架: Node.js + Express + TypeScript
資料庫: MongoDB + Mongoose  
認證系統: JWT + bcrypt
API文件: Swagger/OpenAPI
測試框架: Jest + Supertest
開發工具: nodemon + ts-node
```

### 選型理由
- **Express**: 輕量、靈活，適合複雜業務邏輯
- **TypeScript**: 型別安全，減少執行時錯誤  
- **MongoDB**: 文件導向，適合複雜的階層資料結構
- **無 CMS 框架**: 避免不必要的抽象層，直接控制業務邏輯

## 專案結構設計

```
src/
├── config/           # 配置管理
│   ├── database.ts
│   ├── facematch.ts
│   └── jwt.ts
├── models/           # 資料模型
│   ├── Contractor.ts
│   ├── ContractorPerson.ts  
│   ├── AnnualQualification.ts
│   ├── WorkOrder.ts
│   └── FaceMatchIntegration.ts
├── controllers/      # 控制器
│   ├── contractors.ts
│   ├── workOrders.ts
│   └── facematch.ts
├── services/         # 業務邏輯服務
│   ├── QualificationService.ts
│   ├── FaceMatchSyncService.ts
│   └── NotificationService.ts
├── middleware/       # 中介軟體
│   ├── auth.ts
│   ├── validation.ts
│   └── errorHandler.ts
├── routes/          # 路由定義
│   ├── api/
│   └── index.ts
├── utils/           # 工具函數
│   ├── facematch-client.ts
│   └── date-helpers.ts
└── app.ts           # 應用程式入口
```

## 核心資料模型

### 1. 承攬商模型 (Contractor)
```typescript
interface IContractor {
  _id: ObjectId;
  name: string;                    // 承攬商名稱
  code: string;                    // 承攬商編號 (唯一)
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  contactPerson: string;           // 聯絡人
  contactPhone: string;            // 聯絡電話
  contractValidFrom: Date;         // 合約生效日
  contractValidTo: Date;           // 合約到期日
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 承攬商人員模型 (ContractorPerson)
```typescript
interface IContractorPerson {
  _id: ObjectId;
  contractorId: ObjectId;          // 所屬承攬商
  employeeId: string;              // 員工編號
  name: string;                    // 姓名
  idNumber: string;                // 身分證號
  phone: string;                   // 電話
  email?: string;                  // 電子郵件
  faceTemplateId?: string;         // FaceMatch人臉模板ID
  facePhotoPath?: string;          // 人臉照片路徑
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. 年度資格模型 (AnnualQualification)
```typescript
interface IAnnualQualification {
  _id: ObjectId;
  personId: ObjectId;              // 人員ID
  qualificationType: string;       // 資格類型
  trainingDate: Date;              // 教育訓練日期
  certificationDate: Date;         // 發證日期
  validFrom: Date;                 // 資格生效日
  validTo: Date;                   // 資格到期日
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  certificateNumber?: string;      // 證書號碼
  renewalHistory: {               // 展延記錄
    oldValidTo: Date;
    newValidTo: Date;
    renewalDate: Date;
    reason: string;
    approvedBy: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. 施工單模型 (WorkOrder)
```typescript
interface IWorkOrder {
  _id: ObjectId;
  orderNumber: string;             // 施工單號 (唯一)
  title: string;                   // 施工名稱
  description?: string;            // 施工描述
  contractorId: ObjectId;          // 承攬商ID
  siteLocation: string;            // 施工地點
  workType: string;                // 作業類型
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // 時程管理
  plannedStartTime: Date;          // 預計開始時間
  plannedEndTime: Date;            // 預計結束時間
  actualStartTime?: Date;          // 實際開始時間
  actualEndTime?: Date;            // 實際結束時間
  
  // 申請人資訊
  applicantId: ObjectId;           // 申請人ID (承攬商用戶)
  applicantName: string;           // 申請人姓名
  appliedAt: Date;                 // 申請時間
  
  // 簽核流程狀態
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_EHS' | 'PENDING_MANAGER' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentApprovalLevel: 'APPLICANT' | 'EHS' | 'MANAGER' | 'COMPLETED';
  
  // 簽核記錄
  approvalHistory: {
    level: 'EHS' | 'MANAGER';      // 簽核層級
    approverRole: string;          // 簽核者角色 (職環安/再生經理)
    approverId?: ObjectId;         // 簽核者ID
    approverName?: string;         // 簽核者姓名
    action: 'APPROVED' | 'REJECTED' | 'PENDING';
    comments?: string;             // 簽核意見
    actionAt?: Date;               // 簽核時間
    isRequired: boolean;           // 是否必要簽核
  }[];
  
  // 最終核准資訊
  finalApprovedBy?: ObjectId;      // 最終核准人ID
  finalApprovedAt?: Date;          // 最終核准時間
  rejectionReason?: string;        // 拒絕原因
  
  // 人員指派
  assignments: {
    personId: ObjectId;
    role: string;                  // 職務角色
    accessLevel: 'BASIC' | 'SUPERVISOR' | 'MANAGER';
    assignedAt: Date;
    assignedBy: ObjectId;          // 指派人
  }[];
  
  // 時段排程
  schedules: {
    scheduleName: string;          // 時段名稱
    startTime: Date;               // 開始時間
    endTime: Date;                 // 結束時間
    dayOfWeek?: number[];          // 適用星期
    isRecurring: boolean;          // 是否重複
    accessAreas: string[];         // 可進入區域
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. 用戶模型 (User)
```typescript
interface IUser {
  _id: ObjectId;
  username: string;                // 用戶名 (唯一)
  email: string;                   // 電子郵件 (唯一)
  passwordHash: string;            // 密碼雜湊
  name: string;                    // 真實姓名
  role: 'CONTRACTOR' | 'EHS' | 'MANAGER' | 'ADMIN';  // 用戶角色
  
  // 承攬商用戶額外資訊
  contractorId?: ObjectId;         // 關聯的承攬商ID (僅承攬商用戶)
  
  // 權限設定
  permissions: string[];           // 細粒度權限
  isActive: boolean;               // 帳號狀態
  lastLoginAt?: Date;              // 最後登入時間
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. FaceMatch 整合模型 (FaceMatchIntegration)
```typescript
interface IFaceMatchIntegration {
  _id: ObjectId;
  workOrderId: ObjectId;           // 施工單ID
  integrationStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  lastSyncAt?: Date;               // 最後同步時間
  syncAttempts: number;            // 同步嘗試次數
  errorMessage?: string;           // 錯誤訊息
  
  // FaceMatch 系統 ID
  faceMatchEventSourceId?: string; // 事件來源ID
  faceMatchPermissionId?: string;  // 門禁許可表ID
  faceMatchScheduleId?: string;    // 排程ID
  
  // 人員同步狀態
  personSyncStatuses: {
    personId: ObjectId;
    faceMatchPersonId?: string;    // FaceMatch系統中的人員ID
    syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
    qualificationStatus: 'VALID' | 'EXPIRED' | 'NOT_FOUND';
    isActive: boolean;             // 是否啟用
    lastSyncAt?: Date;
    syncErrorMessage?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

## 核心業務服務

### 1. 簽核流程服務 (ApprovalService)
```typescript
class ApprovalService {
  // 提交施工單申請
  async submitWorkOrder(workOrderId: string, applicantId: string): Promise<void>
  
  // 職環安簽核
  async ehsApproval(workOrderId: string, approverId: string, action: 'APPROVED' | 'REJECTED', comments?: string): Promise<void>
  
  // 再生經理簽核  
  async managerApproval(workOrderId: string, approverId: string, action: 'APPROVED' | 'REJECTED', comments?: string): Promise<void>
  
  // 查詢待簽核項目
  async getPendingApprovals(userId: string, role: 'EHS' | 'MANAGER'): Promise<WorkOrder[]>
  
  // 查詢簽核歷史
  async getApprovalHistory(workOrderId: string): Promise<ApprovalHistory[]>
  
  // 檢查簽核權限
  async canApprove(userId: string, workOrderId: string): Promise<boolean>
  
  // 自動觸發下一層簽核
  private async triggerNextApproval(workOrderId: string): Promise<void>
}
```

### 2. 資格驗證服務 (QualificationService)
```typescript
class QualificationService {
  // 檢查人員年度資格
  async validatePersonQualification(personId: string, asOfDate: Date): Promise<QualificationCheckResult>
  
  // 檢查施工單時段權限
  async validateWorkOrderAccess(workOrderId: string, personId: string, accessTime: Date): Promise<AccessCheckResult>
  
  // 雙層效期綜合驗證
  async validateCompleteAccess(personId: string, workOrderId: string, accessTime: Date): Promise<CompleteAccessResult>
  
  // 批次資格檢核
  async batchCheckQualifications(personIds: string[], asOfDate?: Date): Promise<BatchCheckResult>
  
  // 施工單申請前的資格預檢
  async preCheckQualificationsForWorkOrder(personIds: string[], workOrderId: string): Promise<PreCheckResult>
}
```

### 2. FaceMatch 同步服務 (FaceMatchSyncService)
```typescript
class FaceMatchSyncService {
  // 同步單一施工單到 FaceMatch
  async syncWorkOrder(workOrderId: string, forceSync?: boolean): Promise<SyncResult>
  
  // 同步人員到 FaceMatch
  async syncPersonToFaceMatch(personId: string, workOrderId: string): Promise<PersonSyncResult>
  
  // 批次同步多個施工單
  async batchSyncWorkOrders(workOrderIds: string[]): Promise<BatchSyncResult>
  
  // 立即撤銷 FaceMatch 權限
  async emergencyRevokeAccess(personId: string, reason: string): Promise<void>
  
  // 檢查同步狀態
  async checkSyncStatus(workOrderId: string): Promise<SyncStatusResult>
}
```

### 3. FaceMatch API 客戶端 (FaceMatchClient)
```typescript
// 基於實際 FaceMatch API 設計
class FaceMatchClient {
  private baseUrl: string;
  private sessionId: string;
  
  constructor(host: string, port: number, protocol: string = 'http') {
    this.baseUrl = `${protocol}://${host}:${port}`;
  }
  
  // 認證管理
  async login(username: string, password: string): Promise<string> {
    // 實作登入邏輯，取得 sessionId
  }
  
  // 人員標籤管理 (Person Tag)
  async createPersonTags(persons: CreatePersonTagRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: persons
    };
    return this.request('POST', '/person/tag', payload);
  }
  
  async getPersonTags(paging?: PagingRequest): Promise<PersonTagListResponse> {
    const params = new URLSearchParams({
      sessionId: this.sessionId,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });
    return this.request('GET', `/person/tag?${params}`);
  }
  
  async updatePersonTags(updates: UpdatePersonTagRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: updates
    };
    return this.request('PUT', '/person/tag', payload);
  }
  
  async deletePersonTags(objectIds: string[]): Promise<ApiResponse> {
    const objectIdParam = objectIds.join(',');
    return this.request('DELETE', `/person/tag?sessionId=${this.sessionId}&objectId=${objectIdParam}`);
  }
  
  // 批次人員處理
  async batchCreatePersons(persons: BatchPersonRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: persons
    };
    return this.request('POST', '/person/batch', payload);
  }
  
  // 排程管理
  async createSchedules(schedules: CreateScheduleRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: schedules
    };
    return this.request('POST', '/schedule', payload);
  }
  
  async getSchedules(paging?: PagingRequest): Promise<ScheduleListResponse> {
    const params = new URLSearchParams({
      sessionId: this.sessionId,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });
    return this.request('GET', `/schedule?${params}`);
  }
  
  async updateSchedules(updates: UpdateScheduleRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: updates
    };
    return this.request('PUT', '/schedule', payload);
  }
  
  async deleteSchedules(objectIds: string[]): Promise<ApiResponse> {
    const objectIdParam = objectIds.join(',');
    return this.request('DELETE', `/schedule?sessionId=${this.sessionId}&objectId=${objectIdParam}`);
  }
  
  // 動作事件管理 (Action Event)
  async createActionEvents(events: CreateActionEventRequest[]): Promise<ApiResponse> {
    const payload = {
      sessionId: this.sessionId,
      datas: events
    };
    return this.request('POST', '/action/event', payload);
  }
  
  async getActionEvents(paging?: PagingRequest): Promise<ActionEventListResponse> {
    const params = new URLSearchParams({
      sessionId: this.sessionId,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });
    return this.request('GET', `/action/event?${params}`);
  }
  
  // 設備管理
  async getDevices(paging?: PagingRequest): Promise<DeviceListResponse> {
    const params = new URLSearchParams({
      sessionId: this.sessionId,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });
    return this.request('GET', `/device?${params}`);
  }
  
  // 來源管理 (Source)
  async getSources(paging?: PagingRequest): Promise<SourceListResponse> {
    const params = new URLSearchParams({
      sessionId: this.sessionId,
      'paging.page': paging?.page?.toString() || '1',
      'paging.pageSize': paging?.pageSize?.toString() || '10'
    });
    return this.request('GET', `/source?${params}`);
  }
  
  // HTTP 請求基礎方法
  private async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`FaceMatch API 錯誤: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}

// API 請求和回應的型別定義
interface CreatePersonTagRequest {
  name: string;
  photos?: string[];  // Base64 編碼的照片
  cardNo?: string;
  expireDate?: string;
}

interface UpdatePersonTagRequest {
  objectId: string;
  name?: string;
  photos?: string[];
  cardNo?: string;
  expireDate?: string;
}

interface CreateScheduleRequest {
  name: string;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  startTime: string;  // "HH:mm" 格式
  endTime: string;    // "HH:mm" 格式
  days: number[];     // 星期幾 [0-6]
}

interface CreateActionEventRequest {
  name: string;
  sourceType: 'camera';
  sourceId: string;
  personTagIds: string[];
  isMatch: boolean;
  isInSchedule: boolean;
  devices: EventDevice[];
}

interface EventDevice {
  type: string;  // 設備類型
  objectId: string;
}

interface PagingRequest {
  page: number;
  pageSize: number;
}

interface ApiResponse {
  datas: {
    statusCode: number;
    objectId: string;
    message: string;
    content?: any;
  }[];
}
}
```

## API 設計規格

### RESTful API 結構

#### 用戶認證與權限管理
```
POST   /api/auth/login                     # 用戶登入
POST   /api/auth/logout                    # 用戶登出
POST   /api/auth/refresh                   # 刷新 Token
GET    /api/auth/profile                   # 取得用戶資料
PUT    /api/auth/profile                   # 更新用戶資料

GET    /api/users                          # 查詢用戶列表 (僅管理員)
POST   /api/users                          # 建立用戶 (僅管理員)
PUT    /api/users/:id                      # 更新用戶
DELETE /api/users/:id                      # 刪除用戶 (僅管理員)
```

#### 承攬商管理 (CRUD)
```
GET    /api/contractors                    # 查詢承攬商列表
POST   /api/contractors                    # 建立承攬商
GET    /api/contractors/:id                # 查詢單一承攬商
PUT    /api/contractors/:id                # 更新承攬商
DELETE /api/contractors/:id                # 刪除承攬商

GET    /api/contractors/:id/persons        # 查詢承攬商人員
POST   /api/contractors/:id/persons        # 新增承攬商人員
POST   /api/contractors/:id/persons/batch  # 批次匯入人員
```

#### 人員管理 (CRUD)
```
GET    /api/persons                        # 查詢人員列表
GET    /api/persons/:id                    # 查詢單一人員
PUT    /api/persons/:id                    # 更新人員資訊
DELETE /api/persons/:id                    # 刪除人員
POST   /api/persons/:id/upload-photo       # 上傳人臉照片
```

#### 年度資格管理 (CRUD)
```
GET    /api/persons/:id/qualifications     # 查詢人員資格
POST   /api/persons/:id/qualifications     # 新增年度資格
GET    /api/qualifications/:id             # 查詢單一資格
PUT    /api/qualifications/:id             # 更新資格
DELETE /api/qualifications/:id             # 刪除資格
POST   /api/qualifications/:id/renew       # 資格展延
POST   /api/qualifications/batch-check     # 批次資格檢核
```

#### 施工單管理 (CRUD + 簽核)
```
GET    /api/work-orders                    # 查詢施工單列表
POST   /api/work-orders                    # 建立施工單
GET    /api/work-orders/:id                # 查詢單一施工單
PUT    /api/work-orders/:id                # 更新施工單
DELETE /api/work-orders/:id                # 刪除施工單

POST   /api/work-orders/:id/submit         # 提交申請
POST   /api/work-orders/:id/assignments    # 指派人員
PUT    /api/work-orders/:id/assignments/:assignmentId  # 更新人員指派
DELETE /api/work-orders/:id/assignments/:assignmentId  # 移除人員指派

POST   /api/work-orders/:id/schedules      # 建立時段
PUT    /api/work-orders/:id/schedules/:scheduleId      # 更新時段
DELETE /api/work-orders/:id/schedules/:scheduleId      # 刪除時段
```

#### 簽核流程 API
```
GET    /api/approvals/pending              # 查詢待簽核項目
GET    /api/approvals/my-pending           # 查詢我的待簽核項目
POST   /api/approvals/:workOrderId/ehs     # 職環安簽核
POST   /api/approvals/:workOrderId/manager # 再生經理簽核
GET    /api/approvals/:workOrderId/history # 查詢簽核歷史
GET    /api/approvals/statistics           # 簽核統計
```

#### FaceMatch 整合 API
```
POST   /api/work-orders/:id/facematch/sync     # 觸發 FaceMatch 同步
GET    /api/work-orders/:id/facematch/status   # 查詢同步狀態
POST   /api/facematch/batch-sync               # 批次同步
POST   /api/facematch/emergency-revoke         # 緊急撤銷
GET    /api/facematch/sync-logs                # 同步日誌查詢
POST   /api/facematch/test-connection          # 測試 FaceMatch 連線
```

#### 報表與統計 API
```
GET    /api/reports/qualification-status       # 資格狀態報表
GET    /api/reports/work-order-statistics      # 施工單統計
GET    /api/reports/facematch-sync-status      # 同步狀態報表
GET    /api/reports/approval-statistics        # 簽核統計報表
GET    /api/reports/contractor-summary         # 承攬商統計摘要
```

## 開發階段規劃

### 第一階段 - 基礎建設 (2-3天)
1. **專案初始化**
   - TypeScript + Express 專案建立
   - MongoDB 連線設定
   - 基本中介軟體配置 (CORS, body-parser, error handler)

2. **資料模型建立**
   - Mongoose Schema 定義
   - 資料驗證規則
   - 索引配置

3. **認證系統**
   - JWT 中介軟體
   - 基本的登入/登出功能

### 第二階段 - 核心 CRUD (3-4天)
1. **承攬商管理**
   - 承攬商 CRUD API
   - 承攬商人員管理
   - 資料驗證和錯誤處理

2. **年度資格管理**
   - 資格 CRUD API
   - 資格展延功能
   - 效期檢查邏輯

3. **基本測試**
   - API 單元測試
   - 整合測試設置

### 第三階段 - 施工單管理與簽核流程 (5-6天)
1. **施工單 CRUD**
   - 施工單基本操作
   - 人員指派功能
   - 時段排程管理

2. **簽核流程實作**
   - ApprovalService 實作
   - 三層簽核邏輯：申請人 → 職環安 → 再生經理
   - 簽核狀態追蹤和通知

3. **雙層效期驗證**
   - QualificationService 實作
   - 複合驗證邏輯
   - 效期狀態查詢
   - 申請前資格預檢

4. **FaceMatch API 客戶端**
   - HTTP 客戶端封裝
   - API 調用邏輯
   - 錯誤處理和重試機制

### 第四階段 - 自動同步整合 (5-6天)
1. **FaceMatch 同步服務**
   - 自動同步邏輯
   - 同步狀態追蹤
   - 批次處理功能

2. **事件驅動機制**
   - 施工單核准自動觸發同步
   - 資格變更自動更新
   - 例外情境處理

3. **監控和日誌**
   - 同步狀態監控
   - 詳細日誌記錄
   - 錯誤通知機制

### 第五階段 - 進階功能 (3-4天)
1. **報表系統**
   - 資格狀態報表
   - 同步狀態統計
   - 匯出功能

2. **批次操作**
   - 批次資格檢核
   - 批次同步
   - 大量資料處理

3. **管理介面準備**
   - API 文件生成
   - 測試資料準備
   - 部署配置

## 環境配置

### 開發環境 (.env.development)
```bash
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/facematch-cms

# JWT
JWT_SECRET=your-development-jwt-secret
JWT_EXPIRES_IN=24h

# FaceMatch API
FACEMATCH_HOST=10.6.116.200
FACEMATCH_PORT=80
FACEMATCH_USERNAME=Admin
FACEMATCH_PASSWORD=your-password
FACEMATCH_PROTOCOL=http
FACEMATCH_TIMEOUT=30000

# 系統設定
LOG_LEVEL=debug
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

## 品質保證

### 測試策略
1. **單元測試**: 業務邏輯服務的完整測試覆蓋
2. **整合測試**: API 端點的完整流程測試
3. **FaceMatch 整合測試**: 模擬 FaceMatch API 的整合測試

### 程式碼品質
- TypeScript 嚴格模式
- ESLint + Prettier 程式碼規範
- Git pre-commit hooks
- API 文件自動生成

## 預期交付成果

1. **完整的 RESTful API**: 涵蓋所有業務需求的 API 服務
2. **雙層效期驗證系統**: 核心的資格檢核邏輯
3. **FaceMatch 自動同步**: 穩定可靠的整合機制
4. **完整測試套件**: 高覆蓋率的自動化測試
5. **API 文件**: 詳細的 Swagger/OpenAPI 文件
6. **部署指南**: 完整的安裝和配置說明

這個架構設計避開了 CMS 的複雜性，直接使用 Express + TypeScript 提供最大的靈活性和控制力，特別適合您這種需要複雜業務邏輯整合的專案。