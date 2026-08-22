import { Router } from 'express';
import { FinanceController } from '../controllers/finance_controller';
import { authMiddleware } from '../middlewares/auth_middlewares';
import { validate } from '../middlewares/validate_middleware';
import { createFinanceSchema } from '../validators/finance_validator'; 

const router = Router();
const financeRoutes = [
  {
    method: 'post',
    route: '/create',
    middleware: [authMiddleware, validate(createFinanceSchema)],
    controller: FinanceController.createFinance,
  },
  {
    method: 'get',
    route: '/list',
    middleware: [authMiddleware],
    controller: FinanceController.getAllFinances,
  },
  {
    method: 'get',
    route: '/summary',
    middleware: [authMiddleware],
    controller: FinanceController.getFinanceSummary,
  },
  {
    method: 'get',
    route: '/detail/:id',
    middleware: [authMiddleware],
    controller: FinanceController.getFinanceById,
  },
  {
    method: 'put',
    route: '/update/:id',
    middleware: [authMiddleware, validate(createFinanceSchema)],
    controller: FinanceController.updateFinance,
  },
  {
    method: 'delete',
    route: '/delete/:id',
    middleware: [authMiddleware],
    controller: FinanceController.deleteFinance,
  },
  {
    method: 'get',
    route: '/dashboardData',
    middleware: [authMiddleware], 
    controller: FinanceController.getForDashboard,
  }
];

financeRoutes.forEach(({ method, route, middleware, controller }) => {
  (router as any)[method](route, ...middleware, controller);
});

export default router;