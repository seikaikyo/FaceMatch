import mongoose, { Schema } from 'mongoose';
import { IContractor } from '../types';

const contractorSchema = new Schema<IContractor>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
    default: 'ACTIVE'
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  contractValidFrom: {
    type: Date,
    required: true
  },
  contractValidTo: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// 索引
contractorSchema.index({ code: 1 });
contractorSchema.index({ status: 1 });
contractorSchema.index({ contractValidTo: 1 });

// 驗證：合約到期日必須在生效日之後
contractorSchema.pre('save', function(next) {
  if (this.contractValidTo <= this.contractValidFrom) {
    next(new Error('合約到期日必須在生效日之後'));
  } else {
    next();
  }
});

export default mongoose.model<IContractor>('Contractor', contractorSchema);