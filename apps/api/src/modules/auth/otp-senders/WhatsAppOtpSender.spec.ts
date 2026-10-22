import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OtpDeliveryError } from '../../../common/errors';
import { WhatsAppOtpSender } from './WhatsAppOtpSender';

describe('WhatsAppOtpSender (Unit)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const validConfig = {
    accessToken: 'test_meta_token_123',
    phoneNumberId: '10987654321',
    templateName: 'miniledger_otp',
    templateLang: 'en',
    apiVersion: 'v21.0',
  };

  it('sends authentication template request with correct parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.123' }] }),
    });
    global.fetch = mockFetch;

    const sender = new WhatsAppOtpSender(validConfig);
    await sender.send({
      phone: '+919876543210',
      code: '852963',
      ttlMinutes: 5,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toBe('https://graph.facebook.com/v21.0/10987654321/messages');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer test_meta_token_123');
    expect(options.headers['Content-Type']).toBe('application/json');

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody.messaging_product).toBe('whatsapp');
    expect(parsedBody.to).toBe('919876543210'); // stripped '+'
    expect(parsedBody.type).toBe('template');
    expect(parsedBody.template.name).toBe('miniledger_otp');
    expect(parsedBody.template.components[0].parameters[0].text).toBe('852963');
  });

  it('throws OtpDeliveryError when WhatsApp API returns non-2xx', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Invalid OAuth access token"}}',
    });
    global.fetch = mockFetch;

    const sender = new WhatsAppOtpSender(validConfig);

    await expect(
      sender.send({
        phone: '+919876543210',
        code: '123456',
        ttlMinutes: 5,
      }),
    ).rejects.toThrow(OtpDeliveryError);
  });

  it('throws OtpDeliveryError when credentials are missing', async () => {
    const sender = new WhatsAppOtpSender({
      ...validConfig,
      accessToken: '',
    });

    await expect(
      sender.send({
        phone: '+919876543210',
        code: '123456',
        ttlMinutes: 5,
      }),
    ).rejects.toThrow(OtpDeliveryError);
  });
});
