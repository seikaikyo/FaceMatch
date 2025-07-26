// 基礎類型定義
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'CONTRACTOR' | 'EHS' | 'MANAGER' | 'ADMIN';
  contractorId?: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contractor {
  _id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  contactPerson: string;
  contactPhone: string;
  contractValidFrom: string;
  contractValidTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorPerson {
  _id: string;
  contractorId: string;
  employeeId: string;
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
  faceTemplateId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
  contractor?: Contractor;
  annualQualifications?: AnnualQualification[];
}

export interface AnnualQualification {
  _id: string;
  personId: string;
  qualificationType: string;
  trainingDate: string;
  certificationDate: string;
  validFrom: string;
  validTo: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  certificateNumber?: string;
  renewalHistory: RenewalRecord[];
  createdAt: string;
  updatedAt: string;
  person?: ContractorPerson;
}

export interface RenewalRecord {
  oldValidTo: string;
  newValidTo: string;
  renewalDate: string;
  reason: string;
  approvedBy: string;
}

export interface WorkOrder {
  _id: string;
  orderNumber: string;
  title: string;
  description?: string;
  contractorId: string;
  siteLocation: string;
  workType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  safetyRequirements: string[];
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
  contractor?: Contractor;
  assignments?: WorkOrderAssignment[];
  schedules?: WorkOrderSchedule[];
}

export interface WorkOrderAssignment {
  _id: string;
  workOrderId: string;
  personId: string;
  role: string;
  accessLevel: 'BASIC' | 'SUPERVISOR' | 'MANAGER';
  assignedAt: string;
  assignedBy: string;
  status: 'ASSIGNED' | 'CONFIRMED' | 'CANCELLED';
  workOrder?: WorkOrder;
  person?: ContractorPerson;
}

export interface WorkOrderSchedule {
  _id: string;
  workOrderId: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number[];
  isRecurring: boolean;
  recurringPattern?: string;
  accessAreas: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FaceMatchIntegration {
  _id: string;
  workOrderId: string;
  integrationStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  lastSyncAt?: string;
  syncAttempts: number;
  errorMessage?: string;
  faceMatchEventSourceId?: string;
  faceMatchPermissionId?: string;
  createdAt: string;
  updatedAt: string;
}

// API 回應類型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 表單類型
export interface LoginForm {
  username: string;
  password: string;
}

export interface ContractorForm {
  name: string;
  code: string;
  contactPerson: string;
  contactPhone: string;
  contractValidFrom: string;
  contractValidTo: string;
}

export interface PersonForm {
  employeeId: string;
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
}

export interface QualificationForm {
  qualificationType: string;
  trainingDate: string;
  certificationDate: string;
  validFrom: string;
  validTo: string;
  certificateNumber?: string;
}

export interface WorkOrderForm {
  orderNumber: string;
  title: string;
  description?: string;
  contractorId: string;
  siteLocation: string;
  workType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  plannedStartTime: string;
  plannedEndTime: string;
  safetyRequirements: string[];
  emergencyContact: string;
}

// 查詢參數類型
export interface ContractorQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface WorkOrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  contractorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PersonQuery {
  page?: number;
  limit?: number;
  status?: string;
  hasQualification?: boolean;
}

export interface QualificationQuery {
  page?: number;
  limit?: number;
  status?: 'VALID' | 'EXPIRED' | 'REVOKED';
  qualificationType?: string;
  personId?: string;
  search?: string;
}

// FaceMatch 相關類型定義
export interface FaceMatchSyncStatistics {
  total: number;
  success: number;
  failed: number;
  partial: number;
  pending: number;
}

export interface FaceMatchSyncStatus {
  workOrderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING';
  lastSyncAt: string;
  syncDetails: {
    totalPersons: number;
    syncedPersons: number;
    failedPersons: number;
  };
  errorMessage?: string;
}

export interface FaceMatchBatchSyncRequest {
  workOrderIds: string[];
  forceSync?: boolean;
}

export interface FaceMatchBatchSyncResult {
  totalWorkOrders: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    workOrderId: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    message: string;
    syncDetails?: {
      totalPersons: number;
      syncedPersons: number;
      failedPersons: number;
    };
  }>;
}

export interface FaceMatchPersonPhoto {
  id: string;
  personId: string;
  personName: string;
  filename: string;
  uploadedAt: string;
  fileSize: number;
  thumbnail?: string;
  photoUrl?: string;
}

export interface FaceMatchPhotoUploadRequest {
  personId: string;
  photo: File;
}

export interface FaceMatchBatchPhotoUploadRequest {
  photos: Array<{
    personId: string;
    photo: File;
  }>;
}

export interface FaceMatchPhotoCompareRequest {
  targetPersonId: string;
  sourcePhoto: File;
}

export interface FaceMatchBatchPhotoCompareRequest {
  comparisons: Array<{
    targetPersonId: string;
    sourcePhoto: File;
  }>;
}

export interface FaceMatchPhotoCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  targetPersonId?: string;
  sourceFileName?: string;
}

export interface FaceMatchConnectionStatus {
  connected: boolean;
  lastChecked?: string;
  responseTime?: number;
}

export interface FaceMatchEmergencyRevokeRequest {
  personId: string;
  reason: string;
}

// FaceMatch 表單類型
export interface FaceMatchPhotoUploadForm {
  personId: string;
  photos: File[];
}

export interface FaceMatchBatchSyncForm {
  workOrderIds: string;
  forceSync: boolean;
}

export interface FaceMatchPhotoCompareForm {
  targetPersonId: string;
  sourcePhoto: File | null;
  mode: 'single' | 'batch';
}

export interface FaceMatchBatchPhotoCompareForm {
  comparisons: Array<{
    targetPersonId: string;
    sourcePhoto: File | null;
  }>;
}

// FaceMatch 查詢參數類型
export interface FaceMatchPhotoQuery {
  personId?: string;
  page?: number;
  limit?: number;
}

export interface FaceMatchSyncQuery {
  status?: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// FaceMatch 配置類型
export interface FaceMatchConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  username: string;
  password: string;
  timeout: number;
  maxRetries: number;
}

// FaceMatch API 回應類型
export interface FaceMatchApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FaceMatchListResponse<T = any> {
  paging: {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
  results: T[];
}

// FaceMatch 事件類型
export interface FaceMatchSyncEvent {
  workOrderId: string;
  eventType: 'SYNC_START' | 'SYNC_SUCCESS' | 'SYNC_FAILED' | 'SYNC_PARTIAL';
  timestamp: string;
  details?: any;
}

export interface FaceMatchPhotoEvent {
  personId: string;
  eventType: 'PHOTO_UPLOAD' | 'PHOTO_UPDATE' | 'PHOTO_DELETE' | 'PHOTO_COMPARE';
  timestamp: string;
  filename?: string;
  result?: any;
}