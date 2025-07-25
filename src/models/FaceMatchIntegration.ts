import mongoose, { Schema } from 'mongoose';
import { IFaceMatchIntegration, IPersonSyncStatus } from '../types';

const personSyncStatusSchema = new Schema<IPersonSyncStatus>({
  personId: {
    type: Schema.Types.ObjectId,
    ref: 'ContractorPerson',
    required: true
  },
  faceMatchPersonId: {
    type: String,
    trim: true
  },
  syncStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  qualificationStatus: {
    type: String,
    required: true,
    enum: ['VALID', 'EXPIRED', 'NOT_FOUND'],
    default: 'NOT_FOUND'
  },
  isActive: {
    type: Boolean,
    required: true,
    default: false
  },
  lastSyncAt: {
    type: Date
  },
  syncErrorMessage: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, { _id: false });

const faceMatchIntegrationSchema = new Schema<IFaceMatchIntegration>({
  workOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    unique: true
  },
  integrationStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'PARTIAL'],
    default: 'PENDING'
  },
  lastSyncAt: {
    type: Date
  },
  syncAttempts: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  faceMatchEventSourceId: {
    type: String,
    trim: true
  },
  faceMatchPermissionId: {
    type: String,
    trim: true
  },
  faceMatchScheduleId: {
    type: String,
    trim: true
  },
  
  personSyncStatuses: [personSyncStatusSchema]
}, {
  timestamps: true
});

// 索引
faceMatchIntegrationSchema.index({ workOrderId: 1 });
faceMatchIntegrationSchema.index({ integrationStatus: 1 });
faceMatchIntegrationSchema.index({ lastSyncAt: 1 });
faceMatchIntegrationSchema.index({ 'personSyncStatuses.personId': 1 });
faceMatchIntegrationSchema.index({ 'personSyncStatuses.syncStatus': 1 });

export default mongoose.model<IFaceMatchIntegration>('FaceMatchIntegration', faceMatchIntegrationSchema);