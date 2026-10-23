import { VerifyOtpInput } from '@miniledger/shared';
import { authApi } from '../../../api/authApi';

export const authenticateCustomer = async (input: VerifyOtpInput) => {
  return authApi.verifyOtp(input);
};
