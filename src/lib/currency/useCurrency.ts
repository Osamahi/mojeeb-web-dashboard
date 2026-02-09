/**
 * useCurrency Hook
 * React hook for accessing currency information throughout the application
 * Automatically detects currency from subscription with fallback strategies
 */

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { CurrencyService } from './currencyService';
import type { SupportedCurrency } from './types';

export interface UseCurrencyReturn {
  /** Current currency code (e.g., 'USD', 'EGP', 'SAR') */
  currency: SupportedCurrency;

  /** Currency symbol (e.g., '$', 'E£', 'SR') */
  symbol: string;

  /** Currency display name (e.g., 'US Dollar', 'Egyptian Pound') */
  name: string;

  /** Check if a specific currency is currently active */
  isCurrency: (code: SupportedCurrency) => boolean;
}

/**
 * Hook to get current user's currency information
 *
 * @example
 * ```tsx
 * function PricingComponent() {
 *   const { currency, symbol, name } = useCurrency();
 *
 *   return (
 *     <div>
 *       <p>Price: {symbol}99.99</p>
 *       <p>Currency: {name} ({currency})</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCurrency(): UseCurrencyReturn {
  // Get subscription from Zustand store
  const subscription = useSubscriptionStore((state) => state.subscription);

  // Detect currency with memoization (only recalculate if subscription currency changes)
  const currency = useMemo(
    () => CurrencyService.detectCurrency({ subscription }),
    [subscription?.currency]
  );

  // Get currency symbol (memoized)
  const symbol = useMemo(
    () => CurrencyService.getCurrencySymbol(currency),
    [currency]
  );

  // Get currency display name (memoized)
  const name = useMemo(
    () => CurrencyService.getCurrencyName(currency),
    [currency]
  );

  // Helper function to check if a specific currency is active
  const isCurrency = useMemo(
    () => (code: SupportedCurrency) => currency === code,
    [currency]
  );

  return {
    currency,
    symbol,
    name,
    isCurrency,
  };
}
