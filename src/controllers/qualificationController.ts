import { Request, Response } from 'express';
import { AnnualQualification } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

export class QualificationController {
  static async getQualifications(req: Request, res: Response<PaginatedResponse<any> | ApiResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const qualificationType = req.query.qualificationType as string;
      const personId = req.query.personId as string;

      const filter: any = {};
      if (status) filter.status = status;
      if (qualificationType) filter.qualificationType = qualificationType;
      if (personId) filter.personId = personId;

      const skip = (page - 1) * limit;
      const total = await AnnualQualification.countDocuments(filter);
      const qualifications = await AnnualQualification.find(filter)
        .populate('personId', 'name employeeId contractorId')
        .populate({
          path: 'personId',
          populate: {
            path: 'contractorId',
            select: 'name code'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        message: '獲取資格列表成功',
        data: qualifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('獲取資格列表失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取資格列表失敗'
      });
    }
  }

  static async getQualification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const qualification = await AnnualQualification.findById(req.params.id)
        .populate('personId', 'name employeeId contractorId')
        .populate({
          path: 'personId',
          populate: {
            path: 'contractorId',
            select: 'name code'
          }
        });
      
      if (!qualification) {
        res.status(404).json({
          success: false,
          message: '資格不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取資格成功',
        data: qualification
      });
    } catch (error) {
      logger.error('獲取資格失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取資格失敗'
      });
    }
  }

  static async createQualification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const qualification = new AnnualQualification(req.body);
      await qualification.save();
      await qualification.populate('personId', 'name employeeId contractorId');

      logger.info(`建立資格: ${qualification.qualificationType}`, { 
        qualificationId: qualification._id,
        personId: qualification.personId,
        createdBy: req.user!._id 
      });

      res.status(201).json({
        success: true,
        message: '建立資格成功',
        data: qualification
      });
    } catch (error) {
      logger.error('建立資格失敗:', error);
      res.status(500).json({
        success: false,
        message: '建立資格失敗'
      });
    }
  }

  static async updateQualification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const qualification = await AnnualQualification.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('personId', 'name employeeId contractorId');

      if (!qualification) {
        res.status(404).json({
          success: false,
          message: '資格不存在'
        });
        return;
      }

      logger.info(`更新資格: ${qualification.qualificationType}`, { 
        qualificationId: qualification._id,
        updatedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '更新資格成功',
        data: qualification
      });
    } catch (error) {
      logger.error('更新資格失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新資格失敗'
      });
    }
  }

  static async deleteQualification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const qualification = await AnnualQualification.findByIdAndDelete(req.params.id);

      if (!qualification) {
        res.status(404).json({
          success: false,
          message: '資格不存在'
        });
        return;
      }

      logger.info(`刪除資格: ${qualification.qualificationType}`, { 
        qualificationId: qualification._id,
        deletedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '刪除資格成功'
      });
    } catch (error) {
      logger.error('刪除資格失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除資格失敗'
      });
    }
  }

  static async renewQualification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { newValidTo, reason, approvedBy } = req.body;
      
      const qualification = await AnnualQualification.findById(req.params.id);
      if (!qualification) {
        res.status(404).json({
          success: false,
          message: '資格不存在'
        });
        return;
      }

      // 記錄展延歷史
      qualification.renewalHistory.push({
        oldValidTo: qualification.validTo,
        newValidTo: new Date(newValidTo),
        renewalDate: new Date(),
        reason,
        approvedBy
      });

      // 更新資格到期日
      qualification.validTo = new Date(newValidTo);
      qualification.status = 'VALID';
      
      await qualification.save();

      logger.info(`資格展延: ${qualification.qualificationType}`, { 
        qualificationId: qualification._id,
        newValidTo,
        renewedBy: req.user!._id 
      });

      res.json({
        success: true,
        message: '資格展延成功',
        data: qualification
      });
    } catch (error) {
      logger.error('資格展延失敗:', error);
      res.status(500).json({
        success: false,
        message: '資格展延失敗'
      });
    }
  }

  static async batchCheckQualifications(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { personIds, checkDate } = req.body;
      const date = checkDate ? new Date(checkDate) : new Date();

      const results = await Promise.all(
        personIds.map(async (personId: string) => {
          const qualifications = await AnnualQualification.find({
            personId,
            status: 'VALID'
          }).populate('personId', 'name employeeId');

          const validQualifications = qualifications.filter(q => 
            q.status === 'VALID' && q.validFrom <= date && q.validTo >= date
          );
          const expiredQualifications = qualifications.filter(q => 
            q.status !== 'VALID' || q.validFrom > date || q.validTo < date
          );

          return {
            personId,
            personInfo: qualifications[0]?.personId,
            validQualifications: validQualifications.length,
            expiredQualifications: expiredQualifications.length,
            qualificationDetails: qualifications.map(q => ({
              id: q._id,
              type: q.qualificationType,
              validTo: q.validTo,
              isValid: q.status === 'VALID' && q.validFrom <= date && q.validTo >= date,
              daysRemaining: q.validTo < date ? 0 : Math.ceil((q.validTo.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
            }))
          };
        })
      );

      const summary = {
        total: results.length,
        valid: results.filter(r => r.expiredQualifications === 0).length,
        expired: results.filter(r => r.expiredQualifications > 0).length,
        notFound: results.filter(r => r.validQualifications === 0 && r.expiredQualifications === 0).length
      };

      res.json({
        success: true,
        message: '批次資格檢核完成',
        data: {
          results,
          summary,
          checkDate: date
        }
      });
    } catch (error) {
      logger.error('批次資格檢核失敗:', error);
      res.status(500).json({
        success: false,
        message: '批次資格檢核失敗'
      });
    }
  }
}