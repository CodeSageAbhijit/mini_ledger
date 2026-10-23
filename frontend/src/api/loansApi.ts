import type {
  CreateLoanInput,
  ListLoansQuery,
  LoanResponse,
  ReceiptInfo,
} from '@miniledger/shared';
import { httpClient } from './HttpClient';

export const loansApi = {
  list: async (query?: ListLoansQuery): Promise<LoanResponse[]> => {
    const res = await httpClient.get<LoanResponse[]>('/loans', { params: query });
    return res.data;
  },

  getById: async (id: string): Promise<LoanResponse> => {
    const res = await httpClient.get<LoanResponse>(`/loans/${id}`);
    return res.data;
  },

  create: async (data: CreateLoanInput): Promise<LoanResponse> => {
    const res = await httpClient.post<LoanResponse>('/loans', data);
    return res.data;
  },

  repay: async (id: string): Promise<LoanResponse> => {
    const res = await httpClient.patch<LoanResponse>(`/loans/${id}/repay`);
    return res.data;
  },

  uploadReceipt: async (
    loanId: string,
    fileUri: string,
    mimeType: string,
    fileName?: string,
  ): Promise<ReceiptInfo> => {
    const formData = new FormData();
    const filename = fileName || fileUri.split('/').pop() || 'receipt';

    // React Native FormData file object format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await httpClient.post<ReceiptInfo>(`/loans/${loanId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },
};
