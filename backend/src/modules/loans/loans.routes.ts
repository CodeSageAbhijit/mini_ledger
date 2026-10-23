import { Router } from 'express';
import type { RequestHandler } from 'express';
import { createLoanSchema, listLoansQuerySchema, loanIdParamSchema } from '@miniledger/shared';
import { validate } from '../../common/http/validate';
import { asyncHandler } from '../../common/http/asyncHandler';
import type { LoansController } from './loans.controller';

export function createLoansRouter(loansController: LoansController, authGuard: RequestHandler): Router {
  const router = Router();

  router.use(authGuard);

  router.post(
    '/',
    validate({ body: createLoanSchema }),
    asyncHandler(loansController.create),
  );

  router.get(
    '/',
    validate({ query: listLoansQuerySchema }),
    asyncHandler(loansController.list),
  );

  router.get(
    '/:id',
    validate({ params: loanIdParamSchema }),
    asyncHandler(loansController.getById),
  );

  router.patch(
    '/:id/repay',
    validate({ params: loanIdParamSchema }),
    asyncHandler(loansController.repay),
  );

  return router;
}
