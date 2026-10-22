import { AppError } from '../../../common/errors';
import type { OtpSender, OtpMessage } from './OtpSender';

export class SmsOtpSender implements OtpSender {
  public readonly channel = 'SMS' as const;

  async send(_message: OtpMessage): Promise<void> {
    // Spot for SMS provider integration (e.g., MSG91, Twilio, AWS SNS)
    throw new AppError(
      'NOT_IMPLEMENTED',
      501,
      'SMS delivery provider is not configured. Configure MSG91 / Twilio in SmsOtpSender or set OTP_CHANNEL=console.',
    );
  }
}
