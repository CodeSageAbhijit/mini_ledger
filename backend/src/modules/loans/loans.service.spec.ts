import { describe, it, expect, beforeEach } from 'vitest';
import { FakeClock } from '../../common/clock';
import { ConflictError, NotFoundError } from '../../common/errors';
import type {
  LoanRepository,
  LoanRecord,
  ReceiptRecord,
  AggregateSummary,
} from './LoanRepository';
import { LoansService } from './loans.service';

class FakeLoanRepository implements LoanRepository {
  private loans: LoanRecord[] = [];

  setLoans(loans: LoanRecord[]) {
    this.loans = loans;
  }

  async create(data: {
    userId: string;
    friendName: string;
    amountPaise: number;
    dueDate: Date;
    note?: string;
  }): Promise<LoanRecord> {
    const loan: LoanRecord = {
      id: `loan-${this.loans.length + 1}`,
      userId: data.userId,
      friendName: data.friendName,
      amountPaise: data.amountPaise,
      currency: 'INR',
      note: data.note ?? null,
      dueDate: data.dueDate,
      status: 'PENDING',
      repaidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      receipts: [],
    };
    this.loans.push(loan);
    return loan;
  }

  async findById(id: string, userId: string): Promise<LoanRecord | null> {
    const loan = this.loans.find((l) => l.id === id && l.userId === userId);
    return loan ?? null;
  }

  async findMany(
    userId: string,
    filter: 'all' | 'pending' | 'overdue' | 'repaid',
    todayDate: Date,
  ): Promise<LoanRecord[]> {
    return this.loans.filter((l) => {
      if (l.userId !== userId) return false;
      if (filter === 'pending') return l.status === 'PENDING';
      if (filter === 'repaid') return l.status === 'REPAID';
      if (filter === 'overdue') return l.status === 'PENDING' && l.dueDate < todayDate;
      return true;
    });
  }

  async markRepaid(id: string, userId: string, repaidAt: Date): Promise<LoanRecord> {
    const loan = await this.findById(id, userId);
    if (!loan) throw new NotFoundError('Loan not found');
    loan.status = 'REPAID';
    loan.repaidAt = repaidAt;
    return loan;
  }

  async aggregate(_userId: string, _todayDate: Date): Promise<AggregateSummary> {
    return {
      totalLentPaise: 0,
      totalRepaidPaise: 0,
      outstandingPaise: 0,
      overduePaise: 0,
      counts: { total: 0, pending: 0, repaid: 0, overdue: 0 },
    };
  }

  async addReceipt(): Promise<ReceiptRecord> {
    throw new Error('Not used in loan unit tests');
  }

  async findReceiptById(): Promise<ReceiptRecord | null> {
    throw new Error('Not used in loan unit tests');
  }
}

describe('LoansService (Unit)', () => {
  let fakeRepo: FakeLoanRepository;
  let fakeClock: FakeClock;
  let service: LoansService;

  beforeEach(() => {
    fakeRepo = new FakeLoanRepository();
    // Today is 2026-10-22 in Asia/Kolkata
    fakeClock = new FakeClock(new Date('2026-10-22T12:00:00.000Z'), 'Asia/Kolkata');
    service = new LoansService(fakeRepo, fakeClock);
  });

  it('correctly calculates isOverdue=false for loan due today', async () => {
    const loan = await service.create('user-1', {
      friendName: 'Aarav',
      amountPaise: 50000,
      dueDate: '2026-10-22', // Due today!
    });

    expect(loan.isOverdue).toBe(false);
    expect(loan.daysOverdue).toBe(0);
  });

  it('correctly calculates isOverdue=true and daysOverdue for loan due in past', async () => {
    const loan = await service.create('user-1', {
      friendName: 'Vikram',
      amountPaise: 50000,
      dueDate: '2026-10-18', // 4 days ago
    });

    expect(loan.isOverdue).toBe(true);
    expect(loan.daysOverdue).toBe(4);
  });

  it('ensures repaid loan is never marked as overdue even if dueDate is in the past', async () => {
    const created = await service.create('user-1', {
      friendName: 'Rohan',
      amountPaise: 75000,
      dueDate: '2026-10-10',
    });

    expect(created.isOverdue).toBe(true);

    const repaid = await service.repay('user-1', created.id);
    expect(repaid.status).toBe('REPAID');
    expect(repaid.isOverdue).toBe(false);
    expect(repaid.daysOverdue).toBe(0);
  });

  it('throws ConflictError (ALREADY_REPAID) when repaying an already repaid loan', async () => {
    const created = await service.create('user-1', {
      friendName: 'Priya',
      amountPaise: 100000,
      dueDate: '2026-10-25',
    });

    await service.repay('user-1', created.id);

    await expect(service.repay('user-1', created.id)).rejects.toThrow(ConflictError);
  });

  it('enforces user isolation: foreign user cannot get or repay loan (throws NotFoundError)', async () => {
    const created = await service.create('user-A', {
      friendName: 'Sunil',
      amountPaise: 20000,
      dueDate: '2026-10-30',
    });

    // User B tries to view
    await expect(service.getById('user-B', created.id)).rejects.toThrow(NotFoundError);

    // User B tries to repay
    await expect(service.repay('user-B', created.id)).rejects.toThrow(NotFoundError);
  });

  it('sorts list with overdue loans first, then dueDate asc, then createdAt desc', async () => {
    fakeRepo.setLoans([
      {
        id: '1',
        userId: 'u1',
        friendName: 'Future 1',
        amountPaise: 1000,
        currency: 'INR',
        note: null,
        dueDate: new Date('2026-10-30T00:00:00.000Z'),
        status: 'PENDING',
        repaidAt: null,
        createdAt: new Date('2026-10-20T10:00:00.000Z'),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'u1',
        friendName: 'Overdue 1',
        amountPaise: 2000,
        currency: 'INR',
        note: null,
        dueDate: new Date('2026-10-15T00:00:00.000Z'),
        status: 'PENDING',
        repaidAt: null,
        createdAt: new Date('2026-10-10T10:00:00.000Z'),
        updatedAt: new Date(),
      },
      {
        id: '3',
        userId: 'u1',
        friendName: 'Due Today',
        amountPaise: 3000,
        currency: 'INR',
        note: null,
        dueDate: new Date('2026-10-22T00:00:00.000Z'),
        status: 'PENDING',
        repaidAt: null,
        createdAt: new Date('2026-10-21T10:00:00.000Z'),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.list('u1', { filter: 'all', limit: 50 });
    expect(result[0].friendName).toBe('Overdue 1'); // Overdue comes first
    expect(result[1].friendName).toBe('Due Today'); // Today (not overdue) comes next
    expect(result[2].friendName).toBe('Future 1'); // Future comes last
  });
});
