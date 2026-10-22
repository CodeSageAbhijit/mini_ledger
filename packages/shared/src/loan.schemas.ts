import { z } from 'zod';
import { paiseSchema, isoDateSchema } from './primitives';

export const createLoanSchema = z.object({
  friendName: z.string().trim().min(1, 'Friend name is required').max(60, 'Friend name cannot exceed 60 characters'),
  amountPaise: paiseSchema,
  dueDate: isoDateSchema, // may be in the past (backdated entries allowed)
  note: z.string().trim().max(200, 'Note cannot exceed 200 characters').optional(),
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid('Invalid loan ID format'),
});

export const listLoansQuerySchema = z.object({
  filter: z.enum(['all', 'pending', 'overdue', 'repaid']).default('all'),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
export type ListLoansQuery = z.infer<typeof listLoansQuerySchema>;

export interface ReceiptInfo {
  id: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface LoanResponse {
  id: string;
  friendName: string;
  amountPaise: number;
  currency: string;
  note: string | null;
  dueDate: string;
  status: 'PENDING' | 'REPAID';
  repaidAt: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  receiptCount: number;
  receipts?: ReceiptInfo[];
  createdAt: string;
}
