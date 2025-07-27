import mongoose, { Schema } from 'mongoose';
import { IWorkOrder, IApprovalRecord, IWorkOrderAssignment, IWorkOrderSchedule } from '../types';

const approvalRecordSchema = new Schema<IApprovalRecord>({
  level: {
    type: String,
    required: true,
    enum: ['EHS', 'MANAGER']
  },
  approverRole: {
    type: String,
    required: true,
    trim: true
  },
  approverId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approverName: {
    type: String,
    trim: true
  },
  action: {
    type: String,
    required: true,
    enum: ['APPROVED', 'REJECTED', 'PENDING'],
    default: 'PENDING'
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  actionAt: {
    type: Date
  },
  isRequired: {
    type: Boolean,
    required: true,
    default: true
  }
}, { _id: false });

const workOrderAssignmentSchema = new Schema<IWorkOrderAssignment>({
  personId: {
    type: Schema.Types.ObjectId,
    ref: 'ContractorPerson',
    required: true
  },
  role: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  accessLevel: {
    type: String,
    required: true,
    enum: ['BASIC', 'SUPERVISOR', 'MANAGER'],
    default: 'BASIC'
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

const workOrderScheduleSchema = new Schema<IWorkOrderSchedule>({
  scheduleName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  dayOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  isRecurring: {
    type: Boolean,
    required: true,
    default: false
  },
  accessAreas: [{
    type: String,
    trim: true,
    maxlength: 100
  }]
}, { _id: false });

const workOrderSchema = new Schema<IWorkOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: 'Contractor',
    required: true
  },
  siteLocation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  workType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  
  plannedStartTime: {
    type: Date,
    required: true
  },
  plannedEndTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  appliedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'SUBMITTED', 'PENDING_EHS', 'PENDING_MANAGER', 'APPROVED', 'REJECTED', 'RETURNED_TO_APPLICANT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  currentApprovalLevel: {
    type: String,
    required: true,
    enum: ['APPLICANT', 'EHS', 'MANAGER', 'COMPLETED', 'RETURNED'],
    default: 'APPLICANT'
  },
  
  approvalHistory: [approvalRecordSchema],
  finalApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  finalApprovedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  returnedFrom: {
    type: String,
    enum: ['EHS', 'MANAGER', 'ADMIN'],
    trim: true
  },
  returnedAt: {
    type: Date
  },
  
  assignments: [workOrderAssignmentSchema],
  schedules: [workOrderScheduleSchema]
}, {
  timestamps: true
});

// 索引 (orderNumber 已通過 unique: true 自動建立)
workOrderSchema.index({ contractorId: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ currentApprovalLevel: 1 });
workOrderSchema.index({ applicantId: 1 });
workOrderSchema.index({ plannedStartTime: 1 });
workOrderSchema.index({ 'assignments.personId': 1 });

// 驗證：結束時間必須在開始時間之後
workOrderSchema.pre('save', function(next) {
  if (this.plannedEndTime <= this.plannedStartTime) {
    next(new Error('預計結束時間必須在開始時間之後'));
  } else {
    next();
  }
});

export default mongoose.model<IWorkOrder>('WorkOrder', workOrderSchema);