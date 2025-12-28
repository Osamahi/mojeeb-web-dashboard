import { loadStripe, Stripe } from '@stripe/stripe-js';
import { logger } from './logger';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or initialize the Stripe instance
 *
 * @returns Promise resolving to Stripe instance or null if publishable key not configured
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      logger.warn(
        '[Stripe]',
        'Stripe publishable key not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in .env'
      );
      return Promise.resolve(null);
    }

    if (!publishableKey.startsWith('pk_')) {
      logger.error(
        '[Stripe]',
        'Invalid Stripe publishable key format. Key must start with pk_'
      );
      return Promise.resolve(null);
    }

    logger.info('[Stripe]', 'Initializing Stripe with publishable key');
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

/**
 * Check if Stripe is configured
 *
 * @returns true if Stripe publishable key is available
 */
export const isStripeConfigured = (): boolean => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey && publishableKey.startsWith('pk_');
};
