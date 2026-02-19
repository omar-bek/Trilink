# Email Notification System

## Overview

Comprehensive email notification system for TriLink platform using SendGrid/Nodemailer with event-driven triggers and scheduled jobs.

## Features

- ✅ **Dual Email Provider Support**: SendGrid (production) or Nodemailer/SMTP (development)
- ✅ **Event-Driven Notifications**: Automatic notifications on key events
- ✅ **Scheduled Jobs**: RFQ deadline reminders and payment milestone notifications
- ✅ **Email Templates**: HTML email templates for all notification types
- ✅ **Role-Based Recipients**: Automatic recipient selection based on roles
- ✅ **Error Handling**: Graceful error handling with logging

## Notification Events

### RFQ Events
- `RFQ_CREATED` - New RFQ available
- `RFQ_DEADLINE_REMINDER` - RFQ deadline approaching
- `RFQ_DEADLINE_PASSED` - RFQ deadline passed

### Bid Events
- `BID_SUBMITTED` - New bid submitted
- `BID_ACCEPTED` - Bid accepted
- `BID_REJECTED` - Bid rejected
- `BID_WITHDRAWN` - Bid withdrawn

### Contract Events
- `CONTRACT_CREATED` - Contract created
- `CONTRACT_SIGNED` - Contract signed
- `CONTRACT_ACTIVATED` - Contract activated
- `CONTRACT_EXPIRED` - Contract expired

### Payment Events
- `PAYMENT_CREATED` - Payment created
- `PAYMENT_APPROVED` - Payment approved
- `PAYMENT_REJECTED` - Payment rejected
- `PAYMENT_COMPLETED` - Payment completed
- `PAYMENT_MILESTONE_DUE` - Payment milestone due

### Dispute Events
- `DISPUTE_CREATED` - Dispute created
- `DISPUTE_ESCALATED` - Dispute escalated to government
- `DISPUTE_RESOLVED` - Dispute resolved

## Setup

### 1. Install Dependencies

```bash
npm install @sendgrid/mail nodemailer node-cron
npm install --save-dev @types/nodemailer @types/node-cron
```

### 2. Environment Variables

Add to `.env`:

```env
# Option 1: SendGrid (Recommended for production)
SENDGRID_API_KEY=your-sendgrid-api-key-here

# Option 2: SMTP (Gmail, Outlook, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM=noreply@trilink.com
EMAIL_FROM_NAME=TriLink Platform
FRONTEND_URL=http://localhost:3001
```

### 3. Initialize Notification Service

The notification service is automatically initialized when imported. To start scheduled jobs:

```typescript
import { notificationScheduler } from './modules/notifications/scheduler';

// In server.ts
notificationScheduler.start();
```

## Usage

### Manual Notification

```typescript
import { notificationService, NotificationEvent } from './modules/notifications';

await notificationService.notify({
  event: NotificationEvent.BID_SUBMITTED,
  recipients: [
    { email: 'buyer@example.com', name: 'Buyer Name' }
  ],
  data: {
    recipientName: 'Buyer Name',
    bidId: '123',
    rfqId: '456',
    companyName: 'Provider Co',
    price: '$10,000',
    deliveryTime: '30 days',
    bidUrl: 'http://localhost:3001/bids/123',
  },
});
```

### Helper Methods

```typescript
import { notificationService } from './modules/notifications';
import { notificationHelpers } from './modules/notifications/helpers';

// Get recipients by company
const recipients = await notificationHelpers.getRecipientsByCompany(
  companyId,
  [Role.BUYER]
);

// Send RFQ deadline reminder
await notificationService.sendRFQDeadlineReminder(rfq, recipients);

// Send bid submission notification
await notificationService.sendBidSubmittedNotification(bid, rfq, recipients);

// Send contract signature notification
await notificationService.sendContractSignedNotification(contract, signer, recipients);

// Send payment milestone notification
await notificationService.sendPaymentMilestoneNotification(payment, recipients);

// Send dispute escalation notification
await notificationService.sendDisputeEscalationNotification(dispute, governmentRecipients);
```

## Integration Examples

### Bid Submission Notification

