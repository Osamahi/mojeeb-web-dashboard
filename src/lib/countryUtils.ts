/**
 * Country display utilities.
 * Converts ISO 3166-1 alpha-2 country codes to flag emoji + code labels.
 * Zero dependencies — uses Unicode regional indicator symbols.
 */

const REGIONAL_INDICATOR_A = 0x1F1E6; // 🇦
const ASCII_A = 65; // 'A'

/**
 * Convert a 2-letter ISO country code into its flag emoji.
 * Returns empty string for null/invalid input.
 *
 * @example
 *   countryToFlag('EG') // '🇪🇬'
 *   countryToFlag('us') // '🇺🇸' (case-insensitive)
 *   countryToFlag(null) // ''
 */
export function countryToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const up = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(up)) return '';
  return String.fromCodePoint(
    REGIONAL_INDICATOR_A + up.charCodeAt(0) - ASCII_A,
    REGIONAL_INDICATOR_A + up.charCodeAt(1) - ASCII_A,
  );
}

/**
 * Format a country code for display as "🇪🇬 EG".
 * Falls back to an em-dash placeholder when the code is missing.
 */
export function formatCountry(code: string | null | undefined, placeholder = '—'): string {
  if (!code) return placeholder;
  const flag = countryToFlag(code);
  const upper = code.toUpperCase();
  return flag ? `${flag} ${upper}` : upper;
}
