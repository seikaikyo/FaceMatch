import { Router } from 'express';
import qualificationRoutes from './qualifications';

const router = Router();

// 年度資格管理路由
router.use('/qualifications', qualificationRoutes);

export default router;