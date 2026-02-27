import { EventEmitter } from 'events';
import { NotificationEvent, NotificationPayload, EmailRecipient } from './types';
import { emailService } from './email.service';
import { emailTemplateService } from './templates';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';
import { notificationHelpers } from './helpers';
import { InAppNotificationService } from './in-app.service';
import { NotificationType } from './schema';

/**
 * Notification Service
 * Handles event-driven email notifications
 */
export class NotificationService extends EventEmitter {
  private baseUrl: string;

  constructor() {
    super();
    this.baseUrl = config.frontend.url || 'http://localhost:3001';
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for all notification events
   */
  private setupEventListeners() {
    // Listen to all notification events
    Object.values(NotificationEvent).forEach((event) => {
      this.on(event, async (payload: NotificationPayload) => {
        try {
          await this.handleNotification(payload);
        } catch (error: any) {
          logger.error(`Failed to handle notification ${event}:`, error);
        }
      });
    });
  }

  /**
   * Handle notification event
   */
  private async handleNotification(payload: NotificationPayload): Promise<void> {
    const { event, recipients, data } = payload;

    // Get email template
    const template = emailTemplateService.getTemplate(event);
    const html = emailTemplateService.renderTemplate(template, {
      ...data,
      baseUrl: this.baseUrl,
    });

    // Prepare email options
    const emailOptions = {
      to: recipients,
      subject: this.getSubjectForEvent(event, data),
      template: event,
      data: {
        html,
        text: this.htmlToText(html),
      },
    };

    // Send email
    await emailService.sendEmail(emailOptions);
  }

  /**
   * Get subject line for event
   */
  private getSubjectForEvent(event: NotificationEvent, data: Record<string, any>): string {
    const subjects: Record<NotificationEvent, string> = {
      [NotificationEvent.RFQ_CREATED]: `New RFQ Available - ${data.rfqId || ''}`,
      [NotificationEvent.RFQ_DEADLINE_REMINDER]: `RFQ Deadline Reminder - ${data.rfqId || ''}`,
      [NotificationEvent.RFQ_DEADLINE_PASSED]: `RFQ Deadline Passed - ${data.rfqId || ''}`,
      [NotificationEvent.BID_SUBMITTED]: `New Bid Submitted for RFQ ${data.rfqId || ''}`,
      [NotificationEvent.BID_ACCEPTED]: `Bid Accepted - ${data.bidId || ''}`,
      [NotificationEvent.BID_REJECTED]: `Bid Rejected - ${data.bidId || ''}`,
      [NotificationEvent.BID_WITHDRAWN]: `Bid Withdrawn - ${data.bidId || ''}`,
      [NotificationEvent.CONTRACT_CREATED]: `Contract Created - ${data.contractId || ''}`,
      [NotificationEvent.CONTRACT_SIGNED]: `Contract Signed - ${data.contractId || ''}`,
      [NotificationEvent.CONTRACT_ACTIVATED]: `Contract Activated - ${data.contractId || ''}`,
      [NotificationEvent.CONTRACT_EXPIRED]: `Contract Expired - ${data.contractId || ''}`,
      [NotificationEvent.PAYMENT_CREATED]: `Payment Created - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_APPROVED]: `Payment Approved - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_REJECTED]: `Payment Rejected - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_FAILED]: `Payment Failed - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_RETRY]: `Payment Retry Initiated - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_COMPLETED]: `Payment Completed - ${data.paymentId || ''}`,
      [NotificationEvent.PAYMENT_MILESTONE_DUE]: `Payment Milestone Due - ${data.paymentId || ''}`,
      [NotificationEvent.DISPUTE_CREATED]: `Dispute Created - ${data.disputeId || ''}`,
      [NotificationEvent.DISPUTE_ESCALATED]: `Dispute Escalated to Government - ${data.disputeId || ''}`,
      [NotificationEvent.DISPUTE_RESOLVED]: `Dispute Resolved - ${data.disputeId || ''}`,
    };

    return subjects[event] || 'TriLink Notification';
  }

  /**
   * Convert HTML to plain text (simple implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Emit notification event
   */
  async notify(payload: NotificationPayload): Promise<void> {
    this.emit(payload.event, payload);
  }

  /**
   * Helper method to send RFQ deadline reminder
   */
  async sendRFQDeadlineReminder(
    rfq: any,
    recipients: EmailRecipient[]
  ): Promise<void> {
    const deadline = new Date(rfq.deadline);
    const now = new Date();
    const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

    await this.notify({
      event: NotificationEvent.RFQ_DEADLINE_REMINDER,
      recipients,
      data: {
        recipientName: recipients[0]?.name || 'User',
        rfqId: rfq._id.toString(),
        deadline: deadline.toLocaleString(),
        timeRemaining: `${hoursRemaining} hours`,
        rfqUrl: `${this.baseUrl}/rfqs/${rfq._id}`,
      },
    });
  }

  /**
   * Helper method to send bid submission notification
   */
  async sendBidSubmittedNotification(
    bid: any,
    rfq: any,
    buyerRecipients: EmailRecipient[]
  ): Promise<void> {
    await this.notify({
      event: NotificationEvent.BID_SUBMITTED,
      recipients: buyerRecipients,
      data: {
        recipientName: buyerRecipients[0]?.name || 'Buyer',
        bidId: bid._id.toString(),
        rfqId: rfq._id.toString(),
        companyName: bid.companyId?.name || 'Provider',
        price: `$${bid.price?.toLocaleString()}`,
        deliveryTime: `${bid.deliveryTime} days`,
        bidUrl: `${this.baseUrl}/bids/${bid._id}`,
      },
    });
  }

  /**
   * Helper method to send contract signature notification
   */
  async sendContractSignedNotification(
    contract: any,
    signer: any,
    recipients: EmailRecipient[]
  ): Promise<void> {
    await this.notify({
      event: NotificationEvent.CONTRACT_SIGNED,
      recipients,
      data: {
        recipientName: recipients[0]?.name || 'User',
        contractId: contract._id.toString(),
        signerName: signer.name || signer.email,
        signedAt: new Date().toLocaleString(),
        contractStatus: contract.status,
        contractUrl: `${this.baseUrl}/contracts/${contract._id}`,
      },
    });
  }

  /**
   * Helper method to send payment milestone notification
   */
  async sendPaymentMilestoneNotification(
    payment: any,
    recipients: EmailRecipient[]
  ): Promise<void> {
    const dueDate = new Date(payment.dueDate);
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await this.notify({
      event: NotificationEvent.PAYMENT_MILESTONE_DUE,
      recipients,
      data: {
        recipientName: recipients[0]?.name || 'User',
        paymentId: payment._id.toString(),
        amount: `$${payment.amount?.toLocaleString()}`,
        dueDate: dueDate.toLocaleDateString(),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        paymentUrl: `${this.baseUrl}/payments/${payment._id}`,
      },
    });
  }

  /**
   * Helper method to send dispute escalation notification
   */
  async sendDisputeEscalationNotification(
    dispute: any,
    governmentRecipients: EmailRecipient[]
  ): Promise<void> {
    await this.notify({
      event: NotificationEvent.DISPUTE_ESCALATED,
      recipients: governmentRecipients,
      data: {
        recipientName: governmentRecipients[0]?.name || 'Government User',
        disputeId: dispute._id.toString(),
        contractId: dispute.contractId?.toString() || '',
        escalatedAt: new Date().toLocaleString(),
        disputeUrl: `${this.baseUrl}/disputes/${dispute._id}`,
      },
    });
  }

  /**
   * Comprehensive method to notify company managers about any event
   * Sends email, in-app, and socket notifications
   */
  async notifyCompanyManagers(
    companyId: string,
    event: NotificationEvent,
    data: {
      title: string;
      message?: string;
      entityType?: 'rfq' | 'bid' | 'contract' | 'dispute' | 'payment' | 'shipment';
      entityId?: string;
      actionUrl?: string;
      metadata?: Record<string, any>;
      [key: string]: any;
    }
  ): Promise<void> {
    try {
      // Get company managers
      const managerRecipients = await notificationHelpers.getCompanyManagers(companyId);
      const managerUserIds = await notificationHelpers.getCompanyManagerUserIds(companyId);

      if (managerRecipients.length === 0 && managerUserIds.length === 0) {
        logger.debug(`No company managers found for company ${companyId}`);
        return;
      }

      // Send email notifications
      if (managerRecipients.length > 0) {
        await this.notify({
          event,
          recipients: managerRecipients,
          data: {
            recipientName: managerRecipients[0]?.name || 'Manager',
            ...data,
          },
        });
      }

      // Send in-app notifications
      if (managerUserIds.length > 0) {
        const inAppService = new InAppNotificationService();
        await inAppService.createNotificationsForUsers(
          managerUserIds,
          companyId,
          {
            title: data.title,
            message: data.message,
            type: this.getNotificationTypeFromEvent(event),
            entityType: data.entityType,
            entityId: data.entityId,
            actionUrl: data.actionUrl,
            metadata: data.metadata || {},
          }
        );
      }

      logger.info(`Notified ${managerRecipients.length} company managers for event ${event} in company ${companyId}`);
    } catch (error: any) {
      logger.error(`Failed to notify company managers for event ${event}:`, error);
      // Don't throw - notifications should not block main operations
    }
  }

  /**
   * Map notification event to notification type
   */
  private getNotificationTypeFromEvent(event: NotificationEvent): NotificationType {
    if (event.includes('dispute') || event.includes('rejected') || event.includes('failed')) {
      return NotificationType.WARNING;
    }
    if (event.includes('completed') || event.includes('accepted') || event.includes('signed') || event.includes('activated')) {
      return NotificationType.SUCCESS;
    }
    if (event.includes('deadline') || event.includes('due') || event.includes('reminder')) {
      return NotificationType.INFO;
    }
    return NotificationType.INFO;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
