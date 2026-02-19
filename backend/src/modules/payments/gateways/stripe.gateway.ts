import Stripe from 'stripe';
import { IPaymentGateway, PaymentIntent, CreatePaymentIntentParams, WebhookEvent } from './types';
import { PaymentGateway } from './types';
import { logger } from '../../../utils/logger';

export class StripeGateway implements IPaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Stripe API key is required');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        description: params.description || `Payment ${params.paymentId}`,
        metadata: {
          paymentId: params.paymentId,
          ...params.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        gateway: PaymentGateway.STRIPE,
        amount: params.amount,
        currency: params.currency,
        status: this.mapStripeStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret || undefined,
        metadata: {
          paymentId: params.paymentId,
          ...params.metadata,
        },
      };
    } catch (error: any) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
      this.stripe.webhooks.constructEvent(payloadString, signature, secret);
      return true;
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent {
    const event = payload as Stripe.Event;

    return {
      id: event.id,
      type: event.type,
      data: event.data,
      gateway: PaymentGateway.STRIPE,
      timestamp: new Date(event.created * 1000),
    };
  }

  /**
   * Get payment status from Stripe
   */
  async getPaymentStatus(intentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(intentId);

      return {
        id: paymentIntent.id,
        gateway: PaymentGateway.STRIPE,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: this.mapStripeStatus(paymentIntent.status),
        metadata: paymentIntent.metadata as Record<string, string>,
      };
    } catch (error: any) {
      logger.error('Failed to retrieve Stripe payment status:', error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Map Stripe status to our status
   */
  private mapStripeStatus(status: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'pending',
      processing: 'processing',
      requires_capture: 'processing',
      succeeded: 'succeeded',
      canceled: 'canceled',
      payment_failed: 'failed',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Handle Stripe webhook events
   */
  handleWebhookEvent(event: Stripe.Event): {
    paymentId: string;
    status: PaymentIntent['status'];
    transactionId: string;
  } | null {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentId = paymentIntent.metadata?.paymentId;

    if (!paymentId) {
      logger.warn('Stripe webhook event missing paymentId metadata');
      return null;
    }

    let status: PaymentIntent['status'] = 'pending';

    switch (event.type) {
      case 'payment_intent.succeeded':
        status = 'succeeded';
        break;
      case 'payment_intent.payment_failed':
        status = 'failed';
        break;
      case 'payment_intent.canceled':
        status = 'canceled';
        break;
      case 'payment_intent.processing':
        status = 'processing';
        break;
      default:
        return null; // Ignore other events
    }

    return {
      paymentId,
      status,
      transactionId: paymentIntent.id,
    };
  }
}
