import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { EmailOptions, EmailRecipient } from './types';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

export class EmailService {
  private sendGridApiKey: string | undefined;
  private nodemailerTransporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;
  private useSendGrid: boolean;

  constructor() {
    this.sendGridApiKey = config.email.sendGridApiKey;
    this.fromEmail = config.email.from || 'noreply@trilink.com';
    this.fromName = config.email.fromName || 'TriLink Platform';
    this.useSendGrid = !!this.sendGridApiKey;

    // Initialize SendGrid if API key is provided
    if (this.useSendGrid && this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
      logger.info('Email service initialized with SendGrid');
    } else {
      // Fallback to Nodemailer (SMTP or test account)
      this.initializeNodemailer();
      logger.info('Email service initialized with Nodemailer');
    }
  }

  private initializeNodemailer() {
    const smtpConfig = {
      host: config.email.smtp.host || 'smtp.gmail.com',
      port: parseInt(config.email.smtp.port || '587'),
      secure: config.email.smtp.secure, // true for 465, false for other ports
      auth: config.email.smtp.user && config.email.smtp.pass
        ? {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass,
          }
        : undefined,
    };

    // If no SMTP config, use Ethereal (for development/testing)
    if (!smtpConfig.auth) {
      logger.warn('No SMTP credentials found. Using Ethereal test account for development.');
      // In production, you should always provide SMTP credentials
      this.nodemailerTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      });
    } else {
      this.nodemailerTransporter = nodemailer.createTransport(smtpConfig);
    }
  }

  /**
   * Send email using SendGrid or Nodemailer
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (this.useSendGrid) {
        await this.sendWithSendGrid(options);
      } else {
        await this.sendWithNodemailer(options);
      }
      logger.info(`Email sent successfully to ${this.formatRecipients(options.to)}`);
    } catch (error: any) {
      logger.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const msg = {
      to: recipients.map((r) => r.email),
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: options.subject,
      html: options.data.html || '', // Template will be rendered here
      text: options.data.text || '',
      cc: options.cc?.map((r) => r.email),
      bcc: options.bcc?.map((r) => r.email),
    };

    await sgMail.send(msg);
  }

  /**
   * Send email using Nodemailer
   */
  private async sendWithNodemailer(options: EmailOptions): Promise<void> {
    if (!this.nodemailerTransporter) {
      throw new Error('Nodemailer transporter not initialized');
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: recipients.map((r) => r.email).join(', '),
      subject: options.subject,
      html: options.data.html || '',
      text: options.data.text || '',
      cc: options.cc?.map((r) => r.email).join(', '),
      bcc: options.bcc?.map((r) => r.email).join(', '),
      attachments: options.attachments,
    };

    const info = await this.nodemailerTransporter.sendMail(mailOptions);
    
    // Log Ethereal test URL if using Ethereal
    if (info.messageId && info.response?.includes('ethereal')) {
      logger.info(`Ethereal test email URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  /**
   * Format recipients for logging
   */
  private formatRecipients(recipients: EmailRecipient | EmailRecipient[]): string {
    const recs = Array.isArray(recipients) ? recipients : [recipients];
    return recs.map((r) => r.email).join(', ');
  }

  /**
   * Verify email service configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (this.useSendGrid) {
        // SendGrid doesn't have a verify method, but we can check API key
        return !!this.sendGridApiKey;
      } else {
        if (!this.nodemailerTransporter) {
          return false;
        }
        await this.nodemailerTransporter.verify();
        return true;
      }
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
