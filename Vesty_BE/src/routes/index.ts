import { Router } from 'express';
import authRouter from './auth_routes';
import financeRouter from './finance_routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/finance', financeRouter);

export default router;