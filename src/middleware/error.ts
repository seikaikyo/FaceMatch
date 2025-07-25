import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { config } from '../config';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  logger.error('未處理的錯誤:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user
  });

  // MongoDB 重複鍵錯誤
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    res.status(400).json({
      success: false,
      message: '資料重複，請檢查輸入內容'
    });
    return;
  }

  // MongoDB 驗證錯誤
  if (error.name === 'ValidationError') {
    const messages = Object.values((error as any).errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      errors: messages
    });
    return;
  }

  // JWT 錯誤
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: '無效的認證 Token'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: '認證 Token 已過期'
    });
    return;
  }

  // 預設錯誤處理
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? '伺服器內部錯誤' : error.message
  });
};

export const notFound = (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源'
  });
};