# 承攬商施工申請單與 FaceMatch 整合系統技術規格

## 專案概述

### 專案目標

開發一個自主簽核系統，實現承攬商施工申請單與研華 FaceMatch 人臉辨識系統的自動化整合，解決雙層效期管理、自動排程產生、資格檢核等核心業務需求。

### 開發環境

- **作業系統**: Windows 11 + WSL2
- **開發工具**: Claude Code (本地端開發)
- **目標**: 快速原型開發與測試驗證

## 系統架構設計

### 整體架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web 前端界面   │◄──►│   中台整合系統   │◄──►│  FaceMatch API  │
│  (申請單管理)    │    │  (業務邏輯處理)  │    │   (人臉辨識)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   資料庫系統     │
                       │ (雙層效期模型)   │
                       └─────────────────┘
```

### 技術棧建議

```yaml
後端框架:
  - Node.js + Express.js (快速開發)
  - 或 Python + FastAPI (型別安全)

前端框架:
  - React + TypeScript (現代化UI)
  - 或 Next.js (全棧解決方案)

資料庫:
  - PostgreSQL (關聯型資料，支援複雜查詢)
  - Redis (快取與Session管理)

開發工具:
  - Docker Compose (本地環境統一)
  - Prisma/TypeORM (資料庫ORM)
  - Winston (日誌管理)

技術手冊:
  - https://documenter.getpostman.com/view/1454150/U16qHi2T#d49ef74d-fb7e-4aee-abb5-33d226567502
