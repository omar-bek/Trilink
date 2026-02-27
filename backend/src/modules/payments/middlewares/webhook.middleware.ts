import { Request, Response, NextFunction } from 'express';
import { raw } from 'express';

/**
 * Middleware to capture raw body for webhook signature verification
 * Stripe and PayPal require raw body for signature verification
 * This must be used before express.json() middleware
 */
export const rawBodyMiddleware = raw({ 
  type: 'application/json',
  verify: (req: any, _res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString('utf8');
  }
});

/**
 * Middleware to extract webhook signature from headers
 */
export const extractWebhookSignature = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Stripe webhook signature
  const stripeSignature = req.headers['stripe-signature'] as string;
  if (stripeSignature) {
    (req as any).webhookSignature = stripeSignature;
    (req as any).webhookGateway = 'stripe';
    return next();
  }

  // PayPal webhook signature
  const paypalSignature = req.headers['paypal-transmission-sig'] as string;
  if (paypalSignature) {
    (req as any).webhookSignature = paypalSignature;
    (req as any).webhookGateway = 'paypal';
    return next();
  }

  // No signature found, continue without verification (for development)
  next();
};
