import { Router } from 'express';
import { DebtController } from '../controllers/debt_controller';
import { authMiddleware } from '../middlewares/auth_middlewares';

const router = Router();

const debtRoutes = [
    {
        method: 'get',
        route: '/list',
        middleware: authMiddleware,
        controller: DebtController.getAllDebts,
    },
    {
        method: 'get',
        route: '/summary',
        middleware: authMiddleware,
        controller: DebtController.getDebtSummary,
    },
    {
        method: 'post',
        route: '/create',
        middleware: authMiddleware,
        controller: DebtController.createDebt,
    },
    {
        method: 'get',
        route: '/detail/:id',
        middleware: authMiddleware,
        controller: DebtController.getDebtById,
    },
    {
        method: 'put',
        route: '/update/:id/status',
        middleware: authMiddleware,
        controller: DebtController.updateDebtStatus,
    },
    {
        method: 'post',
        route: '/:id/pay',
        middleware: authMiddleware,
        controller: DebtController.addPayment,
    },
    {
        method: 'get',
        route: '/:id/payments',
        middleware: authMiddleware,
        controller: DebtController.getPayments,
    },
    {
        method: 'delete',
        route: '/delete/:id',
        middleware: authMiddleware,
        controller: DebtController.deleteDebt,
    },
];

debtRoutes.forEach(({ method, route, middleware, controller }) => {
    (router as any)[method](route, middleware, controller);
});

export default router;