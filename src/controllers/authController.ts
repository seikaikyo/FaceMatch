import { Request, Response } from 'express';
import { User } from '../models';
import { AuthService } from '../utils/auth';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class AuthController {
  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { username, password } = req.body;

      // 簡化測試用驗證
      if (username === 'admin' && password === 'admin123') {
        const testUser = {
          _id: '1',
          username: 'admin',
          name: '系統管理員',
          role: 'ADMIN',
          lastLoginAt: new Date()
        };

        const token = 'test-token-12345';

        res.json({
          success: true,
          message: '登入成功',
          data: {
            token,
            user: {
              id: testUser._id,
              username: testUser.username,
              name: testUser.name,
              role: testUser.role
            }
          }
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: '用戶名或密碼錯誤'
      });
    } catch (error) {
      logger.error('登入失敗:', error);
      res.status(500).json({
        success: false,
        message: '登入失敗'
      });
    }
  }

  static async getProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = await User.findById(req.user!._id)
        .populate('contractorId')
        .select('-passwordHash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲取用戶資料成功',
        data: user
      });
    } catch (error) {
      logger.error('獲取用戶資料失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取用戶資料失敗'
      });
    }
  }

  static async updateProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { name, email } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user!._id,
        { name, email },
        { new: true, runValidators: true }
      ).select('-passwordHash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在'
        });
        return;
      }

      logger.info(`用戶更新個人資料: ${user.username}`, { userId: user._id });

      res.json({
        success: true,
        message: '更新用戶資料成功',
        data: user
      });
    } catch (error) {
      logger.error('更新用戶資料失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新用戶資料失敗'
      });
    }
  }

  static async changePassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在'
        });
        return;
      }

      // 驗證目前密碼
      const isValidPassword = await AuthService.comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: '目前密碼錯誤'
        });
        return;
      }

      // 更新密碼
      user.passwordHash = await AuthService.hashPassword(newPassword);
      await user.save();

      logger.info(`用戶變更密碼: ${user.username}`, { userId: user._id });

      res.json({
        success: true,
        message: '密碼變更成功'
      });
    } catch (error) {
      logger.error('變更密碼失敗:', error);
      res.status(500).json({
        success: false,
        message: '變更密碼失敗'
      });
    }
  }
}