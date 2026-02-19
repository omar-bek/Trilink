# Payment Gateway Integration

## Overview

This document describes the payment gateway integration for Stripe and PayPal, replacing the previous setTimeout simulation with real payment processing logic.

## Features

- ✅ **Stripe Integration**: Full support for Stripe payment intents
- ✅ **PayPal Integration**: Support for PayPal orders and payments
- ✅ **Webhook Handling**: Secure webhook endpoints for both gateways
- ✅ **Signature Verification**: Webhook signature verification for security
- ✅ **Real-time Updates**: Socket.io events for payment status changes
- ✅ **Error Handling**: Comprehensive error handling and logging

## Architecture

### Payment Gateway Services

The payment gateway system uses a factory pattern with interface-based design:

- `IPaymentGateway`: Interface defining gateway operations
- `StripeGateway`: Stripe implementation
- `PayPalGateway`: PayPal implementation
- `PaymentGatewayFactory`: Factory for creating gateway instances

### Payment Flow

1. **Payment Approval**: Buyer approves payment (status: `PENDING_APPROVAL` → `APPROVED`)
2. **Payment Processing**: System creates payment intent/order with gateway (status: `APPROVED` → `PROCESSING`)
3. **Gateway Processing**: User completes payment on gateway (Stripe/PayPal)
4. **Webhook Callback**: Gateway sends webhook to update payment status
5. **Status Update**: Payment status updated based on webhook (status: `PROCESSING` → `COMPLETED`/`FAILED`)

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_ENVIRONMENT=sandbox  # or 'production'
PAYPAL_WEBHOOK_SECRET=your_paypal_webhook_secret_here
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/payments/webhooks/stripe`
4. Configure webhook events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
5. Copy the webhook signing secret

### PayPal Setup

1. Create a PayPal Developer account at https://developer.paypal.com
2. Create an app and get Client ID and Secret
3. Set up webhook endpoint: `https://your-domain.com/api/payments/webhooks/paypal`
4. Configure webhook events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `CHECKOUT.ORDER.APPROVED`
5. Copy the webhook secret

## API Endpoints

### Process Payment

```http
POST /api/payments/:id/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "card",
  "gateway": "stripe",  // or "paypal"
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment_id",
    "status": "processing",
    "gateway": "stripe",
    "gatewayIntentId": "pi_xxx",
    "gatewayClientSecret": "pi_xxx_secret_xxx",  // For Stripe
    "gatewayRedirectUrl": "https://..."  // For PayPal
  }
}
```

### Webhook Endpoints

#### Stripe Webhook
```http
POST /api/payments/webhooks/stripe
Stripe-Signature: <signature>
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "status": "succeeded",
      "metadata": {
        "paymentId": "internal_payment_id"
      }
    }
  }
}
```

#### PayPal Webhook
```http
POST /api/payments/webhooks/paypal
PayPal-Transmission-Sig: <signature>
Content-Type: application/json

{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "capture_id",
    "custom_id": "internal_payment_id"
  }
}
```

## Payment Schema Updates

The payment schema now includes gateway-specific fields:

```typescript
{
  gateway: 'stripe' | 'paypal',
  gatewayIntentId: string,  // Payment intent/order ID
  gatewayClientSecret: string,  // Stripe client secret
  gatewayRedirectUrl: string,  // PayPal redirect URL
  transactionId: string,  // Final transaction ID from gateway
}
```

## Frontend Integration

### Stripe

```javascript
// After processing payment, use client secret
const stripe = Stripe('pk_test_...');
const { error } = await stripe.confirmCardPayment(
  payment.gatewayClientSecret,
  {
    payment_method: {
      card: cardElement,
    }
  }
);
```

### PayPal

```javascript
// Redirect user to PayPal approval URL
window.location.href = payment.gatewayRedirectUrl;

// After approval, PayPal redirects back with order ID
// Capture the order server-side or handle via webhook
```

## Testing

### Stripe Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### PayPal Sandbox

Use PayPal sandbox accounts for testing. Test cards are available in the PayPal Developer Dashboard.

## Security Considerations

1. **Webhook Signature Verification**: All webhooks are verified using gateway-provided signatures
2. **HTTPS Required**: Webhooks should only be received over HTTPS in production
3. **Secret Management**: Store gateway secrets securely, never commit to version control
4. **Idempotency**: Webhook handlers are idempotent to prevent duplicate processing

## Error Handling

The system handles various error scenarios:

- **Gateway Unavailable**: Payment status set to `FAILED`
- **Invalid Signature**: Webhook rejected with 401
- **Payment Failed**: Status updated via webhook
- **Network Errors**: Logged and retried by gateway

## Monitoring

Monitor payment processing:

- Check payment status transitions
- Monitor webhook delivery
- Track failed payments
- Review gateway logs

## Notes

- **PayPal SDK**: The `@paypal/checkout-server-sdk` package is deprecated. Consider migrating to `@paypal/paypal-server-sdk` in the future.
- **Stripe API Version**: Currently using `2024-11-20.acacia`. Update periodically for new features.
- **Webhook Retries**: Both Stripe and PayPal automatically retry failed webhooks.

## Migration from setTimeout

The previous setTimeout simulation has been completely replaced:

- ✅ Real gateway integration
- ✅ Webhook-based status updates
- ✅ Proper error handling
- ✅ Transaction tracking
- ✅ Gateway-specific metadata

## Support

For issues or questions:
- Stripe: https://stripe.com/docs/support
- PayPal: https://developer.paypal.com/support
