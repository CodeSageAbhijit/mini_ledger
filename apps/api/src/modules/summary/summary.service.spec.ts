import { describe, it, expect } from 'vitest';
import { FakeClock } from '../../common/clock';
import type { LoanSummaryReader, AggregateSummary } from '../loans/LoanRepository';
import { SummaryService } from './summary.service';

class FakeSummaryReader implements LoanSummaryReader {
  constructor(private readonly result: AggregateSummary) {}

  async aggregate(_userId: string, _todayDate: Date): Promise<AggregateSummary> {
    return this.result;
  }
}

describe('SummaryService (Unit)', () => {
  const clock = new FakeClock(new Date('2026-10-22T10:00:00.000Z'), 'Asia/Kolkata');

  it('returns correctly aggregated totals and counts', async () => {
    const mockSummary: AggregateSummary = {
      totalLentPaise: 1000000, // ₹10,000
      totalRepaidPaise: 400000, // ₹4,000
      outstandingPaise: 600000, // ₹6,000
      overduePaise: 200000, // ₹2,000
      counts: {
        total: 5,
        pending: 3,
        repaid: 2,
        overdue: 1,
      },
    };

    const reader = new FakeSummaryReader(mockSummary);
    const service = new SummaryService(reader, clock);

    const result = await service.getSummary('user-123');

    expect(result.totalLentPaise).toBe(1000000);
    expect(result.totalRepaidPaise).toBe(400000);
    expect(result.outstandingPaise).toBe(600000);
    expect(result.overduePaise).toBe(200000);
    expect(result.counts.total).toBe(5);
    expect(result.counts.pending).toBe(3);
    expect(result.counts.repaid).toBe(2);
    expect(result.counts.overdue).toBe(1);
  });

  it('handles empty state with zero amounts', async () => {
    const emptySummary: AggregateSummary = {
      totalLentPaise: 0,
      totalRepaidPaise: 0,
      outstandingPaise: 0,
      overduePaise: 0,
      counts: { total: 0, pending: 0, repaid: 0, overdue: 0 },
    };

    const reader = new FakeSummaryReader(emptySummary);
    const service = new SummaryService(reader, clock);

    const result = await service.getSummary('empty-user');
    expect(result.totalLentPaise).toBe(0);
    expect(result.outstandingPaise).toBe(0);
    expect(result.counts.total).toBe(0);
  });
});
