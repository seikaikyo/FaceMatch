import { Request, Response } from 'express';
import { Contractor } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

export class ContractorController {
  static async getContractors(req: Request, res: Response<PaginatedResponse<any> | ApiResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const total = await Contractor.countDocuments(filter);
      const contractors = await Contractor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

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
        message: '獲取承攬商列表失敗'
      });
    }
  }

  static async getContractor(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const contractor = await Contractor.findById(req.params.id);
      
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
      const contractor = new Contractor(req.body);
      await contractor.save();

      logger.info(`建立承攬商: ${contractor.name}`, { 
        contractorId: contractor._id,
        createdBy: req.user!._id 
      });

      res.status(201).json({
        success: true,
        message: '建立承攬商成功',
        data: contractor
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
      const contractor = await Contractor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!contractor) {
        res.status(404).json({
          success: false,
          message: '承攬商不存在'
        });
        return;
      }

      logger.info(`更新承攬商: ${contractor.name}`, { 
        contractorId: contractor._id,
        updatedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '更新承攬商成功',
        data: contractor
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
      const contractor = await Contractor.findByIdAndDelete(req.params.id);

      if (!contractor) {
        res.status(404).json({
          success: false,
          message: '承攬商不存在'
        });
        return;
      }

      logger.info(`刪除承攬商: ${contractor.name}`, { 
        contractorId: contractor._id,
        deletedBy: req.user!._id 
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