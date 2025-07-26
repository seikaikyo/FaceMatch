import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

// 模擬承攬商資料
interface MockContractor {
  _id: string;
  code: string;
  name: string;
  businessNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  contractStartDate: Date;
  contractEndDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 測試資料陣列
let mockContractors: MockContractor[] = [
  {
    _id: '1',
    code: 'CT001',
    name: '台積電承攬商',
    businessNumber: '12345678',
    contactPerson: '張三',
    phone: '02-1234-5678',
    email: 'tsmc@contractor.com',
    address: '新竹科學園區',
    status: 'ACTIVE',
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    description: '半導體設備維護',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    code: 'CT002',
    name: '聯發科承攬商',
    businessNumber: '87654321',
    contactPerson: '李四',
    phone: '03-9876-5432',
    email: 'mtk@contractor.com',
    address: '新竹科學園區',
    status: 'ACTIVE',
    contractStartDate: new Date('2024-02-01'),
    contractEndDate: new Date('2025-01-31'),
    description: 'IC設計服務',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    _id: '3',
    code: 'CT003',
    name: '富士康承攬商',
    businessNumber: '11223344',
    contactPerson: '王五',
    phone: '04-1111-2222',
    email: 'foxconn@contractor.com',
    address: '台中科學園區',
    status: 'INACTIVE',
    contractStartDate: new Date('2023-06-01'),
    contractEndDate: new Date('2024-05-31'),
    description: '組裝代工服務',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-15')
  }
];

let nextId = 4;

export class ContractorController {
  static async getContractors(req: Request, res: Response<PaginatedResponse<any>>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      // 過濾資料
      let filteredContractors = [...mockContractors];
      
      if (status) {
        filteredContractors = filteredContractors.filter(c => c.status === status);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredContractors = filteredContractors.filter(c => 
          c.name.toLowerCase().includes(searchLower) || 
          c.code.toLowerCase().includes(searchLower)
        );
      }

      // 排序
      filteredContractors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // 分頁
      const total = filteredContractors.length;
      const skip = (page - 1) * limit;
      const contractors = filteredContractors.slice(skip, skip + limit);

      res.json({
        success: true,
        message: '獲取承攬商列表成功',
        data: contractors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('獲取承攬商列表失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取承攬商列表失敗',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    }
  }

  static async getContractor(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const contractor = mockContractors.find(c => c._id === req.params.id);
      
      if (!contractor) {
        res.status(404).json({
          success: false,
          message: '承攬商不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取承攬商成功',
        data: contractor
      });
    } catch (error) {
      logger.error('獲取承攬商失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取承攬商失敗'
      });
    }
  }

  static async createContractor(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const now = new Date();
      const newContractor: MockContractor = {
        _id: nextId.toString(),
        code: req.body.code,
        name: req.body.name,
        businessNumber: req.body.businessNumber,
        contactPerson: req.body.contactPerson,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        status: req.body.status || 'ACTIVE',
        contractStartDate: new Date(req.body.contractStartDate),
        contractEndDate: new Date(req.body.contractEndDate),
        description: req.body.description,
        createdAt: now,
        updatedAt: now
      };

      mockContractors.push(newContractor);
      nextId++;

      logger.info(`建立承攬商: ${newContractor.name}`, { 
        contractorId: newContractor._id,
        createdBy: req.user?._id 
      });

      res.status(201).json({
        success: true,
        message: '建立承攬商成功',
        data: newContractor
      });
    } catch (error) {
      logger.error('建立承攬商失敗:', error);
      res.status(500).json({
        success: false,
        message: '建立承攬商失敗'
      });
    }
  }

  static async updateContractor(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const contractorIndex = mockContractors.findIndex(c => c._id === req.params.id);
      
      if (contractorIndex === -1) {
        res.status(404).json({
          success: false,
          message: '承攬商不存在'
        });
        return;
      }

      const contractor = mockContractors[contractorIndex];
      const updatedContractor = {
        ...contractor,
        ...req.body,
        _id: contractor._id, // 保持原始 ID
        createdAt: contractor.createdAt, // 保持原始建立時間
        updatedAt: new Date()
      };

      mockContractors[contractorIndex] = updatedContractor;

      logger.info(`更新承攬商: ${updatedContractor.name}`, { 
        contractorId: updatedContractor._id,
        updatedBy: req.user?._id 
      });

      res.json({
        success: true,
        message: '更新承攬商成功',
        data: updatedContractor
      });
    } catch (error) {
      logger.error('更新承攬商失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新承攬商失敗'
      });
    }
  }

  static async deleteContractor(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const contractorIndex = mockContractors.findIndex(c => c._id === req.params.id);

      if (contractorIndex === -1) {
        res.status(404).json({
          success: false,
          message: '承攬商不存在'
        });
        return;
      }

      const contractor = mockContractors[contractorIndex];
      mockContractors.splice(contractorIndex, 1);

      logger.info(`刪除承攬商: ${contractor.name}`, { 
        contractorId: contractor._id,
        deletedBy: req.user?._id 
      });

      res.json({
        success: true,
        message: '刪除承攬商成功'
      });
    } catch (error) {
      logger.error('刪除承攬商失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除承攬商失敗'
      });
    }
  }
}