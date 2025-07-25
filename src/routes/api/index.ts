import { Router } from 'express';
import authRouter from './auth';
import contractorsRouter from './contractors';
import personsRouter from './persons';
import qualificationsRouter from './qualifications';

const router = Router();

router.use('/auth', authRouter);
router.use('/contractors', contractorsRouter);
router.use('/persons', personsRouter);
router.use('/qualifications', qualificationsRouter);

export default router;