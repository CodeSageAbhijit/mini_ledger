import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { Clock } from '../../common/clock';
import { RateLimitError, UnauthorizedError } from '../../common/errors';
import type { OtpSender } from './otp-senders/OtpSender';
import type { OtpRepository } from './repositories/OtpRepository';

export interface OtpServiceConfig {
  secret: string;
  ttlSeconds: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
}

export interface RequestOtpResult {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export class OtpService {
  constructor(
    private readonly otpRepo: OtpRepository,
    private readonly otpSender: OtpSender,
    private readonly clock: Clock,
    private readonly config: OtpServiceConfig,
  ) {}

  private hashCode(code: string): string {
    return createHmac('sha256', this.config.secret).update(code).digest('hex');
  }

  async requestOtp(phone: string): Promise<RequestOtpResult> {
    const now = this.clock.now();

    // 1. Check hourly rate limit (max 5 requests per hour per phone)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyCount = await this.otpRepo.countRecentChallenges(phone, oneHourAgo);
    if (hourlyCount >= 5) {
      throw new RateLimitError(
        'Too many OTP requests for this phone number. Please try again later.',
        'OTP_RATE_LIMIT',
      );
    }

    // 2. Check resend cooldown
    const latest = await this.otpRepo.findLatestActive(phone);
    if (latest) {
      const elapsedSeconds = Math.floor((now.getTime() - latest.createdAt.getTime()) / 1000);
      if (elapsedSeconds < this.config.resendCooldownSeconds) {
        const waitTime = this.config.resendCooldownSeconds - elapsedSeconds;
        throw new RateLimitError(
          `Please wait ${waitTime} seconds before requesting a new OTP.`,
          'OTP_COOLDOWN',
          { retryAfterSeconds: waitTime },
        );
      }
    }

    // 3. Invalidate any previous unconsumed challenges
    await this.otpRepo.invalidatePending(phone);

    // 4. Generate 6-digit cryptographically secure OTP
    const code = randomInt(100000, 1000000).toString();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(now.getTime() + this.config.ttlSeconds * 1000);

    // 5. Store challenge in repository
    await this.otpRepo.create({
      phone,
      codeHash,
      channel: this.otpSender.channel,
      expiresAt,
    });

    // 6. Deliver via configured OtpSender
    await this.otpSender.send({
      phone,
      code,
      ttlMinutes: Math.round(this.config.ttlSeconds / 60),
    });

    return {
      expiresInSeconds: this.config.ttlSeconds,
      resendAfterSeconds: this.config.resendCooldownSeconds,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<void> {
    const now = this.clock.now();
    const challenge = await this.otpRepo.findLatestActive(phone);

    if (!challenge) {
      throw new UnauthorizedError('No active OTP request found. Please request a new OTP.', 'OTP_NOT_FOUND');
    }

    // Check max attempts
    if (challenge.attempts >= this.config.maxAttempts) {
      await this.otpRepo.markConsumed(challenge.id);
      throw new RateLimitError(
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        'OTP_ATTEMPTS_EXCEEDED',
      );
    }

    // Check expiration
    if (challenge.expiresAt.getTime() < now.getTime()) {
      await this.otpRepo.markConsumed(challenge.id);
      throw new UnauthorizedError('OTP has expired. Please request a new OTP.', 'OTP_EXPIRED');
    }

    // Constant-time hash comparison
    const providedHash = this.hashCode(code);
    const storedHashBuffer = Buffer.from(challenge.codeHash, 'hex');
    const providedHashBuffer = Buffer.from(providedHash, 'hex');

    const isValid =
      storedHashBuffer.length === providedHashBuffer.length &&
      timingSafeEqual(storedHashBuffer, providedHashBuffer);

    if (!isValid) {
      const attempts = await this.otpRepo.incrementAttempts(challenge.id);
      const remaining = this.config.maxAttempts - attempts;
      if (remaining <= 0) {
        await this.otpRepo.markConsumed(challenge.id);
        throw new RateLimitError(
          'Maximum OTP verification attempts exceeded. Please request a new OTP.',
          'OTP_ATTEMPTS_EXCEEDED',
        );
      }
      throw new UnauthorizedError(`Invalid OTP code. ${remaining} attempts remaining.`, 'OTP_INVALID', {
        remainingAttempts: remaining,
      });
    }

    // Valid: mark consumed
    await this.otpRepo.markConsumed(challenge.id);
  }
}
