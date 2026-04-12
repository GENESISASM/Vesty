import { Response } from 'express';
import { DebtService } from '../services/debt_services';
import { responseBuilder } from '../utils/response';
import { AuthRequest } from '../middlewares/auth_middlewares';

export class DebtController {
    static async createDebt(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await DebtService.getService().createDebt(userId, req.body);
            return res.status(201).json(responseBuilder(true, '201', result, 'Debt created'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getAllDebts(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await DebtService.getService().getAllDebts(userId);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getDebtById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await DebtService.getService().getDebtById(userId, id);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(404).json(responseBuilder(false, err.code ?? '404', null, err.message));
        }
    }

    static async updateDebtStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const { status } = req.body;
            const result = await DebtService.getService().updateDebtStatus(userId, id, status);
            return res.status(200).json(responseBuilder(true, '200', result, 'Status updated'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async updateDebt(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            await DebtService.getService().updateDebt(userId, id, req.body);
            return res.status(200).json(responseBuilder(true, '200', null, 'Debt updated successfully'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async addPayment(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await DebtService.getService().addPayment(userId, id, req.body);
            return res.status(201).json(responseBuilder(true, '201', result, 'Payment recorded'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getPayments(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await DebtService.getService().getPayments(userId, id);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async deleteDebt(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            await DebtService.getService().deleteDebt(userId, id);
            return res.status(200).json(responseBuilder(true, '200', null, 'Debt deleted'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getDebtSummary(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await DebtService.getService().getDebtSummary(userId);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }
}