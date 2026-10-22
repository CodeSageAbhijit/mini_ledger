import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { logger } from '../logger';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const requestId = (req.id as string) || (req.headers['x-request-id'] as string) || 'unknown';

  if (err instanceof AppError) {
    if (err.httpStatus >= 500) {
      logger.error({ err, requestId }, `Server AppError: ${err.message}`);
    } else {
      logger.warn({ code: err.code, status: err.httpStatus, details: err.details, requestId }, err.message);
    }

    res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details,
        requestId,
      },
    });
    return;
  }

  // Unknown / unhandled errors
  logger.error({ err, requestId }, `Unhandled internal error: ${err.message}`);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred',
      requestId,
    },
  });
};
