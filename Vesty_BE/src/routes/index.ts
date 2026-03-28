import { Router } from 'express';
import authRouter from './auth_routes';

const router = Router();

router.use('/auth', authRouter);

export default router;