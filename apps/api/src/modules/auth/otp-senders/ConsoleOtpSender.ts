import { logger } from '../../../common/logger';
import type { OtpSender, OtpMessage } from './OtpSender';

export class ConsoleOtpSender implements OtpSender {
  public readonly channel = 'CONSOLE' as const;

  async send(message: OtpMessage): Promise<void> {
    logger.info(
      { phone: message.phone },
      `🔑 [CONSOLE OTP] OTP for ${message.phone} is ${message.code} (valid for ${message.ttlMinutes} min)`,
    );
  }
}
