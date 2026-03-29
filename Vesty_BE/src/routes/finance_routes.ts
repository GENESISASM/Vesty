import { Router } from 'express';
import { FinanceController } from '../controllers/finance_controller';
import { authMiddleware } from '../middlewares/auth_middlewares';

const router = Router();
const financeRoutes = [
  {
    method: 'post',
    route: '/create',
    middleware: authMiddleware,
    controller: FinanceController.createFinance,
  },
  {
    method: 'get',
    route: '/list',
    middleware: authMiddleware,
    controller: FinanceController.getAllFinances,
  },
  {
    method: 'get',
    route: '/summary',
    middleware: authMiddleware,
    controller: FinanceController.getFinanceSummary,
  },
  {
    method: 'get',
    route: '/detail/:id',
    middleware: authMiddleware,
    controller: FinanceController.getFinanceById,
  },
  {
    method: 'put',
    route: '/update/:id',
    middleware: authMiddleware,
    controller: FinanceController.updateFinance,
  },
  {
    method: 'delete',
    route: '/delete/:id',
    middleware: authMiddleware,
    controller: FinanceController.deleteFinance,
  },
];

financeRoutes.forEach(({ method, route, middleware, controller }) => {
  (router as any)[method](route, middleware, controller);
});

export default router;