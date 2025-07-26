import mongoose, { Schema } from 'mongoose';
import { IContractorPerson } from '../types';

const contractorPersonSchema = new Schema<IContractorPerson>({
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: 'Contractor',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  idNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  faceTemplateId: {
    type: String,
    trim: true
  },
  facePhotoPath: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// 索引
contractorPersonSchema.index({ contractorId: 1 });
contractorPersonSchema.index({ employeeId: 1, contractorId: 1 }, { unique: true });
contractorPersonSchema.index({ idNumber: 1 }, { unique: true });
contractorPersonSchema.index({ status: 1 });
contractorPersonSchema.index({ faceTemplateId: 1 });

export default mongoose.model<IContractorPerson>('ContractorPerson', contractorPersonSchema);