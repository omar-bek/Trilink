export enum NotificationEvent {
  // RFQ Events
  RFQ_CREATED = 'rfq.created',
  RFQ_DEADLINE_REMINDER = 'rfq.deadline.reminder',
  RFQ_DEADLINE_PASSED = 'rfq.deadline.passed',
  
  // Bid Events
  BID_SUBMITTED = 'bid.submitted',
  BID_ACCEPTED = 'bid.accepted',
  BID_REJECTED = 'bid.rejected',
  BID_WITHDRAWN = 'bid.withdrawn',
  
  // Contract Events
  CONTRACT_CREATED = 'contract.created',
  CONTRACT_SIGNED = 'contract.signed',
  CONTRACT_ACTIVATED = 'contract.activated',
  CONTRACT_EXPIRED = 'contract.expired',
  
  // Payment Events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_APPROVED = 'payment.approved',
  PAYMENT_REJECTED = 'payment.rejected',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_RETRY = 'payment.retry',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_MILESTONE_DUE = 'payment.milestone.due',
  
  // Dispute Events
  DISPUTE_CREATED = 'dispute.created',
  DISPUTE_ESCALATED = 'dispute.escalated',
  DISPUTE_RESOLVED = 'dispute.resolved',
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template: string;
  data: Record<string, any>;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface NotificationPayload {
  event: NotificationEvent;
  recipients: EmailRecipient[];
  data: Record<string, any>;
  metadata?: Record<string, any>;
}
