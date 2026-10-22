import type { Request, Response } from 'express';
import type { SummaryService } from './summary.service';

export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  getSummary = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const summary = await this.summaryService.getSummary(userId);
    res.status(200).json(summary);
  };
}
