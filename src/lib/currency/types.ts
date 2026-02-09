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
  subscription?: { currency: string } | null;
}
