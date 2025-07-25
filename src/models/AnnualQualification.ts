import mongoose, { Schema } from 'mongoose';
import { IAnnualQualification, IRenewalRecord } from '../types';

const renewalRecordSchema = new Schema<IRenewalRecord>({
  oldValidTo: {
    type: Date,
    required: true
  },
  newValidTo: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  approvedBy: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }
}, { _id: false });

const annualQualificationSchema = new Schema<IAnnualQualification>({
  personId: {
    type: Schema.Types.ObjectId,
    ref: 'ContractorPerson',
    required: true
  },
  qualificationType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  trainingDate: {
    type: Date,
    required: true
  },
  certificationDate: {
    type: Date,
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['VALID', 'EXPIRED', 'REVOKED'],
    default: 'VALID'
  },
  certificateNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  renewalHistory: [renewalRecordSchema]
}, {
  timestamps: true
});

// 索引
annualQualificationSchema.index({ personId: 1 });
annualQualificationSchema.index({ qualificationType: 1 });
annualQualificationSchema.index({ status: 1 });
annualQualificationSchema.index({ validTo: 1 });
annualQualificationSchema.index({ personId: 1, qualificationType: 1 });

// 驗證：資格到期日必須在生效日之後
annualQualificationSchema.pre('save', function(next) {
  if (this.validTo <= this.validFrom) {
    next(new Error('資格到期日必須在生效日之後'));
  } else {
    next();
  }
});

// 方法：檢查資格是否有效
annualQualificationSchema.methods.isValidAt = function(date: Date = new Date()): boolean {
  return this.status === 'VALID' && 
         this.validFrom <= date && 
         this.validTo >= date;
};

// 方法：獲取剩餘天數
annualQualificationSchema.methods.getDaysRemaining = function(fromDate: Date = new Date()): number {
  if (this.validTo < fromDate) return 0;
  return Math.ceil((this.validTo.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
};

export default mongoose.model<IAnnualQualification>('AnnualQualification', annualQualificationSchema);