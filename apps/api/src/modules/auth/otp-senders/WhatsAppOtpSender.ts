import { OtpDeliveryError } from '../../../common/errors';
import { logger } from '../../../common/logger';
import type { OtpSender, OtpMessage } from './OtpSender';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  templateLang: string;
  apiVersion: string;
}

export class WhatsAppOtpSender implements OtpSender {
  public readonly channel = 'WHATSAPP' as const;

  constructor(private readonly config: WhatsAppConfig) {}

  async send(message: OtpMessage): Promise<void> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      throw new OtpDeliveryError(
        'WhatsApp Cloud API credentials not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)',
      );
    }

    const toPhone = message.phone.replace(/^\+/, '');
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: {
        name: this.config.templateName,
        language: { code: this.config.templateLang },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: message.code }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: message.code }],
          },
        ],
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errBody = await response.text();
        logger.error(
          { status: response.status, body: errBody, recipient: message.phone },
          'WhatsApp Cloud API returned non-2xx status',
        );
        throw new OtpDeliveryError(`WhatsApp Cloud API error: HTTP ${response.status}`);
      }

      logger.info({ recipient: message.phone }, 'WhatsApp OTP message accepted by Meta Cloud API');
    } catch (err) {
      if (err instanceof OtpDeliveryError) throw err;
      logger.error({ err, recipient: message.phone }, 'WhatsApp delivery failed due to network/timeout error');
      throw new OtpDeliveryError(
        `Failed to deliver OTP via WhatsApp: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
