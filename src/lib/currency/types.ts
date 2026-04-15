/**
 * Currency types and interfaces
 * Centralized currency definitions for the application
 */

export type SupportedCurrency = 'USD' | 'EGP' | 'SAR';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
}

export interface CurrencyDetectionSource {
  subscription?: {
    currency: string;
    /** Subscription amount — 0 means free plan (placeholder currency, don't trust it) */
    amount?: number;
    /** Plan code — `"free_production"` means free plan (placeholder currency, don't trust it) */
    planCode?: string;
  } | null;
}
