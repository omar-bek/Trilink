import paypal from '@paypal/checkout-server-sdk';
import { IPaymentGateway, PaymentIntent, CreatePaymentIntentParams, WebhookEvent } from './types';
import { PaymentGateway } from './types';
import { logger } from '../../../utils/logger';

export class PayPalGateway implements IPaymentGateway {
  private client: paypal.core.PayPalHttpClient;

  constructor(clientId: string, clientSecret: string, environment: 'sandbox' | 'production' = 'sandbox') {
    if (!clientId || !clientSecret) {
      throw new Error('PayPal client ID and secret are required');
    }

    const environmentConfig =
      environment === 'production'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.client = new paypal.core.PayPalHttpClient(environmentConfig);
  }

  /**
   * Create a PayPal order
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
            description: params.description || `Payment ${params.paymentId}`,
            custom_id: params.paymentId,
          },
        ],
        application_context: {
          brand_name: 'TriLink Platform',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payments/success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payments/cancel`,
        },
      });

      const order = await this.client.execute(request);

      if (order.statusCode !== 201 || !order.result) {
        throw new Error(`PayPal order creation failed: ${order.statusCode}`);
      }

      const orderData = order.result;
      const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        id: orderData.id || '',
        gateway: PaymentGateway.PAYPAL,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        redirectUrl: approvalUrl,
        metadata: {
          paymentId: params.paymentId,
          ...params.metadata,
        },
      };
    } catch (error: any) {
      logger.error('PayPal order creation failed:', error);
      throw new Error(`PayPal error: ${error.message}`);
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
    // PayPal webhook verification requires additional setup
    // For now, we'll use a simple header check
    // In production, implement proper signature verification using PayPal SDK
    try {
      // Basic validation - in production, use PayPal's webhook verification API
      return signature && secret ? true : false;
    } catch (error) {
      logger.error('PayPal webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      id: payload.id || payload.event_id || '',
      type: payload.event_type || payload.resource_type || '',
      data: payload,
      gateway: PaymentGateway.PAYPAL,
      timestamp: new Date(payload.create_time || Date.now()),
    };
  }

  /**
   * Get payment status from PayPal
   */
  async getPaymentStatus(orderId: string): Promise<PaymentIntent> {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await this.client.execute(request);

      if (order.statusCode !== 200 || !order.result) {
        throw new Error(`PayPal order retrieval failed: ${order.statusCode}`);
      }

      const orderData = order.result;
      const purchaseUnit = orderData.purchase_units?.[0];
      const paymentId = purchaseUnit?.custom_id || '';

      return {
        id: orderData.id || '',
        gateway: PaymentGateway.PAYPAL,
        amount: parseFloat(purchaseUnit?.amount?.value || '0'),
        currency: purchaseUnit?.amount?.currency_code || '',
        status: this.mapPayPalStatus(orderData.status),
        metadata: {
          paymentId,
        },
      };
    } catch (error: any) {
      logger.error('Failed to retrieve PayPal payment status:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }

  /**
   * Map PayPal status to our status
   */
  private mapPayPalStatus(status: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      CREATED: 'pending',
      SAVED: 'pending',
      APPROVED: 'pending',
      VOIDED: 'canceled',
      COMPLETED: 'succeeded',
      PAYER_ACTION_REQUIRED: 'pending',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Handle PayPal webhook events
   */
  handleWebhookEvent(event: any): {
    paymentId: string;
    status: PaymentIntent['status'];
    transactionId: string;
  } | null {
    const resource = event.resource || event;
    const paymentId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;

    if (!paymentId) {
      logger.warn('PayPal webhook event missing paymentId');
      return null;
    }

    let status: PaymentIntent['status'] = 'pending';
    const eventType = event.event_type || event.resource_type || '';

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.COMPLETED':
        status = 'succeeded';
        break;
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        status = 'failed';
        break;
      case 'CHECKOUT.ORDER.APPROVED':
        status = 'processing';
        break;
      default:
        return null; // Ignore other events
    }

    return {
      paymentId,
      status,
      transactionId: resource.id || resource.order_id || '',
    };
  }

  /**
   * Capture a PayPal order (after user approval)
   */
  async captureOrder(orderId: string): Promise<PaymentIntent> {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      const capture = await this.client.execute(request);

      if (capture.statusCode !== 201 || !capture.result) {
        throw new Error(`PayPal order capture failed: ${capture.statusCode}`);
      }

      const captureData = capture.result;
      const purchaseUnit = captureData.purchase_units?.[0];
      const paymentId = purchaseUnit?.custom_id || '';

      return {
        id: captureData.id || '',
        gateway: PaymentGateway.PAYPAL,
        amount: parseFloat(purchaseUnit?.amount?.value || '0'),
        currency: purchaseUnit?.amount?.currency_code || '',
        status: this.mapPayPalStatus(captureData.status),
        metadata: {
          paymentId,
        },
      };
    } catch (error: any) {
      logger.error('PayPal order capture failed:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }
}
