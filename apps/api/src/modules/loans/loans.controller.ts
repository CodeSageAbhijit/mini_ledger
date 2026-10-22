import type { Request, Response } from 'express';
import type { ListLoansQuery } from '@miniledger/shared';
import type { LoansService } from './loans.service';

export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const loan = await this.loansService.create(userId, req.body);
    res.status(201).json(loan);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const loans = await this.loansService.list(userId, req.query as unknown as ListLoansQuery);
    res.status(200).json(loans);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const loan = await this.loansService.getById(userId, req.params.id);
    res.status(200).json(loan);
  };

  repay = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const loan = await this.loansService.repay(userId, req.params.id);
    res.status(200).json(loan);
  };
}
