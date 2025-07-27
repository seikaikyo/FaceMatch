import { Router } from 'express';
import qualificationRoutes from './qualifications';
import configRoutes from './config';
import logsRoutes from './logs';
import usersRoutes from './users';
import contractorsRoutes from './contractors';
import workOrdersRoutes from './work-orders';
import approvalsRoutes from './approvals';
import authRoutes from './auth';

const router = Router();

// 認證管理路由
router.use('/', authRoutes);

// 配置管理路由
router.use('/', configRoutes);

// 日誌管理路由  
router.use('/logs', logsRoutes);

// 用戶管理路由
router.use('/users', usersRoutes);

// 承攬商管理路由
router.use('/contractors', contractorsRoutes);

// 施工單管理路由
router.use('/work-orders', workOrdersRoutes);

// 簽核管理路由
router.use('/approvals', approvalsRoutes);

// 年度資格管理路由
router.use('/qualifications', qualificationRoutes);

export default router;