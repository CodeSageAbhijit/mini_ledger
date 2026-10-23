import type { SummaryResponse } from '@miniledger/shared';
import { httpClient } from './HttpClient';

export const summaryApi = {
  getSummary: async (): Promise<SummaryResponse> => {
    const res = await httpClient.get<SummaryResponse>('/summary');
    return res.data;
  },
};
