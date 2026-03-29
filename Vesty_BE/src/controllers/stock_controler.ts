import { Response } from 'express';
import { StockService } from '../services/stock_services';
import { responseBuilder } from '../utils/response';
import { AuthRequest } from '../middlewares/auth_middlewares';

export class StockController {
    static async createStock(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const payload = req.body;
            const result = await StockService.getService().createStock(userId, payload);
            return res.status(201).json(responseBuilder(true, '201', result, 'Stock created'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getAllStocks(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await StockService.getService().getAllStocks(userId);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getStockById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await StockService.getService().getStockById(userId, id);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(404).json(responseBuilder(false, err.code ?? '404', null, err.message));
        }
    }

    static async updateStock(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const payload = req.body;
            const result = await StockService.getService().updateStock(userId, id, payload);
            return res.status(200).json(responseBuilder(true, '200', result, 'Stock updated'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async deleteStock(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            await StockService.getService().deleteStock(userId, id);
            return res.status(200).json(responseBuilder(true, '200', null, 'Stock deleted'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async stockIn(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const payload = req.body;
            const result = await StockService.getService().stockIn(userId, id, payload);
            return res.status(201).json(responseBuilder(true, '201', result, 'Stock in recorded'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async stockOut(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const payload = req.body;
            const result = await StockService.getService().stockOut(userId, id, payload);
            return res.status(201).json(responseBuilder(true, '201', result, 'Stock out recorded'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getStockHistory(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await StockService.getService().getStockHistory(userId, id);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }
}