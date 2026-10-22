import { describe, it, expect, beforeEach } from 'vitest';
import { FakeClock } from '../../common/clock';
import { RateLimitError, UnauthorizedError } from '../../common/errors';
import type { OtpMessage, OtpSender } from './otp-senders/OtpSender';
import type { OtpChallengeRecord, OtpRepository } from './repositories/OtpRepository';
import { OtpService } from './otp.service';

class FakeOtpSender implements OtpSender {
  public readonly channel = 'CONSOLE' as const;
  public sentMessages: OtpMessage[] = [];

  async send(message: OtpMessage): Promise<void> {
    this.sentMessages.push(message);
  }
}

class FakeOtpRepository implements OtpRepository {
  public challenges: OtpChallengeRecord[] = [];

  constructor(private readonly clock: FakeClock) {}

  async create(data: {
    phone: string;
    codeHash: string;
    channel: 'WHATSAPP' | 'SMS' | 'CONSOLE';
    expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    const record: OtpChallengeRecord = {
      id: `challenge-${this.challenges.length + 1}`,
      phone: data.phone,
      codeHash: data.codeHash,
      channel: data.channel,
      attempts: 0,
      expiresAt: data.expiresAt,
      consumedAt: null,
      createdAt: this.clock.now(),
    };
    this.challenges.push(record);
    return record;
  }

  async findLatestActive(phone: string): Promise<OtpChallengeRecord | null> {
    const active = this.challenges
      .filter((c) => c.phone === phone && c.consumedAt === null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active[0] ?? null;
  }

  async incrementAttempts(id: string): Promise<number> {
    const ch = this.challenges.find((c) => c.id === id);
    if (!ch) throw new Error('Not found');
    ch.attempts += 1;
    return ch.attempts;
  }

  async markConsumed(id: string): Promise<void> {
    const ch = this.challenges.find((c) => c.id === id);
    if (ch) ch.consumedAt = new Date();
  }

  async invalidatePending(phone: string): Promise<void> {
    for (const ch of this.challenges) {
      if (ch.phone === phone && ch.consumedAt === null) {
        ch.consumedAt = new Date();
      }
    }
  }

  async countRecentChallenges(phone: string, since: Date): Promise<number> {
    return this.challenges.filter(
      (c) => c.phone === phone && c.createdAt.getTime() >= since.getTime(),
    ).length;
  }
}

describe('OtpService (Unit)', () => {
  let fakeRepo: FakeOtpRepository;
  let fakeSender: FakeOtpSender;
  let fakeClock: FakeClock;
  let otpService: OtpService;

  beforeEach(() => {
    fakeClock = new FakeClock(new Date('2026-10-22T10:00:00.000Z'), 'Asia/Kolkata');
    fakeRepo = new FakeOtpRepository(fakeClock);
    fakeSender = new FakeOtpSender();
    otpService = new OtpService(fakeRepo, fakeSender, fakeClock, {
      secret: 'test_otp_hash_secret_32_characters_long',
      ttlSeconds: 300,
      maxAttempts: 5,
      resendCooldownSeconds: 30,
    });
  });

  it('generates, hashes, stores, and delivers a 6-digit OTP', async () => {
    const phone = '+919876543210';
    const result = await otpService.requestOtp(phone);

    expect(result.expiresInSeconds).toBe(300);
    expect(result.resendAfterSeconds).toBe(30);

    // Verify OTP was sent via sender
    expect(fakeSender.sentMessages.length).toBe(1);
    const sent = fakeSender.sentMessages[0];
    expect(sent.phone).toBe(phone);
    expect(sent.code).toMatch(/^\d{6}$/);

    // Verify OTP was stored in DB as a hash (NOT plain text)
    expect(fakeRepo.challenges.length).toBe(1);
    expect(fakeRepo.challenges[0].codeHash).not.toBe(sent.code);
    expect(fakeRepo.challenges[0].codeHash.length).toBe(64); // SHA-256 HMAC is 64 hex chars
  });

  it('successfully verifies a valid OTP code', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);
    const code = fakeSender.sentMessages[0].code;

    await expect(otpService.verifyOtp(phone, code)).resolves.not.toThrow();

    // Challenge should now be marked consumed
    const active = await fakeRepo.findLatestActive(phone);
    expect(active).toBeNull();
  });

  it('rejects invalid OTP, increments attempts, and indicates remaining attempts', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);

    await expect(otpService.verifyOtp(phone, '000000')).rejects.toThrow(UnauthorizedError);

    expect(fakeRepo.challenges[0].attempts).toBe(1);
  });

  it('locks challenge when maximum attempts are exceeded', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);

    for (let i = 0; i < 4; i++) {
      await expect(otpService.verifyOtp(phone, '000000')).rejects.toThrow(UnauthorizedError);
    }

    // 5th failed attempt should trigger RateLimitError
    await expect(otpService.verifyOtp(phone, '000000')).rejects.toThrow(RateLimitError);
  });

  it('rejects expired OTP code', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);
    const code = fakeSender.sentMessages[0].code;

    // Advance clock past 5-minute TTL
    fakeClock.setNow(new Date('2026-10-22T10:06:00.000Z'));

    await expect(otpService.verifyOtp(phone, code)).rejects.toThrow(UnauthorizedError);
  });

  it('enforces resend cooldown limit (30 seconds)', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);

    // Try to request again after only 10 seconds
    fakeClock.setNow(new Date('2026-10-22T10:00:10.000Z'));

    await expect(otpService.requestOtp(phone)).rejects.toThrow(RateLimitError);

    // After 31 seconds, request should succeed
    fakeClock.setNow(new Date('2026-10-22T10:00:31.000Z'));
    await expect(otpService.requestOtp(phone)).resolves.toBeDefined();
  });

  it('enforces hourly limit (maximum 5 requests per hour)', async () => {
    const phone = '+919876543210';

    for (let i = 0; i < 5; i++) {
      fakeClock.setNow(new Date(fakeClock.now().getTime() + 35 * 1000));
      await otpService.requestOtp(phone);
    }

    // 6th request within the hour should fail
    fakeClock.setNow(new Date(fakeClock.now().getTime() + 35 * 1000));
    await expect(otpService.requestOtp(phone)).rejects.toThrow(RateLimitError);
  });

  it('invalidates older pending challenge when new OTP is requested', async () => {
    const phone = '+919876543210';
    await otpService.requestOtp(phone);
    const firstCode = fakeSender.sentMessages[0].code;

    fakeClock.setNow(new Date('2026-10-22T10:01:00.000Z'));
    await otpService.requestOtp(phone);

    // Trying first code should fail because old challenge was invalidated
    await expect(otpService.verifyOtp(phone, firstCode)).rejects.toThrow(UnauthorizedError);
  });
});
