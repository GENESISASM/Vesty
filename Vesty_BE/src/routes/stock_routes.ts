import { Router } from 'express';
import { StockController } from '../controllers/stock_controler';
import { authMiddleware } from '../middlewares/auth_middlewares';

const router = Router();

const stockRoutes = [
  {
    method: 'post',
    route: '/create',
    middleware: authMiddleware,
    controller: StockController.createStock,
  },
  {
    method: 'get',
    route: '/list',
    middleware: authMiddleware,
    controller: StockController.getAllStocks,
  },
  {
    method: 'get',
    route: '/detail/:id',
    middleware: authMiddleware,
    controller: StockController.getStockById,
  },
  {
    method: 'put',
    route: '/update/:id',
    middleware: authMiddleware,
    controller: StockController.updateStock,
  },
  {
    method: 'delete',
    route: '/delete/:id',
    middleware: authMiddleware,
    controller: StockController.deleteStock,
  },
  {
    method: 'post',
    route: '/:id/in',
    middleware: authMiddleware,
    controller: StockController.stockIn,
  },
  {
    method: 'post',
    route: '/:id/out',
    middleware: authMiddleware,
    controller: StockController.stockOut,
  },
  {
    method: 'get',
    route: '/:id/history',
    middleware: authMiddleware,
    controller: StockController.getStockHistory,
  },
];

stockRoutes.forEach(({ method, route, middleware, controller }) => {
  (router as any)[method](route, middleware, controller);
});

export default router;