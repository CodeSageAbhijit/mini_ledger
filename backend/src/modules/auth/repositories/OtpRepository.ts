import type { OtpChannelType } from '@prisma/client';

export interface OtpChallengeRecord {
  id: string;
  phone: string;
  codeHash: string;
  channel: OtpChannelType;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface OtpRepository {
  create(data: {
    phone: string;
    codeHash: string;
    channel: OtpChannelType;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord>;

  findLatestActive(phone: string): Promise<OtpChallengeRecord | null>;

  incrementAttempts(id: string): Promise<number>;

  markConsumed(id: string): Promise<void>;

  invalidatePending(phone: string): Promise<void>;

  countRecentChallenges(phone: string, since: Date): Promise<number>;
}
