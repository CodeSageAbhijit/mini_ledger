export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details?: unknown;

  constructor(code: string, httpStatus: number, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details?: unknown) {
    super(code, 404, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input', details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: unknown) {
    super(code, 401, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: unknown) {
    super(code, 409, message, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED', details?: unknown) {
    super(code, 429, message, details);
  }
}

export class OtpDeliveryError extends AppError {
  constructor(message = 'Failed to deliver OTP', details?: unknown) {
    super('OTP_DELIVERY_FAILED', 502, message, details);
  }
}
