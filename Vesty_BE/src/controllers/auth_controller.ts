import { Request, Response } from 'express';
import { AuthService } from '../services/auth_services';
import { responseBuilder } from '../utils/response';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await AuthService.getService().register(name, email, password);
      return res.status(201).json(responseBuilder(true, '201', result, 'Register successful'));
    } catch (err: any) {
      return res.status(400).json(responseBuilder(false, err.code ?? '400', null, err.message));
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.getService().login(email, password);
      return res.status(200).json(responseBuilder(true, '200', result, 'Login successful'));
    } catch (err: any) {
      return res.status(401).json(responseBuilder(false, err.code ?? '401', null, err.message));
    }
  }
}