import { NotificationEvent } from './types';

/**
 * Email template renderer
 * Templates use simple string replacement with {{variable}} syntax
 */
export class EmailTemplateService {
  /**
   * Render email template
   */
  renderTemplate(template: string, data: Record<string, any>): string {
    let html = template;
    
    // Replace all {{variable}} placeholders
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = this.escapeHtml(String(data[key] || ''));
      html = html.replace(regex, value);
    });

    return html;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get base email template HTML
   */
  getBaseTemplate(content: string, title?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'TriLink Notification'}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">TriLink</h1>
    <p style="margin: 5px 0 0 0;">Digital Trade & Procurement Platform</p>
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    ${content}
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
    <p>This is an automated email from TriLink Platform.</p>
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get template for specific notification event
   */
  getTemplate(event: NotificationEvent): string {
    const templates: Record<NotificationEvent, string> = {
      // RFQ Templates
      [NotificationEvent.RFQ_CREATED]: this.getBaseTemplate(`
        <h2 style="color: #1976d2;">New RFQ Available</h2>
        <p>Hello {{recipientName}},</p>
        <p>A new Request for Quotation (RFQ) has been created that matches your company profile.</p>
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Type:</strong> {{rfqType}}</p>
          <p><strong>Budget:</strong> {{budget}}</p>
          <p><strong>Deadline:</strong> {{deadline}}</p>
          <p><strong>Delivery Date:</strong> {{deliveryDate}}</p>
        </div>
        <p><a href="{{rfqUrl}}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View RFQ</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'New RFQ Available'),

      [NotificationEvent.RFQ_DEADLINE_REMINDER]: this.getBaseTemplate(`
        <h2 style="color: #ff9800;">RFQ Deadline Reminder</h2>
        <p>Hello {{recipientName}},</p>
        <p>This is a reminder that an RFQ deadline is approaching.</p>
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Deadline:</strong> {{deadline}}</p>
          <p><strong>Time Remaining:</strong> {{timeRemaining}}</p>
        </div>
        <p><a href="{{rfqUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View RFQ</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'RFQ Deadline Reminder'),

      [NotificationEvent.RFQ_DEADLINE_PASSED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">RFQ Deadline Passed</h2>
        <p>Hello {{recipientName}},</p>
        <p>The deadline for the following RFQ has passed.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Deadline:</strong> {{deadline}}</p>
          <p><strong>Status:</strong> Closed</p>
        </div>
        <p><a href="{{rfqUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View RFQ</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'RFQ Deadline Passed'),

      // Bid Templates
      [NotificationEvent.BID_SUBMITTED]: this.getBaseTemplate(`
        <h2 style="color: #1976d2;">New Bid Submitted</h2>
        <p>Hello {{recipientName}},</p>
        <p>A new bid has been submitted for your RFQ.</p>
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>Bid ID:</strong> {{bidId}}</p>
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Company:</strong> {{companyName}}</p>
          <p><strong>Price:</strong> {{price}}</p>
          <p><strong>Delivery Time:</strong> {{deliveryTime}}</p>
        </div>
        <p><a href="{{bidUrl}}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Bid</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'New Bid Submitted'),

      [NotificationEvent.BID_ACCEPTED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Bid Accepted</h2>
        <p>Hello {{recipientName}},</p>
        <p>Congratulations! Your bid has been accepted.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Bid ID:</strong> {{bidId}}</p>
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Price:</strong> {{price}}</p>
        </div>
        <p>A contract will be generated shortly. You will receive another notification once it's ready for signature.</p>
        <p><a href="{{bidUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Bid</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Bid Accepted'),

      [NotificationEvent.BID_REJECTED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Bid Rejected</h2>
        <p>Hello {{recipientName}},</p>
        <p>Unfortunately, your bid has been rejected.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Bid ID:</strong> {{bidId}}</p>
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        <p><a href="{{bidUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Bid</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Bid Rejected'),

      // Contract Templates
      [NotificationEvent.CONTRACT_CREATED]: this.getBaseTemplate(`
        <h2 style="color: #1976d2;">Contract Created</h2>
        <p>Hello {{recipientName}},</p>
        <p>A new contract has been created and requires your signature.</p>
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>Contract Value:</strong> {{contractValue}}</p>
          <p><strong>Parties:</strong> {{parties}}</p>
        </div>
        <p><a href="{{contractUrl}}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign Contract</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Contract Created'),

      [NotificationEvent.CONTRACT_SIGNED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Contract Signed</h2>
        <p>Hello {{recipientName}},</p>
        <p>{{signerName}} has signed the contract.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>Signed By:</strong> {{signerName}}</p>
          <p><strong>Signed At:</strong> {{signedAt}}</p>
          <p><strong>Status:</strong> {{contractStatus}}</p>
        </div>
        <p><a href="{{contractUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Contract</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Contract Signed'),

      [NotificationEvent.CONTRACT_ACTIVATED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Contract Activated</h2>
        <p>Hello {{recipientName}},</p>
        <p>The contract has been activated. All parties have signed.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>End Date:</strong> {{endDate}}</p>
        </div>
        <p><a href="{{contractUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Contract</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Contract Activated'),

      // Payment Templates
      [NotificationEvent.PAYMENT_CREATED]: this.getBaseTemplate(`
        <h2 style="color: #1976d2;">Payment Created</h2>
        <p>Hello {{recipientName}},</p>
        <p>A new payment has been created and requires your approval.</p>
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Recipient:</strong> {{recipientName}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
        </div>
        <p><a href="{{paymentUrl}}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Created'),

      [NotificationEvent.PAYMENT_APPROVED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Payment Approved</h2>
        <p>Hello {{recipientName}},</p>
        <p>Your payment has been approved.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        <p><a href="{{paymentUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Approved'),

      [NotificationEvent.PAYMENT_COMPLETED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Payment Completed</h2>
        <p>Hello {{recipientName}},</p>
        <p>Your payment has been completed successfully.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Completed At:</strong> {{completedAt}}</p>
        </div>
        <p><a href="{{paymentUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Completed'),

      [NotificationEvent.PAYMENT_MILESTONE_DUE]: this.getBaseTemplate(`
        <h2 style="color: #ff9800;">Payment Milestone Due</h2>
        <p>Hello {{recipientName}},</p>
        <p>A payment milestone is approaching.</p>
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
        </div>
        <p><a href="{{paymentUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Milestone Due'),

      // Dispute Templates
      [NotificationEvent.DISPUTE_CREATED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Dispute Created</h2>
        <p>Hello {{recipientName}},</p>
        <p>A dispute has been raised regarding a contract.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Dispute ID:</strong> {{disputeId}}</p>
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>Raised By:</strong> {{raisedBy}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        <p><a href="{{disputeUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dispute</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Dispute Created'),

      [NotificationEvent.DISPUTE_ESCALATED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Dispute Escalated to Government</h2>
        <p>Hello {{recipientName}},</p>
        <p>A dispute has been escalated to government for review.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Dispute ID:</strong> {{disputeId}}</p>
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>Escalated At:</strong> {{escalatedAt}}</p>
        </div>
        <p><a href="{{disputeUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Dispute</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Dispute Escalated'),

      [NotificationEvent.DISPUTE_RESOLVED]: this.getBaseTemplate(`
        <h2 style="color: #388e3c;">Dispute Resolved</h2>
        <p>Hello {{recipientName}},</p>
        <p>The dispute has been resolved.</p>
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-left: 4px solid #388e3c;">
          <p><strong>Dispute ID:</strong> {{disputeId}}</p>
          <p><strong>Resolution:</strong> {{resolution}}</p>
          <p><strong>Resolved At:</strong> {{resolvedAt}}</p>
        </div>
        <p><a href="{{disputeUrl}}" style="background-color: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dispute</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Dispute Resolved'),

      // Additional events
      [NotificationEvent.BID_WITHDRAWN]: this.getBaseTemplate(`
        <h2 style="color: #757575;">Bid Withdrawn</h2>
        <p>Hello {{recipientName}},</p>
        <p>A bid has been withdrawn.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #757575;">
          <p><strong>Bid ID:</strong> {{bidId}}</p>
          <p><strong>RFQ ID:</strong> {{rfqId}}</p>
        </div>
        <p><a href="{{bidUrl}}" style="background-color: #757575; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View RFQ</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Bid Withdrawn'),

      [NotificationEvent.CONTRACT_EXPIRED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Contract Expired</h2>
        <p>Hello {{recipientName}},</p>
        <p>The contract has expired.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Contract ID:</strong> {{contractId}}</p>
          <p><strong>End Date:</strong> {{endDate}}</p>
        </div>
        <p><a href="{{contractUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Contract</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Contract Expired'),

      [NotificationEvent.PAYMENT_REJECTED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Payment Rejected</h2>
        <p>Hello {{recipientName}},</p>
        <p>Your payment has been rejected.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        <p><a href="{{paymentUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Rejected'),

      [NotificationEvent.PAYMENT_FAILED]: this.getBaseTemplate(`
        <h2 style="color: #d32f2f;">Payment Failed</h2>
        <p>Hello {{recipientName}},</p>
        <p>We regret to inform you that a payment has failed during processing.</p>
        <div style="background-color: #ffebee; padding: 15px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Milestone:</strong> {{milestone}}</p>
          <p><strong>Failure Reason:</strong> {{failureReason}}</p>
          <p><strong>Failed At:</strong> {{failedAt}}</p>
        </div>
        <p style="color: #d32f2f; font-weight: bold;">Action Required:</p>
        <p>Please review the payment details and retry the payment or update your payment method. The payment can be retried from your payment dashboard.</p>
        <p><a href="{{paymentUrl}}" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment & Retry</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Failed'),

      [NotificationEvent.PAYMENT_RETRY]: this.getBaseTemplate(`
        <h2 style="color: #1976d2;">Payment Retry Initiated</h2>
        <p>Hello {{recipientName}},</p>
        <p>A payment retry has been initiated for a previously failed payment.</p>
        <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>Payment ID:</strong> {{paymentId}}</p>
          <p><strong>Amount:</strong> {{amount}}</p>
          <p><strong>Milestone:</strong> {{milestone}}</p>
          <p><strong>Retry Attempt:</strong> {{retryCount}}</p>
          <p><strong>Previous Failure Reason:</strong> {{failureReason}}</p>
        </div>
        <p>The payment is now in approved status and will be processed shortly. You will receive another notification once the payment is completed.</p>
        <p><a href="{{paymentUrl}}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a></p>
        <p>Best regards,<br>TriLink Team</p>
      `, 'Payment Retry Initiated'),
    };

    return templates[event] || this.getBaseTemplate(`
      <h2>Notification</h2>
      <p>{{message}}</p>
    `);
  }
}

export const emailTemplateService = new EmailTemplateService();
