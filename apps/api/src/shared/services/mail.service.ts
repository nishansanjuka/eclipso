import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { loadConfig } from '../config';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailResult {
  sent: boolean;
  /** Why it was not sent (no API key, provider error, ...). */
  reason?: string;
}

/**
 * Sends transactional email through resend.com.
 *
 * Failures never throw: callers (e.g. invitations) still succeed and tell the
 * user the email did not go out, so a mail outage cannot block onboarding.
 * Without RESEND_API_KEY nothing is sent and the message is only logged.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: Resend | null;
  private readonly from: string;

  constructor() {
    const config = loadConfig();
    this.client = config.RESEND_API_KEY
      ? new Resend(config.RESEND_API_KEY)
      : null;
    this.from = config.MAIL_FROM;
  }

  async send(message: MailMessage): Promise<MailResult> {
    if (!this.client) {
      this.logger.warn(
        `RESEND_API_KEY not set: email to ${message.to} ("${message.subject}") was not sent`,
      );
      return { sent: false, reason: 'Email is not configured' };
    }
    try {
      const { error } = await this.client.emails.send({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) {
        this.logger.error(
          `Resend rejected email to ${message.to}: ${error.message}`,
        );
        return { sent: false, reason: error.message };
      }
      return { sent: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Sending email to ${message.to} failed: ${reason}`);
      return { sent: false, reason };
    }
  }
}
