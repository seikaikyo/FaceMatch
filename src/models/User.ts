import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    required: true,
    enum: ['CONTRACTOR', 'EHS', 'MANAGER', 'ADMIN'],
    default: 'CONTRACTOR'
  },
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: 'Contractor',
    required: function(this: IUser) {
      return this.role === 'CONTRACTOR';
    }
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 索引 (username 和 email 已通過 unique: true 自動建立)
userSchema.index({ role: 1 });
userSchema.index({ contractorId: 1 });

// 虛擬欄位 - 隱藏密碼
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    const { passwordHash, ...rest } = ret;
    return rest;
  }
});

export default mongoose.model<IUser>('User', userSchema);