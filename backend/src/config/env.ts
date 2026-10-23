import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from the repository root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),

  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // OTP Configuration
  OTP_HASH_SECRET: z.string().min(32, 'OTP_HASH_SECRET must be at least 32 characters'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(30),

  // OTP Channel & Fallback
  OTP_CHANNEL: z.enum(['console', 'sms']).default('console'),
  OTP_FALLBACK_TO_CONSOLE: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('true'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : ['*']))
    .default('*'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  throw new Error('Invalid environment configuration');
}

export const config = {
  ...parseResult.data,
  otp: {
    secret: parseResult.data.OTP_HASH_SECRET,
    ttlSeconds: parseResult.data.OTP_TTL_SECONDS,
    maxAttempts: parseResult.data.OTP_MAX_ATTEMPTS,
    resendCooldownSeconds: parseResult.data.OTP_RESEND_COOLDOWN_SECONDS,
  },
  jwt: {
    secret: parseResult.data.JWT_ACCESS_SECRET,
    accessTtl: parseResult.data.JWT_ACCESS_TTL,
    refreshTtlDays: parseResult.data.REFRESH_TTL_DAYS,
  },
};

export type Config = typeof config;
