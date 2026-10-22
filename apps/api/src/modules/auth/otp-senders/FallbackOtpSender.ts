import { logger } from '../../../common/logger';
import type { OtpSender, OtpMessage, OtpChannelName } from './OtpSender';

/**
 * Decorator pattern: wraps a primary sender (e.g. WhatsApp) and falls back
 * to a secondary sender (e.g. Console) if the primary fails.
 */
export class FallbackOtpSender implements OtpSender {
  public readonly channel: OtpChannelName;

  constructor(
    private readonly primary: OtpSender,
    private readonly fallback: OtpSender,
  ) {
    this.channel = primary.channel;
  }

  async send(message: OtpMessage): Promise<void> {
    try {
      await this.primary.send(message);
    } catch (err) {
      logger.warn(
        {
          err: err instanceof Error ? err.message : err,
          primaryChannel: this.primary.channel,
          fallbackChannel: this.fallback.channel,
          recipient: message.phone,
        },
        'Primary OTP sender failed. Falling back to secondary sender.',
      );
      await this.fallback.send(message);
    }
  }
}
