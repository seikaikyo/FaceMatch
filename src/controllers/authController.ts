import { Request, Response } from 'express';
import { User } from '../models';
import { AuthService } from '../utils/auth';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class AuthController {
  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { username, password } = req.body;

      // 查找用戶
      const user = await User.findOne({ username, isActive: true }).populate('contractorId');
      if (!user) {
        res.status(401).json({
          success: false,
          message: '用戶名或密碼錯誤'
        });
        return;
      }

      // 驗證密碼
      const isValidPassword = await AuthService.comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: '用戶名或密碼錯誤'
        });
        return;
      }

      // 更新最後登入時間
      user.lastLoginAt = new Date();
      await user.save();

      // 生成 Token
      const token = AuthService.generateToken(user);

      logger.info(`用戶登入成功: ${username}`, { userId: user._id });

      res.json({
        success: true,
        message: '登入成功',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role,
            contractorId: user.contractorId
          }
        }
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