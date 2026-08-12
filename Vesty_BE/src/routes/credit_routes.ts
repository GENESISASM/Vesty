import { Router } from 'express';
import { CreditController } from '../controllers/credit_controller';
import { authMiddleware } from '../middlewares/auth_middlewares';

const router = Router();

const creditRoutes = [
    {
        method: 'get',
        route: '/list',
        middleware: authMiddleware,
        controller: CreditController.list,
    },
    {
        method: 'get',
        route: '/summary',
        middleware: authMiddleware,
        controller: CreditController.getSummary,
    },
    {
        method: 'post',
        route: '/create',
        middleware: authMiddleware,
        controller: CreditController.create,
    },
    {
        method: 'put',
        route: '/update/:id',
        middleware: authMiddleware,
        controller: CreditController.update,
    },
    {
        method: 'post',
        route: '/:id/payment',
        middleware: authMiddleware,
        controller: CreditController.addPayment,
    },
    {
        method: 'delete',
        route: '/delete/:id',
        middleware: authMiddleware,
        controller: CreditController.delete,
    },
];

creditRoutes.forEach(({ method, route, middleware, controller }) => {
    (router as any)[method](route, middleware, controller);
});

export default router;