import { Router } from 'express';
import authRouter from './auth';
import contractorsRouter from './contractors';
import personsRouter from './persons';
import qualificationsRouter from './qualifications';
import workOrdersRouter from './workOrders';
import approvalsRouter from './approvals';
import faceMatchRouter from './faceMatch';

const router = Router();

router.use('/auth', authRouter);
router.use('/contractors', contractorsRouter);
router.use('/persons', personsRouter);
router.use('/qualifications', qualificationsRouter);
router.use('/work-orders', workOrdersRouter);
router.use('/approvals', approvalsRouter);
router.use('/facematch', faceMatchRouter);

export default router;