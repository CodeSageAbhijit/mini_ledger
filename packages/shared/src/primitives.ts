import { z } from 'zod';

/**
 * Normalizes user-entered phone numbers to E.164 format.
 * Defaults 10-digit numbers to Indian country code (+91).
 */
export function normalizeToE164(raw: string): string {
  const cleaned = raw.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+91' + cleaned.slice(1);
  }
  if (/^\d{10}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  if (/^91\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  // Default to +91 for numbers entered without country code
  return '+91' + cleaned;
}

export const e164PhoneSchema = z
  .string()
  .trim()
  .transform(normalizeToE164)
  .refine(
    (v) => {
      if (v.startsWith('+91')) {
        // Indian numbers must be exactly +91 followed by 10 digits
        return /^\+91\d{10}$/.test(v);
      }
      // Other international numbers must be valid E.164 (8 to 15 digits)
      return /^\+[1-9]\d{7,14}$/.test(v);
    },
    { message: 'Please enter a valid 10-digit mobile number' },
  );

// Monetary amounts in integer paise (₹1 = 100 paise), max ₹10,00,000 (100,000,000 paise)
export const paiseSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .int('Amount must be an integer')
  .positive('Amount must be greater than zero')
  .max(100_000_000, 'Amount cannot exceed ₹10,00,000');

// ISO date string in YYYY-MM-DD format
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
