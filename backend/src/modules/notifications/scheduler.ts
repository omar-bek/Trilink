import cron from 'node-cron';
import { RFQRepository } from '../rfqs/repository';
import { RFQStatus } from '../rfqs/schema';
import { PaymentRepository } from '../payments/repository';
import { PaymentStatus } from '../payments/schema';
import { notificationService } from './notification.service';
import { notificationHelpers } from './helpers';
import { NotificationEvent } from './types';
import { logger } from '../../utils/logger';

/**
 * Scheduled jobs for email notifications
 */
export class NotificationScheduler {
  private rfqRepository: RFQRepository;
  private paymentRepository: PaymentRepository;
  private isRunning: boolean = false;

  constructor() {
    this.rfqRepository = new RFQRepository();
    this.paymentRepository = new PaymentRepository();
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }

    this.isRunning = true;

    // Check RFQ deadlines every hour
    cron.schedule('0 * * * *', () => {
      this.checkRFQDeadlines().catch((error) => {
        logger.error('Error checking RFQ deadlines:', error);
      });
    });

    // Check payment milestones daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.checkPaymentMilestones().catch((error) => {
        logger.error('Error checking payment milestones:', error);
      });
    });

    logger.info('Notification scheduler started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.isRunning = false;
    logger.info('Notification scheduler stopped');
  }

  /**
   * Check RFQ deadlines and send reminders
   */
  private async checkRFQDeadlines(): Promise<void> {
    try {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find RFQs with deadlines in the next 24 hours
      // Get all open RFQs and filter by deadline
      const allRFQs = await this.rfqRepository.findAll({ status: RFQStatus.OPEN });
      const rfqs = allRFQs.filter((rfq) => {
        const deadline = new Date(rfq.deadline);
        return deadline >= now && deadline <= oneDayFromNow;
      });

      for (const rfq of rfqs) {
        const deadline = new Date(rfq.deadline);
        const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

        // Send reminder if deadline is in 24 hours or 2 hours
        if (hoursRemaining <= 24 && hoursRemaining > 0) {
          // Get all provider companies that should receive this RFQ
          // For now, we'll send to the buyer as a reminder
          const recipients = await notificationHelpers.getRecipientsByCompany(
            rfq.companyId.toString(),
            []
          );

          if (recipients.length > 0) {
            await notificationService.sendRFQDeadlineReminder(rfq, recipients);
          }
        }

        // Close RFQs that have passed deadline
        if (deadline < now) {
          await this.rfqRepository.update(rfq._id.toString(), {
            status: RFQStatus.CLOSED,
          });

          // Notify buyer that RFQ deadline has passed
          const recipients = await notificationHelpers.getRecipientsByCompany(
            rfq.companyId.toString(),
            []
          );

          if (recipients.length > 0) {
            await notificationService.notify({
              event: NotificationEvent.RFQ_DEADLINE_PASSED,
              recipients,
              data: {
                recipientName: recipients[0]?.name || 'User',
                rfqId: rfq._id.toString(),
                deadline: deadline.toLocaleString(),
                rfqUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/rfqs/${rfq._id}`,
              },
            });
          }
        }
      }

      logger.info(`Checked ${rfqs.length} RFQs for deadline reminders`);
    } catch (error) {
      logger.error('Error in checkRFQDeadlines:', error);
      throw error;
    }
  }

  /**
   * Check payment milestones and send due reminders
   */
  private async checkPaymentMilestones(): Promise<void> {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find payments due in the next 7 days
      // Get all payments with relevant statuses and filter by due date
      const allPayments = await this.paymentRepository.findAll();
      const payments = allPayments.filter((payment) => {
        const status = payment.status as PaymentStatus;
        const dueDate = new Date(payment.dueDate);
        return (
          (status === PaymentStatus.PENDING_APPROVAL || status === PaymentStatus.APPROVED) &&
          dueDate >= now &&
          dueDate <= sevenDaysFromNow
        );
      });

      for (const payment of payments) {
        const recipients = await notificationHelpers.getRecipientsByCompany(
          payment.companyId.toString(),
          []
        );

        if (recipients.length > 0) {
          await notificationService.sendPaymentMilestoneNotification(payment, recipients);
        }
      }

      logger.info(`Checked ${payments.length} payments for milestone reminders`);
    } catch (error) {
      logger.error('Error in checkPaymentMilestones:', error);
      throw error;
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
