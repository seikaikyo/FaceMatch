import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { AuthService, JWTPayload } from '../utils/auth';
import { ApiResponse } from '../types';

// 擴展 Express Request 介面
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        role: string;
        contractorId?: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthService.extractTokenFromRequest(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供認證 Token'
      });
      return;
    }

    const payload: JWTPayload = AuthService.verifyToken(token);
    
    // 驗證用戶是否仍然存在且為活躍狀態
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: '用戶不存在或已被停用'
      });
      return;
    }

    // 將用戶資訊附加到請求中
    req.user = {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
      contractorId: user.contractorId?.toString()
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '無效的認證 Token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未認證的請求'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '權限不足'
      });
      return;
    }

    next();
  };
};

export const requireContractorAccess = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '未認證的請求'
    });
    return;
  }

  // 管理員可以存取任何承攬商資料
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // 承攬商用戶只能存取自己的資料
  if (req.user.role === 'CONTRACTOR') {
    const contractorId = req.params.contractorId || req.body.contractorId;
    if (contractorId && contractorId !== req.user.contractorId) {
      res.status(403).json({
        success: false,
        message: '無權存取其他承攬商的資料'
      });
      return;
    }
  }

  next();
};