import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface IContractor {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

interface ContractorCreationAttributes extends Optional<IContractor, 'id' | 'createdAt' | 'updatedAt'> {}

class Contractor extends Model<IContractor, ContractorCreationAttributes> implements IContractor {
  public id!: number;
  public name!: string;
  public contact!: string;
  public phone!: string;
  public email?: string;
  public address?: string;
  public status!: 'ACTIVE' | 'INACTIVE';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contractor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        len: [1, 20],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
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
    modelName: 'Contractor',
    tableName: 'contractors',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['name'],
      },
    ],
  }
);

export default Contractor;