```

## 核心資料模型

### 1. 承攬商資料模型

```typescript
interface Contractor {
  id: string; // 承攬商ID
  name: string; // 承攬商名稱
  code: string; // 承攬商編號
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  contactPerson: string; // 聯絡人
  contactPhone: string; // 聯絡電話
  contractValidFrom: Date; // 合約生效日
  contractValidTo: Date; // 合約到期日
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 承攬商人員資料模型

```typescript
interface ContractorPerson {
  id: string; // 人員ID
  contractorId: string; // 所屬承攬商ID
  employeeId: string; // 員工編號
  name: string; // 姓名
  idNumber: string; // 身分證號
  phone: string; // 電話
  email?: string; // 電子郵件
  faceTemplateId?: string; // FaceMatch人臉模板ID
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  createdAt: Date;
  updatedAt: Date;

  // 關聯
  contractor: Contractor;
  annualQualifications: AnnualQualification[];
  workOrderAssignments: WorkOrderAssignment[];
}
```

### 3. 年度資格模型 (層一效期)

```typescript
interface AnnualQualification {
  id: string; // 年度資格ID
  personId: string; // 人員ID
  qualificationType: string; // 資格類型 (安全、特殊作業等)
  trainingDate: Date; // 教育訓練日期
  certificationDate: Date; // 發證日期
  validFrom: Date; // 資格生效日
  validTo: Date; // 資格到期日
  status: "VALID" | "EXPIRED" | "REVOKED";
  trainingRecord?: string; // 訓練紀錄
  certificateNumber?: string; // 證書號碼
  renewalCount: number; // 展延次數
  createdAt: Date;
  updatedAt: Date;

  // 關聯
  person: ContractorPerson;
  renewalHistory: QualificationRenewal[];
}

interface QualificationRenewal {
  id: string;
  qualificationId: string;
  oldValidTo: Date; // 原到期日
  newValidTo: Date; // 新到期日
  renewalDate: Date; // 展延日期
  renewalReason: string; // 展延原因
  approvedBy: string; // 核准人
  createdAt: Date;
}
```

### 4. 施工單模型

```typescript
interface WorkOrder {
  id: string; // 施工單ID
  orderNumber: string; // 施工單號
  title: string; // 施工名稱
  description?: string; // 施工描述
  contractorId: string; // 承攬商ID
  siteLocation: string; // 施工地點
  workType: string; // 作業類型
  riskLevel: "LOW" | "MEDIUM" | "HIGH"; // 風險等級

  // 時程相關
  plannedStartTime: Date; // 預計開始時間
  plannedEndTime: Date; // 預計結束時間
  actualStartTime?: Date; // 實際開始時間
  actualEndTime?: Date; // 實際結束時間

  // 狀態管理
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "APPROVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  approvedBy?: string; // 核准人
  approvedAt?: Date; // 核准時間

  // 安全管理
  safetyRequirements: string[]; // 安全要求
  emergencyContact: string; // 緊急聯絡人

  createdAt: Date;
  updatedAt: Date;

  // 關聯
  contractor: Contractor;
  assignments: WorkOrderAssignment[];
  schedules: WorkOrderSchedule[];
  faceMatchIntegrations: FaceMatchIntegration[];
}
```

### 5. 施工單人員指派模型

```typescript
interface WorkOrderAssignment {
  id: string; // 指派ID
  workOrderId: string; // 施工單ID
  personId: string; // 人員ID
  role: string; // 職務角色
  accessLevel: "BASIC" | "SUPERVISOR" | "MANAGER"; // 權限等級
  assignedAt: Date; // 指派時間
  assignedBy: string; // 指派人
  status: "ASSIGNED" | "CONFIRMED" | "CANCELLED";

  // 關聯
  workOrder: WorkOrder;
  person: ContractorPerson;
  faceMatchSchedules: FaceMatchSchedule[];
}
```

### 6. 施工單時段模型 (層二效期)

```typescript
interface WorkOrderSchedule {
  id: string; // 時段ID
  workOrderId: string; // 施工單ID
  scheduleName: string; // 時段名稱
  startTime: Date; // 開始時間
  endTime: Date; // 結束時間
  dayOfWeek?: number[]; // 適用星期 (1-7)
  isRecurring: boolean; // 是否重複
  recurringPattern?: string; // 重複模式
  accessAreas: string[]; // 可進入區域
  createdAt: Date;
  updatedAt: Date;

  // 關聯
  workOrder: WorkOrder;
  faceMatchSchedules: FaceMatchSchedule[];
}
```

### 7. FaceMatch 整合模型

```typescript
interface FaceMatchIntegration {
  id: string; // 整合記錄ID
  workOrderId: string; // 施工單ID
  integrationStatus: "PENDING" | "SUCCESS" | "FAILED" | "PARTIAL";
  lastSyncAt?: Date; // 最後同步時間
  syncAttempts: number; // 同步嘗試次數
  errorMessage?: string; // 錯誤訊息
  faceMatchEventSourceId?: string; // FaceMatch事件來源ID
  faceMatchPermissionId?: string; // FaceMatch門禁許可表ID
  createdAt: Date;
  updatedAt: Date;

  // 關聯
  workOrder: WorkOrder;
  schedules: FaceMatchSchedule[];
}

interface FaceMatchSchedule {
  id: string; // FaceMatch排程ID
  integrationId: string; // 整合記錄ID
  assignmentId: string; // 人員指派ID
  scheduleId: string; // 施工時段ID
  faceMatchScheduleId?: string; // FaceMatch系統中的排程ID

  // 狀態追蹤
  syncStatus: "PENDING" | "SUCCESS" | "FAILED";
  qualificationStatus: "VALID" | "EXPIRED" | "NOT_FOUND";
  isActive: boolean; // 是否啟用

  // 同步資訊
  lastSyncAt?: Date;
  syncErrorMessage?: string;
  faceMatchPersonId?: string; // FaceMatch系統中的人員ID

  createdAt: Date;
  updatedAt: Date;

  // 關聯
  integration: FaceMatchIntegration;
  assignment: WorkOrderAssignment;
  schedule: WorkOrderSchedule;
}
```

## API 設計規格

### 1. 承攬商管理 API

#### 承攬商基本操作

```typescript
// 查詢承攬商列表
GET /api/contractors
Query Parameters:
  - page: number (頁數)
  - limit: number (每頁筆數)
  - status: string (狀態篩選)
  - search: string (名稱搜尋)

Response: {
  data: Contractor[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// 建立承攬商
POST /api/contractors
Body: {
  name: string,
  code: string,
  contactPerson: string,
  contactPhone: string,
  contractValidFrom: string,
  contractValidTo: string
}

// 更新承攬商
PUT /api/contractors/:id
Body: Partial<Contractor>

// 刪除承攬商
DELETE /api/contractors/:id
```

#### 承攬商人員管理

```typescript
// 查詢承攬商人員
GET /api/contractors/:contractorId/persons
Query Parameters:
  - page: number
  - limit: number
  - status: string
  - hasQualification: boolean

// 建立承攬商人員
POST /api/contractors/:contractorId/persons
Body: {
  employeeId: string,
  name: string,
  idNumber: string,
  phone: string,
  email?: string
}

// 批次匯入人員
POST /api/contractors/:contractorId/persons/batch-import
Body: {
  persons: ContractorPersonInput[],
  facePhotos?: File[] // 人臉照片
}
```

### 2. 年度資格管理 API

#### 資格操作

```typescript
// 查詢人員年度資格
GET /api/persons/:personId/qualifications
Query Parameters:
  - status: string
  - year: number

// 建立年度資格
POST /api/persons/:personId/qualifications
Body: {
  qualificationType: string,
  trainingDate: string,
  certificationDate: string,
  validFrom: string,
  validTo: string,
  certificateNumber?: string,
  trainingRecord?: string
}

// 資格展延
POST /api/qualifications/:id/renew
Body: {
  newValidTo: string,
  renewalReason: string,
  approvedBy: string
}

// 批次資格檢核
POST /api/qualifications/batch-check
Body: {
  personIds: string[],
  checkDate?: string
}

Response: {
  validPersons: PersonQualificationStatus[],
  expiredPersons: PersonQualificationStatus[],
  summary: {
    total: number,
    valid: number,
    expired: number,
    notFound: number
  }
}
```

### 3. 施工單管理 API

#### 施工單基本操作

```typescript
// 查詢施工單列表
GET /api/work-orders
Query Parameters:
  - page: number
  - limit: number
  - status: string
  - contractorId: string
  - startDate: string
  - endDate: string

// 建立施工單
POST /api/work-orders
Body: {
  orderNumber: string,
  title: string,
  description?: string,
  contractorId: string,
  siteLocation: string,
  workType: string,
  riskLevel: string,
  plannedStartTime: string,
  plannedEndTime: string,
  safetyRequirements: string[],
  emergencyContact: string
}

// 更新施工單
PUT /api/work-orders/:id
Body: Partial<WorkOrder>

// 施工單核准
POST /api/work-orders/:id/approve
Body: {
  approvedBy: string,
  approvedAt: string,
  comments?: string
}

// 施工單狀態變更
PUT /api/work-orders/:id/status
Body: {
  status: string,
  updatedBy: string,
  comments?: string
}
```

#### 人員指派管理

```typescript
// 指派人員到施工單
POST /api/work-orders/:id/assignments
Body: {
  personId: string,
  role: string,
  accessLevel: string,
  assignedBy: string
}

// 批次指派人員
POST /api/work-orders/:id/assignments/batch
Body: {
  assignments: {
    personId: string,
    role: string,
    accessLevel: string
  }[],
  assignedBy: string
}

// 移除人員指派
DELETE /api/work-orders/:workOrderId/assignments/:assignmentId
```

#### 時段排程管理

```typescript
// 建立施工時段
POST /api/work-orders/:id/schedules
Body: {
  scheduleName: string,
  startTime: string,
  endTime: string,
  dayOfWeek?: number[],
  isRecurring: boolean,
  recurringPattern?: string,
  accessAreas: string[]
}

// 更新施工時段
PUT /api/work-orders/:workOrderId/schedules/:scheduleId
Body: Partial<WorkOrderSchedule>

// 刪除施工時段
DELETE /api/work-orders/:workOrderId/schedules/:scheduleId
```

### 4. FaceMatch 整合 API

#### 自動同步功能

```typescript
// 觸發FaceMatch同步
POST /api/work-orders/:id/facematch/sync
Body: {
  forceSync: boolean,  // 強制重新同步
  syncType: 'FULL' | 'INCREMENTAL'
}

Response: {
  integrationId: string,
  status: string,
  syncedPersons: number,
  failedPersons: number,
  errors: SyncError[]
}

// 批次同步多個施工單
POST /api/facematch/batch-sync
Body: {
  workOrderIds: string[],
  forceSync: boolean
}

// 查詢同步狀態
GET /api/work-orders/:id/facematch/status

// 重試失敗的同步
POST /api/facematch/integrations/:id/retry
```

#### 手動管理功能

```typescript
// 手動建立FaceMatch排程
POST /api/facematch/schedules/manual
Body: {
  personId: string,
  workOrderId: string,
  startTime: string,
  endTime: string,
  accessAreas: string[]
}

// 立即啟用/停用FaceMatch權限
PUT /api/facematch/schedules/:id/toggle
Body: {
  isActive: boolean,
  reason: string
}

// 緊急撤銷權限
POST /api/facematch/emergency-revoke
Body: {
  personIds: string[],
  reason: string,
  revokedBy: string
}
```

### 5. 查詢與報表 API

#### 資格狀態查詢

```typescript
// 查詢承攬商年度資格狀態
GET /api/contractors/:id/qualification-status
Query Parameters:
  - asOfDate: string  // 指定日期的資格狀態

Response: {
  contractorInfo: Contractor,
  qualificationSummary: {
    totalPersons: number,
    validQualifications: number,
    expiredQualifications: number,
    expiringWithin30Days: number
  },
  personDetails: PersonQualificationStatus[]
}

// 查詢即將到期的資格
GET /api/qualifications/expiring
Query Parameters:
  - days: number      // 幾天內到期
  - contractorId: string

// 查詢施工單FaceMatch狀態
GET /api/work-orders/:id/facematch-status

Response: {
  workOrderInfo: WorkOrder,
  integrationStatus: FaceMatchIntegration,
  personStatuses: {
    personId: string,
    personName: string,
    qualificationStatus: string,
    faceMatchStatus: string,
    syncStatus: string,
    lastSyncAt: string,
    errors: string[]
  }[]
}
```

#### 統計報表

```typescript
// 承攬商統計報表
GET /api/reports/contractor-statistics
Query Parameters:
  - startDate: string
  - endDate: string
  - contractorId: string

// 施工單統計報表
GET /api/reports/work-order-statistics
Query Parameters:
  - period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  - startDate: string
  - endDate: string

// FaceMatch同步狀態報表
GET /api/reports/facematch-sync-status
Query Parameters:
  - startDate: string
  - endDate: string
  - status: string
```

### 6. 通知與提醒 API

#### 到期提醒

```typescript
// 設定提醒規則
POST /api/notifications/reminder-rules
Body: {
  reminderType: 'QUALIFICATION_EXPIRY' | 'CONTRACT_EXPIRY',
  daysBefore: number[],  // 提前幾天提醒
  notificationMethods: string[],  // 提醒方式
  recipients: string[]   // 收件人
}

// 手動觸發提醒檢查
POST /api/notifications/check-reminders

// 查詢待處理提醒
GET /api/notifications/pending
```

## 業務邏輯規則

### 1. 雙層效期驗證邏輯

```typescript
interface QualificationCheckResult {
  isValid: boolean;
  qualificationStatus: "VALID" | "EXPIRED" | "NOT_FOUND";
  validFrom?: Date;
  validTo?: Date;
  daysRemaining?: number;
}

interface WorkOrderAccessCheck {
  canAccess: boolean;
  qualificationCheck: QualificationCheckResult;
  workOrderStatus: "ACTIVE" | "INACTIVE" | "EXPIRED";
  accessTimeWindows: TimeWindow[];
  restrictions: string[];
}

// 核心驗證函數
function validatePersonAccess(
  personId: string,
  workOrderId: string,
  accessTime: Date
): WorkOrderAccessCheck {
  // 1. 檢查年度資格 (層一)
  const qualification = getValidQualification(personId, accessTime);

  // 2. 檢查施工單時段 (層二)
  const workOrderAccess = checkWorkOrderAccess(workOrderId, accessTime);

  // 3. 綜合判斷
  const canAccess =
    qualification.isValid &&
    workOrderAccess.isInTimeWindow &&
    workOrderAccess.isActive;

  return {
    canAccess,
    qualificationCheck: qualification,
    workOrderStatus: workOrderAccess.status,
    accessTimeWindows: workOrderAccess.timeWindows,
    restrictions: buildRestrictions(qualification, workOrderAccess),
  };
}
```

### 2. 自動同步邏輯

```typescript
interface SyncRule {
  trigger: "WORK_ORDER_APPROVED" | "QUALIFICATION_RENEWED" | "SCHEDULE_UPDATED";
  action: "CREATE" | "UPDATE" | "DEACTIVATE";
  conditions: SyncCondition[];
}

interface SyncCondition {
  type: "QUALIFICATION_VALID" | "WORK_ORDER_ACTIVE" | "PERSON_ACTIVE";
  value: any;
}

// 自動同步觸發器
async function handleWorkOrderApproved(workOrderId: string) {
  const workOrder = await getWorkOrder(workOrderId);
  const assignments = await getWorkOrderAssignments(workOrderId);

  for (const assignment of assignments) {
    const accessCheck = await validatePersonAccess(
      assignment.personId,
      workOrderId,
      new Date()
    );

    if (accessCheck.canAccess) {
      await createFaceMatchSchedule(assignment);
    } else {
      await createInactiveSchedule(assignment, accessCheck.restrictions);
    }
  }
}

async function handleQualificationRenewed(qualificationId: string) {
  const qualification = await getQualification(qualificationId);
  const activeWorkOrders = await getActiveWorkOrdersByPerson(
    qualification.personId
  );

  for (const workOrder of activeWorkOrders) {
    await updateFaceMatchSchedule(workOrder.id, qualification.personId);
  }
}
```

### 3. 例外情境處理

```typescript
// 緊急施工單處理
async function createEmergencyWorkOrder(
  emergencyRequest: EmergencyWorkOrderRequest
): Promise<WorkOrder> {
  // 1. 建立緊急施工單
  const workOrder = await createWorkOrder({
    ...emergencyRequest,
    status: "APPROVED", // 緊急單直接核准
    isEmergency: true,
  });

  // 2. 快速資格檢核
  const qualificationChecks = await batchCheckQualifications(
    emergencyRequest.personIds
  );

  // 3. 立即同步FaceMatch (僅有效資格人員)
  const validPersons = qualificationChecks.validPersons;
  await createImmediateFaceMatchAccess(workOrder.id, validPersons);

  return workOrder;
}

// 人員立即停權
async function emergencyRevokeAccess(
  personId: string,
  reason: string
): Promise<void> {
  // 1. 停用所有FaceMatch權限
  await deactivateAllFaceMatchSchedules(personId);

  // 2. 更新人員狀態
  await updatePersonStatus(personId, "SUSPENDED");

  // 3. 記錄操作日誌
  await createAuditLog({
    action: "EMERGENCY_REVOKE",
    personId,
    reason,
    timestamp: new Date(),
  });

  // 4. 發送通知
  await sendNotification({
    type: "EMERGENCY_REVOKE",
    personId,
    reason,
  });
}
```

## FaceMatch API 整合規格

### 1. FaceMatch API 封裝層

```typescript
class FaceMatchClient {
  constructor(
    private baseUrl: string,
    private credentials: { username: string; password: string }
  ) {}

  // 人員管理
  async createPerson(personData: CreatePersonRequest): Promise<string> {
    const response = await this.request("POST", "/api/persons", {
      name: personData.name,
      employeeId: personData.employeeId,
      photos: personData.photos,
      tags: personData.tags || [],
      cardNo: personData.cardNo,
      expireDate: personData.expireDate,
    });
    return response.id;
  }

  async updatePerson(
    personId: string,
    updates: UpdatePersonRequest
  ): Promise<void> {
    await this.request("PUT", `/api/persons/${personId}`, updates);
  }

  async deletePerson(personId: string): Promise<void> {
    await this.request("DELETE", `/api/persons/${personId}`);
  }

  // 門禁許可表管理
  async createAccessPermission(
    permission: CreatePermissionRequest
  ): Promise<string> {
    const response = await this.request("POST", "/api/access-permissions", {
      name: permission.name,
      eventSources: permission.eventSources,
      schedules: permission.schedules,
      persons: permission.persons,
    });
    return response.id;
  }

  async updateAccessPermission(
    permissionId: string,
    updates: UpdatePermissionRequest
  ): Promise<void> {
    await this.request(
      "PUT",
      `/api/access-permissions/${permissionId}`,
      updates
    );
  }

  // 排程管理
  async createSchedule(schedule: CreateScheduleRequest): Promise<string> {
    const response = await this.request("POST", "/api/schedules", {
      name: schedule.name,
      timeSlots: schedule.timeSlots,
    });
    return response.id;
  }

  async updateSchedule(
    scheduleId: string,
    updates: UpdateScheduleRequest
  ): Promise<void> {
    await this.request("PUT", `/api/schedules/${scheduleId}`, updates);
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.request("DELETE", `/api/schedules/${scheduleId}`);
  }

  // 觸發動作管理
  async createTriggerAction(
    action: CreateTriggerActionRequest
  ): Promise<string> {
    const response = await this.request("POST", "/api/trigger-actions", action);
    return response.id;
  }

  // 查詢功能
  async getPersons(filters?: PersonFilter): Promise<Person[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.request("GET", `/api/persons${queryParams}`);
    return response.data;
  }

  async getAccessPermissions(
    filters?: PermissionFilter
  ): Promise<AccessPermission[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.request(
      "GET",
      `/api/access-permissions${queryParams}`
    );
    return response.data;
  }

  // 同步狀態檢查
  async checkSyncStatus(personId: string): Promise<SyncStatus> {
    const response = await this.request(
      "GET",
      `/api/persons/${personId}/sync-status`
    );
    return response;
  }

  private async request(
    method: string,
    path: string,
    data?: any
  ): Promise<any> {
    // 實作HTTP請求邏輯
    // 包含錯誤處理、重試機制、日誌記錄
  }

  private buildQueryParams(filters?: any): string {
    // 實作查詢參數建構邏輯
  }
}
```

### 2. 同步服務實作

```typescript
class FaceMatchSyncService {
  constructor(
    private faceMatchClient: FaceMatchClient,
    private database: Database
  ) {}

  async syncWorkOrder(workOrderId: string): Promise<SyncResult> {
    const workOrder = await this.database.getWorkOrder(workOrderId);
    const assignments = await this.database.getWorkOrderAssignments(
      workOrderId
    );
    const schedules = await this.database.getWorkOrderSchedules(workOrderId);

    const results: SyncResult = {
      workOrderId,
      status: "PENDING",
      syncedItems: [],
      failedItems: [],
      errors: [],
    };

    try {
      // 1. 建立或更新FaceMatch排程
      const faceMatchScheduleId = await this.createOrUpdateFaceMatchSchedule(
        workOrder,
        schedules
      );

      // 2. 同步人員到FaceMatch
      for (const assignment of assignments) {
        try {
          const syncResult = await this.syncPersonToFaceMatch(
            assignment,
            faceMatchScheduleId
          );
          results.syncedItems.push(syncResult);
        } catch (error) {
          results.failedItems.push({
            personId: assignment.personId,
            error: error.message,
          });
        }
      }

      // 3. 更新整合狀態
      results.status = results.failedItems.length === 0 ? "SUCCESS" : "PARTIAL";
      await this.database.updateFaceMatchIntegration(workOrderId, results);

      return results;
    } catch (error) {
      results.status = "FAILED";
      results.errors.push(error.message);
      await this.database.updateFaceMatchIntegration(workOrderId, results);
      throw error;
    }
  }

  private async syncPersonToFaceMatch(
    assignment: WorkOrderAssignment,
    scheduleId: string
  ): Promise<PersonSyncResult> {
    // 1. 檢查年度資格
    const qualificationCheck = await this.checkPersonQualification(
      assignment.personId
    );

    if (!qualificationCheck.isValid) {
      return {
        personId: assignment.personId,
        status: "SKIPPED",
        reason: "QUALIFICATION_EXPIRED",
        qualificationStatus: qualificationCheck,
      };
    }

    // 2. 準備FaceMatch人員資料
    const person = await this.database.getContractorPerson(assignment.personId);
    const faceMatchPersonData = this.buildFaceMatchPersonData(
      person,
      assignment
    );

    // 3. 建立或更新FaceMatch人員
    let faceMatchPersonId = person.faceTemplateId;
    if (!faceMatchPersonId) {
      faceMatchPersonId = await this.faceMatchClient.createPerson(
        faceMatchPersonData
      );
      await this.database.updatePersonFaceTemplateId(
        person.id,
        faceMatchPersonId
      );
    } else {
      await this.faceMatchClient.updatePerson(
        faceMatchPersonId,
        faceMatchPersonData
      );
    }

    // 4. 建立門禁許可
    const permissionId = await this.createAccessPermission(
      assignment,
      scheduleId,
      faceMatchPersonId
    );

    return {
      personId: assignment.personId,
      status: "SUCCESS",
      faceMatchPersonId,
      permissionId,
      qualificationStatus: qualificationCheck,
    };
  }

  private async createOrUpdateFaceMatchSchedule(
    workOrder: WorkOrder,
    schedules: WorkOrderSchedule[]
  ): Promise<string> {
    const faceMatchScheduleData = this.buildFaceMatchScheduleData(
      workOrder,
      schedules
    );

    const existingIntegration = await this.database.getFaceMatchIntegration(
      workOrder.id
    );

    if (existingIntegration?.faceMatchScheduleId) {
      await this.faceMatchClient.updateSchedule(
        existingIntegration.faceMatchScheduleId,
        faceMatchScheduleData
      );
      return existingIntegration.faceMatchScheduleId;
    } else {
      return await this.faceMatchClient.createSchedule(faceMatchScheduleData);
    }
  }

  private buildFaceMatchPersonData(
    person: ContractorPerson,
    assignment: WorkOrderAssignment
  ): CreatePersonRequest {
    return {
      name: person.name,
      employeeId: person.employeeId,
      cardNo: person.id, // 使用系統內部ID作為卡號
      tags: [assignment.workOrder.contractor.name, assignment.role],
      expireDate: this.calculatePersonExpireDate(person),
      photos: [], // TODO: 處理人臉照片
    };
  }

  private buildFaceMatchScheduleData(
    workOrder: WorkOrder,
    schedules: WorkOrderSchedule[]
  ): CreateScheduleRequest {
    return {
      name: `施工單-${workOrder.orderNumber}`,
      timeSlots: schedules.map((schedule) => ({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek: schedule.dayOfWeek || [1, 2, 3, 4, 5, 6, 7],
        isRecurring: schedule.isRecurring,
      })),
    };
  }
}
```

## 前端界面設計

### 1. 主要頁面結構

```
/contractors                    # 承攬商管理
  /contractors/new              # 新增承攬商
  /contractors/:id              # 承攬商詳情
  /contractors/:id/persons      # 承攬商人員管理
  /contractors/:id/persons/new  # 新增人員

/work-orders                    # 施工單管理
  /work-orders/new              # 新增施工單
  /work-orders/:id              # 施工單詳情
  /work-orders/:id/assignments  # 人員指派
  /work-orders/:id/schedules    # 時段排程
  /work-orders/:id/facematch    # FaceMatch整合狀態

/qualifications                 # 年度資格管理
  /qualifications/expiring      # 即將到期資格
  /qualifications/batch-renew   # 批次展延

/reports                        # 報表中心
  /reports/qualification-status # 資格狀態報表
  /reports/work-order-status    # 施工單狀態報表
  /reports/facematch-sync       # FaceMatch同步報表

/settings                       # 系統設定
  /settings/facematch           # FaceMatch連線設定
  /settings/notifications       # 通知設定
```

### 2. 關鍵組件設計

```typescript
// 雙層效期狀態組件
interface QualificationStatusProps {
  personId: string;
  workOrderId?: string;
  showDetails?: boolean;
}

const QualificationStatus: React.FC<QualificationStatusProps> = ({
  personId,
  workOrderId,
  showDetails = false,
}) => {
  const { data: status } = usePersonQualificationStatus(personId, workOrderId);

  return (
    <div className="qualification-status">
      {/* 年度資格狀態 */}
      <div className="annual-qualification">
        <StatusBadge
          status={status.annualQualification.status}
          label="年度資格"
          validTo={status.annualQualification.validTo}
        />
      </div>

      {/* 施工單時段狀態 */}
      {workOrderId && (
        <div className="work-order-access">
          <StatusBadge
            status={status.workOrderAccess.status}
            label="施工時段"
            validTo={status.workOrderAccess.validTo}
          />
        </div>
      )}

      {/* 詳細資訊 */}
      {showDetails && <QualificationDetails status={status} />}
    </div>
  );
};

// FaceMatch同步狀態組件
interface FaceMatchSyncStatusProps {
  workOrderId: string;
}

const FaceMatchSyncStatus: React.FC<FaceMatchSyncStatusProps> = ({
  workOrderId,
}) => {
  const { data: syncStatus } = useFaceMatchSyncStatus(workOrderId);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await retryFaceMatchSync(workOrderId);
      // 重新載入狀態
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="facematch-sync-status">
      <div className="sync-overview">
        <StatusBadge status={syncStatus.overallStatus} label="整體狀態" />
        <div className="sync-stats">
          <span>成功: {syncStatus.successCount}</span>
          <span>失敗: {syncStatus.failedCount}</span>
          <span>等待中: {syncStatus.pendingCount}</span>
        </div>
      </div>

      <div className="person-sync-details">
        {syncStatus.personStatuses.map((person) => (
          <PersonSyncStatusRow
            key={person.personId}
            person={person}
            onRetry={() => retryPersonSync(person.personId)}
          />
        ))}
      </div>

      <div className="sync-actions">
        <Button
          onClick={handleRetrySync}
          disabled={isRetrying}
          variant="secondary"
        >
          {isRetrying ? "重試中..." : "重試失敗項目"}
        </Button>
        <Button onClick={() => forceFaceMatchSync(workOrderId)}>
          強制重新同步
        </Button>
      </div>
    </div>
  );
};

// 批次操作組件
interface BatchOperationProps<T> {
  items: T[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  operations: BatchOperation<T>[];
}

const BatchOperationPanel = <T>({
  items,
  selectedItems,
  onSelectionChange,
  operations,
}: BatchOperationProps<T>) => {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeOperation = async (operation: BatchOperation<T>) => {
    setIsExecuting(true);
    try {
      await operation.execute(selectedItems);
      onSelectionChange([]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="batch-operation-panel">
      <div className="selection-info">
        已選擇 {selectedItems.length} / {items.length} 項目
      </div>

      <div className="batch-actions">
        {operations.map((op) => (
          <Button
            key={op.id}
            onClick={() => executeOperation(op)}
            disabled={selectedItems.length === 0 || isExecuting}
            variant={op.variant}
          >
            {op.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
```

## 部署與開發環境

### 1. Docker 環境配置

```yaml
# docker-compose.yml
version: "3.8"

services:
  # 主應用服務
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/contractor_facematch
      - REDIS_URL=redis://redis:6379
      - FACEMATCH_API_URL=http://facematch:80
      - FACEMATCH_USERNAME=admin
      - FACEMATCH_PASSWORD=password
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  # 資料庫服務
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=contractor_facematch
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis 快取服務
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # FaceMatch 模擬器 (開發用)
  facematch-simulator:
    build:
      context: ./facematch-simulator
    ports:
      - "8080:80"
    environment:
      - SIMULATOR_MODE=true

volumes:
  postgres_data:
  redis_data:
```

### 2. 開發腳本

```json
{
  "scripts": {
    "dev": "docker-compose up -d && npm run dev:app",
    "dev:app": "nodemon src/index.ts",
    "build": "tsc && npm run build:client",
    "build:client": "cd client && npm run build",
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx scripts/seed.ts",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### 3. 環境變數配置

```bash
# .env.development
NODE_ENV=development
PORT=3000

# 資料庫設定
DATABASE_URL=postgresql://user:password@localhost:5432/contractor_facematch
REDIS_URL=redis://localhost:6379

# FaceMatch API 設定
FACEMATCH_API_URL=http://localhost:8080
FACEMATCH_USERNAME=admin
FACEMATCH_PASSWORD=password
FACEMATCH_TIMEOUT=30000

# JWT 設定
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# 通知設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 日誌設定
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# 檔案上傳設定
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10MB
```

## 測試策略

### 1. 單元測試

```typescript
// 測試年度資格驗證邏輯
describe("QualificationService", () => {
  describe("validatePersonQualification", () => {
    it("should return valid when qualification is within date range", async () => {
      const result = await qualificationService.validatePersonQualification(
        "person-1",
        new Date("2024-06-01")
      );

      expect(result.isValid).toBe(true);
      expect(result.qualificationStatus).toBe("VALID");
    });

    it("should return expired when qualification is past expiry date", async () => {
      const result = await qualificationService.validatePersonQualification(
        "person-1",
        new Date("2025-01-01")
      );

      expect(result.isValid).toBe(false);
      expect(result.qualificationStatus).toBe("EXPIRED");
    });
  });
});

// 測試FaceMatch同步服務
describe("FaceMatchSyncService", () => {
  describe("syncWorkOrder", () => {
    it("should sync all valid persons to FaceMatch", async () => {
      const mockWorkOrder = createMockWorkOrder();
      const result = await faceMatchSyncService.syncWorkOrder(mockWorkOrder.id);

      expect(result.status).toBe("SUCCESS");
      expect(result.syncedItems).toHaveLength(2);
      expect(result.failedItems).toHaveLength(0);
    });

    it("should skip persons with expired qualifications", async () => {
      const mockWorkOrder = createMockWorkOrderWithExpiredPersons();
      const result = await faceMatchSyncService.syncWorkOrder(mockWorkOrder.id);

      expect(result.status).toBe("PARTIAL");
      expect(result.syncedItems).toHaveLength(1);
      expect(result.failedItems).toHaveLength(1);
    });
  });
});
```

### 2. 整合測試

```typescript
// 測試完整的施工單核准流程
describe("Work Order Integration", () => {
  it("should automatically sync to FaceMatch when work order is approved", async () => {
    // 1. 建立測試資料
    const contractor = await createTestContractor();
    const person = await createTestPerson(contractor.id);
    const qualification = await createValidQualification(person.id);

    // 2. 建立施工單
    const workOrder = await createWorkOrder({
      contractorId: contractor.id,
      plannedStartTime: new Date(),
      plannedEndTime: addDays(new Date(), 7),
    });

    // 3. 指派人員
    await assignPersonToWorkOrder(workOrder.id, person.id);

    // 4. 核准施工單
    await approveWorkOrder(workOrder.id);

    // 5. 驗證FaceMatch同步
    const faceMatchIntegration = await getFaceMatchIntegration(workOrder.id);
    expect(faceMatchIntegration.integrationStatus).toBe("SUCCESS");

    // 6. 驗證FaceMatch中的資料
    const faceMatchPerson = await faceMatchClient.getPerson(
      person.faceTemplateId
    );
    expect(faceMatchPerson).toBeDefined();
    expect(faceMatchPerson.name).toBe(person.name);
  });
});
```

### 3. E2E 測試

```typescript
// 使用 Playwright 進行端到端測試
describe("Contractor Management E2E", () => {
  test("should create contractor and manage work orders", async ({ page }) => {
    // 1. 登入系統
    await page.goto("/login");
    await page.fill('[data-testid="username"]', "admin");
    await page.fill('[data-testid="password"]', "password");
    await page.click('[data-testid="login-button"]');

    // 2. 建立承攬商
    await page.goto("/contractors/new");
    await page.fill('[data-testid="contractor-name"]', "測試承攬商");
    await page.fill('[data-testid="contractor-code"]', "TEST001");
    await page.click('[data-testid="save-button"]');

    // 3. 新增人員
    await page.click('[data-testid="add-person-button"]');
    await page.fill('[data-testid="person-name"]', "測試人員");
    await page.fill('[data-testid="employee-id"]', "EMP001");
    await page.click('[data-testid="save-person-button"]');

    // 4. 建立年度資格
    await page.click('[data-testid="add-qualification-button"]');
    await page.selectOption('[data-testid="qualification-type"]', "安全訓練");
    await page.fill('[data-testid="valid-to"]', "2025-12-31");
    await page.click('[data-testid="save-qualification-button"]');

    // 5. 建立施工單
    await page.goto("/work-orders/new");
    await page.fill('[data-testid="order-number"]', "WO-001");
    await page.selectOption('[data-testid="contractor"]', "測試承攬商");
    await page.fill('[data-testid="planned-start"]', "2024-07-01T09:00");
    await page.fill('[data-testid="planned-end"]', "2024-07-01T17:00");

    // 6. 指派人員
    await page.click('[data-testid="assign-person-button"]');
    await page.selectOption('[data-testid="person-select"]', "測試人員");
    await page.click('[data-testid="confirm-assignment"]');

    // 7. 核准施工單
    await page.click('[data-testid="approve-button"]');

    // 8. 驗證FaceMatch同步狀態
    await page.click('[data-testid="facematch-tab"]');
    await expect(page.locator('[data-testid="sync-status"]')).toHaveText(
      "同步成功"
    );
  });
});
```

## 部署檢查清單

### 1. 開發環境準備

- [ ] WSL2 已安裝並配置
- [ ] Docker Desktop 已安裝
- [ ] Node.js 18+ 已安裝
- [ ] 資料庫已建立並執行遷移
- [ ] FaceMatch 測試環境已準備
- [ ] 環境變數已設定

### 2. 功能模組實作順序

1. **第一階段 (MVP)**

   - [ ] 基本資料模型建立
   - [ ] 承攬商與人員管理
   - [ ] 年度資格管理
   - [ ] FaceMatch API 客戶端

2. **第二階段 (核心功能)**

   - [ ] 施工單管理
   - [ ] 雙層效期驗證邏輯
   - [ ] FaceMatch 自動同步
   - [ ] 基本報表功能

3. **第三階段 (進階功能)**
   - [ ] 批次操作功能
   - [ ] 例外情境處理
   - [ ] 通知提醒系統
   - [ ] 完整的管理介面

### 3. 測試與品質確保

- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 效能測試通過
- [ ] 安全性測試通過

### 4. 文件與部署

- [ ] API 文件完整
- [ ] 使用者手冊完成
- [ ] 部署文件完成
- [ ] 監控與日誌配置
- [ ] 備份恢復流程驗證

---

此規格文件提供了完整的系統設計藍圖，可供 Claude Code 快速理解需求並加速開發流程。建議按照模組化方式逐步實作，確保每個階段都能獨立測試和驗證。
