import { z } from 'zod';
import { e164PhoneSchema } from './primitives';

export const requestOtpSchema = z.object({
  phone: e164PhoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: e164PhoneSchema,
  code: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Invalid refresh token'),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
  };
}
