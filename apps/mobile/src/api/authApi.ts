import type {
  RequestOtpInput,
  VerifyOtpInput,
  RefreshInput,
  AuthTokens,
} from '@miniledger/shared';
import { httpClient } from './HttpClient';

export interface RequestOtpResponse {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export const authApi = {
  requestOtp: async (data: RequestOtpInput): Promise<RequestOtpResponse> => {
    const res = await httpClient.post<RequestOtpResponse>('/auth/otp/request', data);
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpInput): Promise<AuthTokens> => {
    const res = await httpClient.post<AuthTokens>('/auth/otp/verify', data);
    return res.data;
  },

  refreshToken: async (data: RefreshInput): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await httpClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      data,
    );
    return res.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await httpClient.post('/auth/logout', { refreshToken });
  },

  getMe: async (): Promise<{ id: string; phone: string; name: string | null }> => {
    const res = await httpClient.get<{ id: string; phone: string; name: string | null }>('/me');
    return res.data;
  },
};
