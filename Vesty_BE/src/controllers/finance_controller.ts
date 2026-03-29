import { Response } from 'express';
import { FinanceService } from '../services/finance_services';
import { responseBuilder } from '../utils/response';
import { AuthRequest } from '../middlewares/auth_middlewares';

export class FinanceController {
  static async createFinance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const payload = req.body;
      const result = await FinanceService.getService().createFinance(userId, payload);
      return res.status(201).json(responseBuilder(true, '201', result, 'Finance record created'));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }

  static async getAllFinances(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await FinanceService.getService().getAllFinances(userId);
      return res.status(200).json(responseBuilder(true, '200', result));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }

  static async getFinanceById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const result = await FinanceService.getService().getFinanceById(userId, id);
      return res.status(200).json(responseBuilder(true, '200', result));
    } catch (err: any) {
      return res.status(404).json(responseBuilder(false, err.code ?? '404', null, err.message));
    }
  }

  static async updateFinance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const payload = req.body;
      const result = await FinanceService.getService().updateFinance(userId, id, payload);
      return res.status(200).json(responseBuilder(true, '200', result, 'Finance record updated'));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }

  static async deleteFinance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      await FinanceService.getService().deleteFinance(userId, id);
      return res.status(200).json(responseBuilder(true, '200', null, 'Finance record deleted'));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }

  static async getFinanceSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await FinanceService.getService().getFinanceSummary(userId);
      return res.status(200).json(responseBuilder(true, '200', result));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }
}