import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import type { Clock } from '../../common/clock';
import { UnauthorizedError } from '../../common/errors';
import type { RefreshTokenRepository } from './repositories/RefreshTokenRepository';

export interface JwtConfig {
  secret: string;
  accessTtl: string; // e.g. "15m"
  refreshTtlDays: number; // e.g. 30
}

export interface TokenPayload {
  sub: string; // userId
  phone: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly clock: Clock,
    private readonly config: JwtConfig,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  signAccessToken(userId: string, phone: string): string {
    return jwt.sign({ sub: userId, phone }, this.config.secret, {
      expiresIn: this.config.accessTtl as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret) as TokenPayload;
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  async createRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      this.clock.now().getTime() + this.config.refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  async generateTokenPair(userId: string, phone: string): Promise<TokenPair> {
    const accessToken = this.signAccessToken(userId, phone);
    const refreshToken = await this.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(oldRawToken: string, userPhoneLookup: (userId: string) => Promise<string | null>): Promise<TokenPair> {
    const tokenHash = this.hashToken(oldRawToken);
    const existing = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    const now = this.clock.now();
    if (!existing || existing.revokedAt || existing.expiresAt.getTime() < now.getTime()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke old token
    await this.refreshTokenRepo.revoke(existing.id);

    // Look up user phone to generate access token
    const phone = await userPhoneLookup(existing.userId);
    if (!phone) {
      throw new UnauthorizedError('User not found');
    }

    return this.generateTokenPair(existing.userId, phone);
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (existing && !existing.revokedAt) {
      await this.refreshTokenRepo.revoke(existing.id);
    }
  }
}
