import { normalizeToE164, requestOtpSchema } from '@miniledger/shared';
import { authApi, RequestOtpResponse } from '../../../api/authApi';

export interface CustomerSignInRequest {
  phone: string;
}

export const requestCustomerVerification = async (
  input: CustomerSignInRequest,
): Promise<RequestOtpResponse & { phone: string }> => {
  const validation = requestOtpSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message || 'Please enter a valid phone number');
  }

  const phone = normalizeToE164(input.phone);
  const response = await authApi.requestOtp({ phone });
  return { ...response, phone };
};