```typescript
// In bids/service.ts
import { notificationService, NotificationEvent } from '../notifications';
import { notificationHelpers } from '../notifications/helpers';

async createBid(...) {
  // ... create bid logic ...
  
  // Send notification
  const buyerRecipients = await notificationHelpers.getRecipientsByCompany(
    rfq.companyId.toString(),
    [Role.BUYER]
  );
  
  if (buyerRecipients.length > 0) {
    await notificationService.sendBidSubmittedNotification(
      bid,
      rfq,
      buyerRecipients
    );
  }
}
```

### Contract Signature Notification

```typescript
// In contracts/service.ts
async signContract(...) {
  // ... sign contract logic ...
  
  // Notify all parties
  const allParties = contract.parties;
  for (const party of allParties) {
    if (party.userId.toString() !== userId) {
      const recipients = await notificationHelpers.getRecipientsByCompany(
        party.companyId.toString(),
        []
      );
      
      await notificationService.sendContractSignedNotification(
        contract,
        signer,
        recipients
      );
    }
  }
}
```

### Dispute Escalation Notification

```typescript
// In disputes/service.ts
async escalateDispute(...) {
  // ... escalate logic ...
  
  // Notify government users
  const governmentRecipients = await notificationHelpers.getGovernmentRecipients();
  
  if (governmentRecipients.length > 0) {
    await notificationService.sendDisputeEscalationNotification(
      dispute,
      governmentRecipients
    );
  }
}
```

## Scheduled Jobs

### RFQ Deadline Reminders

- **Frequency**: Every hour
- **Checks**: RFQs with deadlines in next 24 hours
- **Actions**:
  - Sends reminder emails
  - Closes RFQs past deadline
  - Notifies buyers of closed RFQs

### Payment Milestone Reminders

- **Frequency**: Daily at 9 AM
- **Checks**: Payments due in next 7 days
- **Actions**: Sends reminder emails to relevant parties

## Email Templates

Templates are HTML-based with placeholder replacement (`{{variable}}`). All templates include:
- TriLink branding
- Responsive design
- Clear call-to-action buttons
- Footer with disclaimer

### Template Variables

Each event has specific template variables. Common variables:
- `recipientName` - Recipient's name
- `baseUrl` - Frontend URL
- Event-specific IDs (rfqId, bidId, contractId, etc.)
- Formatted dates and amounts

## Testing

### Development Mode

In development, if no SMTP credentials are provided, Nodemailer uses Ethereal test accounts. Check logs for test email URLs.

### SendGrid Test Mode

SendGrid provides a test mode. Use test API key for development.

## Error Handling

All notification errors are logged but don't block main operations:

```typescript
try {
  await notificationService.notify(...);
} catch (error) {
  logger.error('Notification failed:', error);
  // Continue with main operation
}
```

## Best Practices

1. **Non-Blocking**: Notifications should never block main operations
2. **Error Handling**: Always wrap notifications in try-catch
3. **Recipient Validation**: Check recipients exist before sending
4. **Template Variables**: Always provide all required template variables
5. **Logging**: Log all notification attempts (success and failure)
6. **Testing**: Test with real email addresses before production

## Production Considerations

1. **SendGrid**: Recommended for production (better deliverability)
2. **Rate Limiting**: SendGrid has rate limits (check your plan)
3. **Bounce Handling**: Implement bounce handling for invalid emails
4. **Unsubscribe**: Consider adding unsubscribe links
5. **Monitoring**: Monitor email delivery rates
6. **Templates**: Use SendGrid Dynamic Templates for better customization

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Verify SendGrid API key or SMTP credentials
3. Check logs for error messages
4. Test email service connection: `emailService.verifyConnection()`

### Template Variables Not Replacing

1. Ensure all variables are provided in `data` object
2. Check variable names match template placeholders (case-sensitive)
3. Verify template is loaded correctly

### Scheduled Jobs Not Running

1. Ensure `notificationScheduler.start()` is called in server.ts
2. Check cron syntax is correct
3. Verify server timezone settings

## Future Enhancements

- [ ] Email preferences per user
- [ ] Unsubscribe functionality
- [ ] Email queue for retry logic
- [ ] SMS notifications integration
- [ ] Push notifications
- [ ] Email analytics
- [ ] Template editor UI
- [ ] A/B testing for templates
