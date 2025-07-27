import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';

interface IUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  department?: string;
  role: 'ADMIN' | 'EHS' | 'MANAGER' | 'CONTRACTOR';
  isActive: boolean;
  jobTitle?: string;
  phoneNumber?: string;
  employeeId?: string;
  approvalLevel?: number;
  canApprove: boolean;
  authType: 'LOCAL' | 'AD';
  lastLogin?: Date;
  contractorId?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<IUser, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<IUser, UserCreationAttributes> implements IUser {
  public id!: number;
  public username!: string;
  public email!: string;
  public passwordHash!: string;
  public displayName!: string;
  public department?: string;
  public role!: 'ADMIN' | 'EHS' | 'MANAGER' | 'CONTRACTOR';
  public isActive!: boolean;
  public jobTitle?: string;
  public phoneNumber?: string;
  public employeeId?: string;
  public approvalLevel?: number;
  public canApprove!: boolean;
  public authType!: 'LOCAL' | 'AD';
  public lastLogin?: Date;
  public contractorId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 隱藏密碼的 JSON 序列化
  public toJSON(): object {
    const values = { ...this.get() } as any;
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'EHS', 'MANAGER', 'CONTRACTOR'),
      allowNull: false,
      defaultValue: 'CONTRACTOR',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    employeeId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    approvalLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    canApprove: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    authType: {
      type: DataTypes.ENUM('LOCAL', 'AD'),
      allowNull: false,
      defaultValue: 'LOCAL',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'contractors',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['role'],
      },
      {
        fields: ['contractorId'],
      },
      {
        fields: ['employeeId'],
        unique: true,
        where: {
          employeeId: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);

export default User;