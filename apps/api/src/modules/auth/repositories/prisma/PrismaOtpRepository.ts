import type { PrismaClient, OtpChannelType } from '@prisma/client';
import type { OtpRepository, OtpChallengeRecord } from '../OtpRepository';

export class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    phone: string;
    codeHash: string;
    channel: OtpChannelType;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    return this.prisma.otpChallenge.create({
      data: {
        phone: data.phone,
        codeHash: data.codeHash,
        channel: data.channel,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findLatestActive(phone: string): Promise<OtpChallengeRecord | null> {
    return this.prisma.otpChallenge.findFirst({
      where: {
        phone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempts(id: string): Promise<number> {
    const updated = await this.prisma.otpChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    return updated.attempts;
  }

  async markConsumed(id: string): Promise<void> {
    await this.prisma.otpChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async invalidatePending(phone: string): Promise<void> {
    await this.prisma.otpChallenge.updateMany({
      where: {
        phone,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });
  }

  async countRecentChallenges(phone: string, since: Date): Promise<number> {
    return this.prisma.otpChallenge.count({
      where: {
        phone,
        createdAt: { gte: since },
      },
    });
  }
}
