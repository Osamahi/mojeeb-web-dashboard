/**
 * Currency Detection Service
 * Centralized service for detecting user's currency with multiple fallback strategies
 */

import type { SupportedCurrency, CurrencyDetectionSource } from './types';

export class CurrencyService {
  /**
   * Detects user's currency using fallback chain:
   * 1. Subscription currency (most accurate)
   * 2. Saved user preference in localStorage
   * 3. Browser timezone detection
   * 4. Default to USD
   */
  static detectCurrency(source?: CurrencyDetectionSource): SupportedCurrency {
    // 1. Try subscription currency (primary source)
    if (source?.subscription?.currency) {
      const currency = source.subscription.currency.toUpperCase();
      if (this.isSupportedCurrency(currency)) {
        return currency as SupportedCurrency;
      }
    }

    // 2. Try localStorage preference (if user manually changed it in the future)
    try {
      const savedCurrency = localStorage.getItem('mojeeb-preferred-currency');
      if (savedCurrency && this.isSupportedCurrency(savedCurrency)) {
        return savedCurrency as SupportedCurrency;
      }
    } catch {
      // localStorage might not be available (SSR, privacy mode, etc.)
    }

    // 3. Detect from browser timezone
    const timezoneCurrency = this.detectCurrencyFromTimezone();
    if (timezoneCurrency) {
      return timezoneCurrency;
    }

    // 4. Default fallback
    return 'USD';
  }

  /**
   * Detects currency based on browser timezone
   * Uses Intl API to get user's timezone and maps to currency
   */
  static detectCurrencyFromTimezone(): SupportedCurrency | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Timezone to currency mapping
      const TIMEZONE_TO_CURRENCY: Record<string, SupportedCurrency> = {
        // Egypt
        'Africa/Cairo': 'EGP',

        // Saudi Arabia
        'Asia/Riyadh': 'SAR',
        'Asia/Kuwait': 'SAR',
        'Asia/Bahrain': 'SAR',
        'Asia/Qatar': 'SAR',
        'Asia/Dubai': 'SAR',
        'Asia/Muscat': 'SAR',

        // United States
        'America/New_York': 'USD',
        'America/Chicago': 'USD',
        'America/Denver': 'USD',
        'America/Los_Angeles': 'USD',
        'America/Phoenix': 'USD',
        'America/Anchorage': 'USD',
        'America/Honolulu': 'USD',

        // Add more timezone mappings as needed
      };

      return TIMEZONE_TO_CURRENCY[timezone] || null;
    } catch {
      return null;
    }
  }

  /**
   * Gets the currency symbol for a given currency code
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<SupportedCurrency, string> = {
      USD: '$',
      EGP: 'EGP',
      SAR: 'SR',
    };

    return symbols[currency as SupportedCurrency] || '$';
  }

  /**
   * Gets the display name for a given currency code
   */
  static getCurrencyName(currency: string): string {
    const names: Record<SupportedCurrency, string> = {
      USD: 'US Dollar',
      EGP: 'Egyptian Pound',
      SAR: 'Saudi Riyal',
    };

    return names[currency as SupportedCurrency] || currency;
  }

  /**
   * Checks if a currency code is supported
   */
  static isSupportedCurrency(currency: string): boolean {
    return ['USD', 'EGP', 'SAR'].includes(currency.toUpperCase());
  }

  /**
   * Saves user's currency preference to localStorage (for future use)
   */
  static saveCurrencyPreference(currency: SupportedCurrency): void {
    try {
      localStorage.setItem('mojeeb-preferred-currency', currency);
    } catch {
      // Fail silently if localStorage is not available
    }
  }

  /**
   * Gets all supported currencies with their info
   */
  static getSupportedCurrencies() {
    const currencies: SupportedCurrency[] = ['USD', 'EGP', 'SAR'];

    return currencies.map((code) => ({
      code,
      symbol: this.getCurrencySymbol(code),
      name: this.getCurrencyName(code),
    }));
  }
}
