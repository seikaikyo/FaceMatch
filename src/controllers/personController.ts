import { Request, Response } from 'express';
import { ContractorPerson, AnnualQualification } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

export class PersonController {
  static async getPersons(req: Request, res: Response<PaginatedResponse<any> | ApiResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const contractorId = req.query.contractorId as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};
      if (contractorId) filter.contractorId = contractorId;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
          { idNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const total = await ContractorPerson.countDocuments(filter);
      const persons = await ContractorPerson.find(filter)
        .populate('contractorId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        message: '獲取人員列表成功',
        data: persons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('獲取人員列表失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取人員列表失敗'
      });
    }
  }

  static async getPerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const person = await ContractorPerson.findById(req.params.id)
        .populate('contractorId', 'name code');
      
      if (!person) {
        res.status(404).json({
          success: false,
          message: '人員不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取人員成功',
        data: person
      });
    } catch (error) {
      logger.error('獲取人員失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取人員失敗'
      });
    }
  }

  static async createPerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const person = new ContractorPerson(req.body);
      await person.save();
      await person.populate('contractorId', 'name code');

      logger.info(`建立人員: ${person.name}`, { 
        personId: person._id,
        contractorId: person.contractorId,
        createdBy: req.user!._id 
      });

      res.status(201).json({
        success: true,
        message: '建立人員成功',
        data: person
      });
    } catch (error) {
      logger.error('建立人員失敗:', error);
      res.status(500).json({
        success: false,
        message: '建立人員失敗'
      });
    }
  }

  static async updatePerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const person = await ContractorPerson.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('contractorId', 'name code');

      if (!person) {
        res.status(404).json({
          success: false,
          message: '人員不存在'
        });
        return;
      }

      logger.info(`更新人員: ${person.name}`, { 
        personId: person._id,
        updatedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '更新人員成功',
        data: person
      });
    } catch (error) {
      logger.error('更新人員失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新人員失敗'
      });
    }
  }

  static async deletePerson(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const person = await ContractorPerson.findByIdAndDelete(req.params.id);

      if (!person) {
        res.status(404).json({
          success: false,
          message: '人員不存在'
        });
        return;
      }

      // 同時刪除相關的年度資格
      await AnnualQualification.deleteMany({ personId: person._id });

      logger.info(`刪除人員: ${person.name}`, { 
        personId: person._id,
        deletedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '刪除人員成功'
      });
    } catch (error) {
      logger.error('刪除人員失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除人員失敗'
      });
    }
  }

  static async getPersonQualifications(req: Request, res: Response<PaginatedResponse<any> | ApiResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const filter: any = { personId: req.params.id };
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const total = await AnnualQualification.countDocuments(filter);
      const qualifications = await AnnualQualification.find(filter)
        .populate('personId', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        message: '獲取人員資格列表成功',
        data: qualifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('獲取人員資格列表失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取人員資格列表失敗'
      });
    }
  }
}