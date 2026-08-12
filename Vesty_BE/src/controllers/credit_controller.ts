import { Response } from 'express';
import { CreditService } from '../services/credit_services';
import { responseBuilder } from '../utils/response';
import { AuthRequest } from '../middlewares/auth_middlewares';

export class CreditController {
    static async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await CreditService.getService().createCredit(userId, req.body);
            return res.status(201).json(responseBuilder(true, '201', result, 'Credit created successfully'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await CreditService.getService().getAllCredits(userId);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            await CreditService.getService().updateCredit(userId, id, req.body);
            return res.status(200).json(responseBuilder(true, '200', null, 'Credit updated successfully'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async addPayment(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const result = await CreditService.getService().addPayment(userId, id, req.body);
            return res.status(201).json(responseBuilder(true, '201', result, 'Payment recorded'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            await CreditService.getService().deleteCredit(userId, id);
            return res.status(200).json(responseBuilder(true, '200', null, 'Credit deleted'));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }

    static async getSummary(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const result = await CreditService.getService().getSummary(userId);
            return res.status(200).json(responseBuilder(true, '200', result));
        } catch (err: any) {
            return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
        }
    }
}