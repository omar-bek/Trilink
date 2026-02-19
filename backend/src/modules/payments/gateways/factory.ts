import { IPaymentGateway } from './types';
import { PaymentGateway } from './types';
import { StripeGateway } from './stripe.gateway';
import { PayPalGateway } from './paypal.gateway';
import { config } from '../../../config/env';

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 */
export class PaymentGatewayFactory {
  private static gateways: Map<PaymentGateway, IPaymentGateway> = new Map();

  /**
   * Get or create a gateway instance
   */
  static getGateway(gateway: PaymentGateway): IPaymentGateway {
    if (this.gateways.has(gateway)) {
      return this.gateways.get(gateway)!;
    }

    let gatewayInstance: IPaymentGateway;

    switch (gateway) {
      case PaymentGateway.STRIPE:
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        gatewayInstance = new StripeGateway(stripeKey);
        break;

      case PaymentGateway.PAYPAL:
        const paypalClientId = process.env.PAYPAL_CLIENT_ID;
        const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
        const paypalEnv = (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
        
        if (!paypalClientId || !paypalSecret) {
          throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required');
        }
        gatewayInstance = new PayPalGateway(paypalClientId, paypalSecret, paypalEnv);
        break;

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }

    this.gateways.set(gateway, gatewayInstance);
    return gatewayInstance;
  }

  /**
   * Clear cached gateways (useful for testing)
   */
  static clearCache(): void {
    this.gateways.clear();
  }
}
