import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requestOtpSchema, verifyOtpSchema, refreshSchema } from '@miniledger/shared';
import { validate } from '../../common/http/validate';
import { asyncHandler } from '../../common/http/asyncHandler';
import type { AuthController } from './auth.controller';
import type { RequestHandler } from 'express';

export function createAuthRouter(authController: AuthController, authGuard: RequestHandler): Router {
  const router = Router();

  // Rate limiter for OTP requests: 5 per minute per IP
  const otpRequestLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests from this IP address, please try again in a minute.',
      },
    },
  });

  router.post(
    '/auth/otp/request',
    otpRequestLimiter,
    validate({ body: requestOtpSchema }),
    asyncHandler(authController.requestOtp),
  );

  router.post(
    '/auth/otp/verify',
    validate({ body: verifyOtpSchema }),
    asyncHandler(authController.verifyOtp),
  );

  router.post(
    '/auth/refresh',
    validate({ body: refreshSchema }),
    asyncHandler(authController.refreshToken),
  );

  router.post(
    '/auth/logout',
    validate({ body: refreshSchema }),
    asyncHandler(authController.logout),
  );

  router.get(
    '/me',
    authGuard,
    asyncHandler(authController.getMe),
  );

  return router;
}
