import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { responseBuilder } from '../utils/response';

export const validate = (schema: z.ZodTypeAny) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues.map((err) => `${err.path.join('.')} : ${err.message}`).join(', ');
                return res.status(400).json(responseBuilder(false, '400', null, `Validasi Gagal: ${errorMessages}`));
            }
            return res.status(500).json(responseBuilder(false, '500', null, 'Internal Server Error'));
        }
    };