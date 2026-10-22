import type { Config } from '../../../config/env';
import { ConsoleOtpSender } from './ConsoleOtpSender';
import { FallbackOtpSender } from './FallbackOtpSender';
import type { OtpSender } from './OtpSender';
import { SmsOtpSender } from './SmsOtpSender';
import { WhatsAppOtpSender } from './WhatsAppOtpSender';

export function createOtpSender(config: Config): OtpSender {
  let primary: OtpSender;

  switch (config.OTP_CHANNEL) {
    case 'whatsapp':
      primary = new WhatsAppOtpSender(config.whatsapp);
      break;
    case 'sms':
      primary = new SmsOtpSender();
      break;
    case 'console':
    default:
      primary = new ConsoleOtpSender();
      break;
  }

  // If configured, decorate with Console fallback in non-production environments
  if (config.OTP_FALLBACK_TO_CONSOLE && config.NODE_ENV !== 'production' && primary.channel !== 'CONSOLE') {
    return new FallbackOtpSender(primary, new ConsoleOtpSender());
  }

  return primary;
}
