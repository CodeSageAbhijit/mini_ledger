import type { SummaryResponse } from '@miniledger/shared';
import type { Clock } from '../../common/clock';
import type { LoanSummaryReader } from '../loans/LoanRepository';

export class SummaryService {
  constructor(
    private readonly summaryReader: LoanSummaryReader,
    private readonly clock: Clock,
  ) {}

  async getSummary(userId: string): Promise<SummaryResponse> {
    const todayStr = this.clock.todayIso();
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const summary = await this.summaryReader.aggregate(userId, todayDate);
    return summary;
  }
}
