import { Router } from 'express';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { loanIdParamSchema } from '@miniledger/shared';
import { validate } from '../../common/http/validate';
import { asyncHandler } from '../../common/http/asyncHandler';
import type { ReceiptsController } from './receipts.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export function createReceiptsRouter(receiptsController: ReceiptsController, authGuard: RequestHandler): Router {
  const router = Router();

  router.use(authGuard);

  router.post(
    '/loans/:id/receipt',
    validate({ params: loanIdParamSchema }),
    upload.single('file'),
    asyncHandler(receiptsController.upload),
  );

  router.get(
    '/receipts/:id/file',
    asyncHandler(receiptsController.getFile),
  );

  return router;
}
