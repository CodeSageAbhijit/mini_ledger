import { describe, it, expect } from 'vitest';
import {
  e164PhoneSchema,
  paiseSchema,
  isoDateSchema,
  createLoanSchema,
  verifyOtpSchema,
} from './index';

describe('Shared Zod Schemas (Unit)', () => {
  describe('e164PhoneSchema', () => {
    it('normalizes 10-digit Indian phone to E.164 (+91...) format', () => {
      const parsed = e164PhoneSchema.parse('9876543210');
      expect(parsed).toBe('+919876543210');
    });

    it('cleans spaces, dashes, parentheses and retains international format', () => {
      const parsed = e164PhoneSchema.parse('+91 98765-43210');
      expect(parsed).toBe('+919876543210');
    });

    it('rejects invalid short or non-digit strings', () => {
      expect(() => e164PhoneSchema.parse('12345')).toThrow();
      expect(() => e164PhoneSchema.parse('abcdefghij')).toThrow();
    });
  });

  describe('paiseSchema', () => {
    it('accepts positive integer paise amounts', () => {
      expect(paiseSchema.parse(100)).toBe(100);
      expect(paiseSchema.parse(250000)).toBe(250000); // ₹2,500
    });

    it('rejects zero, negative numbers, floats, and amounts exceeding ₹10,00,000', () => {
      expect(() => paiseSchema.parse(0)).toThrow();
      expect(() => paiseSchema.parse(-500)).toThrow();
      expect(() => paiseSchema.parse(100.5)).toThrow();
      expect(() => paiseSchema.parse(100_000_001)).toThrow(); // > ₹10,00,000
    });
  });

  describe('isoDateSchema', () => {
    it('accepts valid YYYY-MM-DD date strings', () => {
      expect(isoDateSchema.parse('2026-11-05')).toBe('2026-11-05');
    });

    it('rejects non-conforming date strings', () => {
      expect(() => isoDateSchema.parse('05-11-2026')).toThrow();
      expect(() => isoDateSchema.parse('2026/11/05')).toThrow();
      expect(() => isoDateSchema.parse('not-a-date')).toThrow();
    });
  });

  describe('createLoanSchema', () => {
    it('validates a complete loan creation input', () => {
      const valid = {
        friendName: 'Rahul Sharma',
        amountPaise: 500000,
        dueDate: '2026-11-01',
        note: 'Weekend trip share',
      };
      const parsed = createLoanSchema.parse(valid);
      expect(parsed.friendName).toBe('Rahul Sharma');
      expect(parsed.amountPaise).toBe(500000);
    });

    it('rejects missing or blank friend name', () => {
      expect(() =>
        createLoanSchema.parse({
          friendName: '   ',
          amountPaise: 5000,
          dueDate: '2026-11-01',
        }),
      ).toThrow();
    });
  });

  describe('verifyOtpSchema', () => {
    it('requires phone and exact 6-digit code', () => {
      const valid = verifyOtpSchema.parse({
        phone: '9876543210',
        code: '123456',
      });
      expect(valid.phone).toBe('+919876543210');
      expect(valid.code).toBe('123456');

      expect(() => verifyOtpSchema.parse({ phone: '9876543210', code: '123' })).toThrow();
      expect(() => verifyOtpSchema.parse({ phone: '9876543210', code: 'abcdef' })).toThrow();
    });
  });
});
