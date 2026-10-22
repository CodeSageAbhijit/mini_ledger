import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NotFoundError } from './common/errors';
import { errorHandler } from './common/http/errorHandler';
import { createAuthGuard } from './common/http/authGuard';
import { httpLogger } from './common/logger';
import { config } from './config/env';
import type { AppContainer } from './container';
import { getPrisma } from './infra/prisma';
import { AuthController } from './modules/auth/auth.controller';
import { createAuthRouter } from './modules/auth/auth.routes';
import { LoansController } from './modules/loans/loans.controller';
import { createLoansRouter } from './modules/loans/loans.routes';
import { ReceiptsController } from './modules/receipts/receipts.controller';
import { createReceiptsRouter } from './modules/receipts/receipts.routes';
import { SummaryController } from './modules/summary/summary.controller';
import { createSummaryRouter } from './modules/summary/summary.routes';

export function createApp(container: AppContainer): Express {
  const app = express();

  // Basic security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.CORS_ORIGINS.includes('*') ? '*' : config.CORS_ORIGINS,
      credentials: true,
    }),
  );

  // Request logging & ID attribution
  app.use(httpLogger);

  // Body parser with 100kb payload limit
  app.use(express.json({ limit: '100kb' }));

  // General rate limiter: 100 requests per minute per IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again in a minute.',
      },
    },
  });
  app.use('/api', generalLimiter);

  // Health endpoint (§8.4)
  app.get('/health', async (_req, res, next) => {
    try {
      const prisma = getPrisma();
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', db: 'up' });
    } catch (err) {
      next(err);
    }
  });

  // Auth guard middleware
  const authGuard = createAuthGuard(container.tokenService);

  // Controllers
  const authController = new AuthController(container.authService);
  const loansController = new LoansController(container.loansService);
  const summaryController = new SummaryController(container.summaryService);
  const receiptsController = new ReceiptsController(container.receiptsService);

  // API v1 Routers
  const apiV1Router = express.Router();
  apiV1Router.use(createAuthRouter(authController, authGuard));
  apiV1Router.use('/loans', createLoansRouter(loansController, authGuard));
  apiV1Router.use(createSummaryRouter(summaryController, authGuard));
  apiV1Router.use(createReceiptsRouter(receiptsController, authGuard));

  app.use('/api/v1', apiV1Router);

  // 404 for unknown routes
  app.use((_req, _res, next) => {
    next(new NotFoundError('API endpoint not found'));
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
