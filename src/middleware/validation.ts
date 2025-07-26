import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: error.details.map(detail => detail.message)
      });
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: '查詢參數驗證失敗',
        errors: error.details.map(detail => detail.message)
      });
      return;
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: '路徑參數驗證失敗',
        errors: error.details.map(detail => detail.message)
      });
      return;
    }
    
    next();
  };
};