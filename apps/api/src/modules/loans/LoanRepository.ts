import type { LoanStatus } from '@prisma/client';

export interface ReceiptRecord {
  id: string;
  loanId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface LoanRecord {
  id: string;
  userId: string;
  friendName: string;
  amountPaise: number;
  currency: string;
  note: string | null;
  dueDate: Date;
  status: LoanStatus;
  repaidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  receipts?: ReceiptRecord[];
  _count?: { receipts: number };
}

export interface AggregateSummary {
  totalLentPaise: number;
  totalRepaidPaise: number;
  outstandingPaise: number;
  overduePaise: number;
  counts: {
    total: number;
    pending: number;
    repaid: number;
    overdue: number;
  };
}

export interface LoanSummaryReader {
  aggregate(userId: string, todayDate: Date): Promise<AggregateSummary>;
}

export interface LoanRepository extends LoanSummaryReader {
  create(data: {
    userId: string;
    friendName: string;
    amountPaise: number;
    dueDate: Date;
    note?: string;
  }): Promise<LoanRecord>;

  findById(id: string, userId: string): Promise<LoanRecord | null>;

  findMany(
    userId: string,
    filter: 'all' | 'pending' | 'overdue' | 'repaid',
    todayDate: Date,
    limit: number,
    cursor?: string,
  ): Promise<LoanRecord[]>;

  markRepaid(id: string, userId: string, repaidAt: Date): Promise<LoanRecord>;

  addReceipt(
    loanId: string,
    receipt: { storageKey: string; mimeType: string; sizeBytes: number },
  ): Promise<ReceiptRecord>;

  findReceiptById(receiptId: string, userId: string): Promise<ReceiptRecord | null>;
}
