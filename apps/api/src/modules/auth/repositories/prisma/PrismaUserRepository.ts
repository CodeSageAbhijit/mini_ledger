import type { PrismaClient } from '@prisma/client';
import type { UserRepository, UserRecord } from '../UserRepository';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPhone(phone: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { phone: string; name?: string }): Promise<UserRecord> {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
      },
    });
  }

  async findOrCreateByPhone(phone: string): Promise<UserRecord> {
    return this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }
}
