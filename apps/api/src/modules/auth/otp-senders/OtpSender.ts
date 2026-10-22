export interface OtpMessage {
  phone: string; // E.164, e.g. +919876543210
  code: string; // Plain 6-digit OTP
  ttlMinutes: number;
}

export type OtpChannelName = 'WHATSAPP' | 'SMS' | 'CONSOLE';

export interface OtpSender {
  readonly channel: OtpChannelName;
  /** Resolves when provider accepted the message. Throws OtpDeliveryError otherwise. */
  send(message: OtpMessage): Promise<void>;
}
