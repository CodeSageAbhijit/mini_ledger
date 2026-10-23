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

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can contain letters, numbers, and underscores'),
  email: z.string().trim().email('Please enter a valid email address').max(160),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    username: string | null;
    email: string | null;
  };
}
