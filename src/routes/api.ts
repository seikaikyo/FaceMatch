import { Router } from 'express';
import qualificationRoutes from './qualifications';
import configRoutes from './config';
import logsRoutes from './logs';

const router = Router();

// 配置管理路由
router.use('/', configRoutes);

// 日誌管理路由  
router.use('/logs', logsRoutes);

// 年度資格管理路由
router.use('/qualifications', qualificationRoutes);

export default router;