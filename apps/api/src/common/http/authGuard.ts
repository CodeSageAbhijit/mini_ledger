import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';

export interface AuthenticatedUser {
  id: string;
  phone: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AccessTokenVerifier {
  verifyAccessToken(token: string): { sub: string; phone: string };
}

export function createAuthGuard(tokenVerifier: AccessTokenVerifier) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
      token = req.query.token.trim();
    }

    if (!token) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    try {
      const payload = tokenVerifier.verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        phone: payload.phone,
      };
      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  };
}
