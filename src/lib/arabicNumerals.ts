/**
 * Arabic-Indic Numerals Conversion Utility
 *
 * Provides automatic conversion of Western numerals (0-9) to Arabic-Indic numerals (٠-٩).
 * This is a lightweight string-based approach that works globally without component updates.
 *
 * Usage:
 * ```typescript
 * import { toArabicNumerals } from '@/lib/arabicNumerals';
 *
 * const text = "Count: 123";
 * console.log(toArabicNumerals(text)); // "Count: ١٢٣"
 * ```
 */

/**
 * Map of Western digits to Arabic-Indic digits
 */
const WESTERN_TO_ARABIC_DIGITS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

/**
 * Converts Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
 *
 * This function performs a simple character replacement, converting all
 * Western digits in a string to their Arabic-Indic equivalents.
 *
 * @param text - The text containing Western numerals
 * @returns Text with Arabic-Indic numerals
 *
 * @example
 * ```typescript
 * toArabicNumerals("123")           // "١٢٣"
 * toArabicNumerals("Price: $99.99") // "Price: $٩٩.٩٩"
 * toArabicNumerals("ID: 42")        // "ID: ٤٢"
 * ```
 */
export function toArabicNumerals(text: string | number | null | undefined): string {
  // Handle null/undefined
  if (text === null || text === undefined) {
    return '';
  }

  // Convert to string if it's a number
  const str = String(text);

  // Replace all Western digits with Arabic-Indic digits
  return str.replace(/[0-9]/g, (digit) => WESTERN_TO_ARABIC_DIGITS[digit]);
}

/**
 * Converts Arabic-Indic numerals (٠-٩) back to Western numerals (0-9)
 *
 * Useful for parsing user input that may contain Arabic-Indic numerals.
 *
 * @param text - The text containing Arabic-Indic numerals
 * @returns Text with Western numerals
 *
 * @example
 * ```typescript
 * toWesternNumerals("١٢٣")     // "123"
 * toWesternNumerals("ID: ٤٢")  // "ID: 42"
 * ```
 */
export function toWesternNumerals(text: string | number | null | undefined): string {
  // Handle null/undefined
  if (text === null || text === undefined) {
    return '';
  }

  // Convert to string if it's a number
  const str = String(text);

  // Create reverse mapping
  const ARABIC_TO_WESTERN_DIGITS: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  // Replace all Arabic-Indic digits with Western digits
  return str.replace(/[٠-٩]/g, (digit) => ARABIC_TO_WESTERN_DIGITS[digit]);
}

/**
 * Checks if a string contains any Western numerals
 *
 * @param text - The text to check
 * @returns True if the text contains Western numerals
 */
export function hasWesternNumerals(text: string): boolean {
  return /[0-9]/.test(text);
}

/**
 * Checks if a string contains any Arabic-Indic numerals
 *
 * @param text - The text to check
 * @returns True if the text contains Arabic-Indic numerals
 */
export function hasArabicNumerals(text: string): boolean {
  return /[٠-٩]/.test(text);
}
