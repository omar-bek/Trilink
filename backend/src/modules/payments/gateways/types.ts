/**
 * Payment Gateway Types
 */

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export interface PaymentIntent {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string; // For Stripe
  redirectUrl?: string; // For PayPal
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  paymentId: string; // Internal payment ID
  description?: string;
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  gateway: PaymentGateway;
  timestamp: Date;
}

export interface IPaymentGateway {
  /**
   * Create a payment intent/order
   */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent;

  /**
   * Get payment status from gateway
   */
  getPaymentStatus(intentId: string): Promise<PaymentIntent>;
}
