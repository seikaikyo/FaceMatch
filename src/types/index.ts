import { ObjectId } from 'mongoose';

// 基本介面
export interface IBaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 用戶相關
export interface IUser extends IBaseDocument {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'CONTRACTOR' | 'EHS' | 'MANAGER' | 'ADMIN';
  contractorId?: ObjectId;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
}

// 承攬商相關
export interface IContractor extends IBaseDocument {
  name: string;
  code: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  contactPerson: string;
  contactPhone: string;
  contractValidFrom: Date;
  contractValidTo: Date;
}

export interface IContractorPerson extends IBaseDocument {
  contractorId: ObjectId;
  employeeId: string;
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
  faceTemplateId?: string;
  facePhotoPath?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

// 年度資格相關
export interface IAnnualQualification extends IBaseDocument {
  personId: ObjectId;
  qualificationType: string;
  trainingDate: Date;
  certificationDate: Date;
  validFrom: Date;
  validTo: Date;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  certificateNumber?: string;
  renewalHistory: IRenewalRecord[];
}

export interface IRenewalRecord {
  oldValidTo: Date;
  newValidTo: Date;
  renewalDate: Date;
  reason: string;
  approvedBy: string;
}

// 施工單相關
export interface IWorkOrder extends IBaseDocument {
  orderNumber: string;
  title: string;
  description?: string;
  contractorId: ObjectId;
  siteLocation: string;
  workType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  plannedStartTime: Date;
  plannedEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  applicantId: ObjectId;
  applicantName: string;
  appliedAt: Date;
  
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_EHS' | 'PENDING_MANAGER' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentApprovalLevel: 'APPLICANT' | 'EHS' | 'MANAGER' | 'COMPLETED';
  
  approvalHistory: IApprovalRecord[];
  finalApprovedBy?: ObjectId;
  finalApprovedAt?: Date;
  rejectionReason?: string;
  
  assignments: IWorkOrderAssignment[];
  schedules: IWorkOrderSchedule[];
}

export interface IApprovalRecord {
  level: 'EHS' | 'MANAGER';
  approverRole: string;
  approverId?: ObjectId;
  approverName?: string;
  action: 'APPROVED' | 'REJECTED' | 'PENDING';
  comments?: string;
  actionAt?: Date;
  isRequired: boolean;
}

export interface IWorkOrderAssignment {
  personId: ObjectId;
  role: string;
  accessLevel: 'BASIC' | 'SUPERVISOR' | 'MANAGER';
  assignedAt: Date;
  assignedBy: ObjectId;
}

export interface IWorkOrderSchedule {
  scheduleName: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek?: number[];
  isRecurring: boolean;
  accessAreas: string[];
}

// FaceMatch 整合相關
export interface IFaceMatchIntegration extends IBaseDocument {
  workOrderId: ObjectId;
  integrationStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  lastSyncAt?: Date;
  syncAttempts: number;
  errorMessage?: string;
  
  faceMatchEventSourceId?: string;
  faceMatchPermissionId?: string;
  faceMatchScheduleId?: string;
  
  personSyncStatuses: IPersonSyncStatus[];
}

export interface IPersonSyncStatus {
  personId: ObjectId;
  faceMatchPersonId?: string;
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  qualificationStatus: 'VALID' | 'EXPIRED' | 'NOT_FOUND';
  isActive: boolean;
  lastSyncAt?: Date;
  syncErrorMessage?: string;
}

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}