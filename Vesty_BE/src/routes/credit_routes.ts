import { Router } from 'express';
import { CreditController } from '../controllers/credit_controller';
import { authMiddleware } from '../middlewares/auth_middlewares';
import { validate } from '../middlewares/validate_middleware';
import { createCreditSchema } from '../validators/credit_validator';

const router = Router();

const creditRoutes = [
    {
        method: 'get',
        route: '/list',
        middleware: [authMiddleware],
        controller: CreditController.list,
    },
    {
        method: 'get',
        route: '/summary',
        middleware: [authMiddleware],
        controller: CreditController.getSummary,
    },
    {
        method: 'post',
        route: '/create',
        middleware: [authMiddleware, validate(createCreditSchema)],
        controller: CreditController.create,
    },
    {
        method: 'put',
        route: '/update/:id',
        middleware: [authMiddleware, validate(createCreditSchema)],
        controller: CreditController.update,
    },
    {
        method: 'post',
        route: '/:id/payment',
        middleware: [authMiddleware],
        controller: CreditController.addPayment,
    },
    {
        method: 'delete',
        route: '/delete/:id',
        middleware: [authMiddleware],
        controller: CreditController.delete,
    },
];

creditRoutes.forEach(({ method, route, middleware, controller }) => {
    (router as any)[method](route, ...middleware, controller);
});

export default router;