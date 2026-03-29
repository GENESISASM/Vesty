import { Router } from 'express';
import authRouter from './auth_routes';
import financeRouter from './finance_routes';
import stockRouter from './stock_routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/finance', financeRouter);
router.use('/stock', stockRouter);

export default router;