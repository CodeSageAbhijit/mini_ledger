import { PrismaClient, Prisma } from '@prisma/client';
import type { LoanRepository, LoanRecord, ReceiptRecord, AggregateSummary } from '../LoanRepository';

export class PrismaLoanRepository implements LoanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    friendName: string;
    amountPaise: number;
    dueDate: Date;
    note?: string;
  }): Promise<LoanRecord> {
    return this.prisma.loan.create({
      data: {
        userId: data.userId,
        friendName: data.friendName,
        amountPaise: data.amountPaise,
        currency: 'INR',
        dueDate: data.dueDate,
        note: data.note,
        status: 'PENDING',
      },
      include: {
        _count: { select: { receipts: true } },
      },
    });
  }

  async findById(id: string, userId: string): Promise<LoanRecord | null> {
    return this.prisma.loan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        receipts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { receipts: true } },
      },
    });
  }

  async findMany(
    userId: string,
    filter: 'all' | 'pending' | 'overdue' | 'repaid',
    todayDate: Date,
    limit: number,
    cursor?: string,
  ): Promise<LoanRecord[]> {
    const where: Prisma.LoanWhereInput = { userId };

    switch (filter) {
      case 'pending':
        where.status = 'PENDING';
        break;
      case 'overdue':
        where.status = 'PENDING';
        where.dueDate = { lt: todayDate };
        break;
      case 'repaid':
        where.status = 'REPAID';
        break;
      case 'all':
      default:
        break;
    }

    const loans = await this.prisma.loan.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        _count: { select: { receipts: true } },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, REPAID second
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return loans;
  }

  async markRepaid(id: string, userId: string, repaidAt: Date): Promise<LoanRecord> {
    return this.prisma.loan.update({
      where: {
        id,
        userId,
      },
      data: {
        status: 'REPAID',
        repaidAt,
      },
      include: {
        _count: { select: { receipts: true } },
      },
    });
  }

  async aggregate(userId: string, todayDate: Date): Promise<AggregateSummary> {
    const allLoans = await this.prisma.loan.findMany({
      where: { userId },
      select: {
        amountPaise: true,
        status: true,
        dueDate: true,
      },
    });

    let totalLentPaise = 0;
    let totalRepaidPaise = 0;
    let overduePaise = 0;
    let pendingCount = 0;
    let repaidCount = 0;
    let overdueCount = 0;

    for (const loan of allLoans) {
      totalLentPaise += loan.amountPaise;

      if (loan.status === 'REPAID') {
        totalRepaidPaise += loan.amountPaise;
        repaidCount++;
      } else {
        pendingCount++;
        // Overdue check: status is PENDING and dueDate < todayDate
        if (loan.dueDate < todayDate) {
          overduePaise += loan.amountPaise;
          overdueCount++;
        }
      }
    }

    return {
      totalLentPaise,
      totalRepaidPaise,
      outstandingPaise: totalLentPaise - totalRepaidPaise,
      overduePaise,
      counts: {
        total: allLoans.length,
        pending: pendingCount,
        repaid: repaidCount,
        overdue: overdueCount,
      },
    };
  }

  async addReceipt(
    loanId: string,
    receipt: { storageKey: string; mimeType: string; sizeBytes: number },
  ): Promise<ReceiptRecord> {
    return this.prisma.receipt.create({
      data: {
        loanId,
        storageKey: receipt.storageKey,
        mimeType: receipt.mimeType,
        sizeBytes: receipt.sizeBytes,
      },
    });
  }

  async findReceiptById(receiptId: string, userId: string): Promise<ReceiptRecord | null> {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id: receiptId,
        loan: { userId },
      },
    });
    return receipt;
  }
}
