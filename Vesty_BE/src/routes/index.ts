import { Router } from 'express';
import authRouter from './auth_routes';
import financeRouter from './finance_routes';
import stockRouter from './stock_routes';
import debtRouter from './debt_routes';
import creditRoutes from './credit_routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/finance', financeRouter);
router.use('/stock', stockRouter);
router.use('/debt', debtRouter);
router.use('/credit', creditRoutes);

export default router;