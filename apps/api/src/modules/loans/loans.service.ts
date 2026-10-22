import type { CreateLoanInput, ListLoansQuery, LoanResponse } from '@miniledger/shared';
import type { Clock } from '../../common/clock';
import { ConflictError, NotFoundError } from '../../common/errors';
import type { LoanRecord, LoanRepository } from './LoanRepository';

export class LoansService {
  constructor(
    private readonly loanRepo: LoanRepository,
    private readonly clock: Clock,
  ) {}

  private mapToResponse(loan: LoanRecord, todayStr: string): LoanResponse {
    const dueDateStr = loan.dueDate.toISOString().slice(0, 10);
    const isOverdue = loan.status === 'PENDING' && dueDateStr < todayStr;

    let daysOverdue = 0;
    if (isOverdue) {
      const todayTime = new Date(todayStr).getTime();
      const dueTime = new Date(dueDateStr).getTime();
      daysOverdue = Math.max(0, Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24)));
    }

    return {
      id: loan.id,
      friendName: loan.friendName,
      amountPaise: loan.amountPaise,
      currency: loan.currency,
      note: loan.note,
      dueDate: dueDateStr,
      status: loan.status as 'PENDING' | 'REPAID',
      repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
      isOverdue,
      daysOverdue,
      receiptCount: loan._count?.receipts ?? loan.receipts?.length ?? 0,
      receipts: loan.receipts?.map((r) => ({
        id: r.id,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: loan.createdAt.toISOString(),
    };
  }

  async create(userId: string, input: CreateLoanInput): Promise<LoanResponse> {
    const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);

    const loan = await this.loanRepo.create({
      userId,
      friendName: input.friendName,
      amountPaise: input.amountPaise,
      dueDate,
      note: input.note,
    });

    const todayStr = this.clock.todayIso();
    return this.mapToResponse(loan, todayStr);
  }

  async list(userId: string, query: ListLoansQuery): Promise<LoanResponse[]> {
    const todayStr = this.clock.todayIso();
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const loans = await this.loanRepo.findMany(
      userId,
      query.filter,
      todayDate,
      query.limit,
      query.cursor,
    );

    const mapped = loans.map((l) => this.mapToResponse(l, todayStr));

    // Sort: overdue first, then by dueDate asc, then createdAt desc
    return mapped.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async getById(userId: string, id: string): Promise<LoanResponse> {
    const loan = await this.loanRepo.findById(id, userId);
    if (!loan) {
      throw new NotFoundError('Loan not found');
    }
    const todayStr = this.clock.todayIso();
    return this.mapToResponse(loan, todayStr);
  }

  async repay(userId: string, id: string): Promise<LoanResponse> {
    const existing = await this.loanRepo.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Loan not found');
    }

    if (existing.status === 'REPAID') {
      throw new ConflictError('Loan has already been marked as repaid', 'ALREADY_REPAID');
    }

    const now = this.clock.now();
    const updated = await this.loanRepo.markRepaid(id, userId, now);
    const todayStr = this.clock.todayIso();
    return this.mapToResponse(updated, todayStr);
  }
}
