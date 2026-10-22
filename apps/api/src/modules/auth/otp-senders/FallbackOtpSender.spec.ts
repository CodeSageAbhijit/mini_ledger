import { describe, it, expect, vi } from 'vitest';
import { OtpDeliveryError } from '../../../common/errors';
import { FallbackOtpSender } from './FallbackOtpSender';
import type { OtpSender, OtpMessage } from './OtpSender';

describe('FallbackOtpSender (Unit)', () => {
  const sampleMessage: OtpMessage = {
    phone: '+919876543210',
    code: '123456',
    ttlMinutes: 5,
  };

  it('delegates to primary sender when primary succeeds', async () => {
    const primarySend = vi.fn().mockResolvedValue(undefined);
    const fallbackSend = vi.fn().mockResolvedValue(undefined);

    const primary: OtpSender = { channel: 'WHATSAPP', send: primarySend };
    const fallback: OtpSender = { channel: 'CONSOLE', send: fallbackSend };

    const sender = new FallbackOtpSender(primary, fallback);
    await sender.send(sampleMessage);

    expect(primarySend).toHaveBeenCalledWith(sampleMessage);
    expect(fallbackSend).not.toHaveBeenCalled();
  });

  it('falls back to secondary sender when primary fails', async () => {
    const primarySend = vi.fn().mockRejectedValue(new OtpDeliveryError('API timeout'));
    const fallbackSend = vi.fn().mockResolvedValue(undefined);

    const primary: OtpSender = { channel: 'WHATSAPP', send: primarySend };
    const fallback: OtpSender = { channel: 'CONSOLE', send: fallbackSend };

    const sender = new FallbackOtpSender(primary, fallback);
    await sender.send(sampleMessage);

    expect(primarySend).toHaveBeenCalledWith(sampleMessage);
    expect(fallbackSend).toHaveBeenCalledWith(sampleMessage);
  });
});
