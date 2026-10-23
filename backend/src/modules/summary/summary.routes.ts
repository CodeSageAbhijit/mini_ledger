import { Router } from 'express';
import type { RequestHandler } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import type { SummaryController } from './summary.controller';

export function createSummaryRouter(summaryController: SummaryController, authGuard: RequestHandler): Router {
  const router = Router();

  router.get(
    '/summary',
    authGuard,
    asyncHandler(summaryController.getSummary),
  );

  return router;
}
