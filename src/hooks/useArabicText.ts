/**
 * useArabicText Hook
 *
 * React hook that provides automatic text conversion to Arabic-Indic numerals
 * based on the current language setting.
 *
 * Usage:
 * ```tsx
 * import { useArabicText } from '@/hooks/useArabicText';
 *
 * function MyComponent({ count }) {
 *   const { toArabic } = useArabicText();
 *
 *   return <p>{toArabic(`Total: ${count}`)}</p>;
 *   // English: "Total: 123"
 *   // Arabic:  "Total: ١٢٣"
 * }
 * ```
 */

import { useTranslation } from 'react-i18next';
import { toArabicNumerals, toWesternNumerals } from '@/lib/arabicNumerals';

/**
 * Hook that automatically converts text based on current language
 *
 * @returns Object with conversion functions
 */
export function useArabicText() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');

  return {
    /**
     * Converts text to use Arabic-Indic numerals if language is Arabic
     * Otherwise returns text unchanged
     *
     * @param text - Text to potentially convert
     * @returns Converted text
     */
    toArabic: (text: string | number | null | undefined): string => {
      if (!text) return '';
      if (isArabic) {
        return toArabicNumerals(text);
      }
      return String(text);
    },

    /**
     * Always converts to Arabic-Indic numerals regardless of language
     *
     * @param text - Text to convert
     * @returns Text with Arabic-Indic numerals
     */
    forceArabic: (text: string | number | null | undefined): string => {
      return toArabicNumerals(text);
    },

    /**
     * Always converts to Western numerals regardless of language
     *
     * @param text - Text to convert
     * @returns Text with Western numerals
     */
    forceWestern: (text: string | number | null | undefined): string => {
      return toWesternNumerals(text);
    },

    /**
     * Check if current language is Arabic
     */
    isArabic,

    /**
     * Current language code
     */
    language: i18n.language,
  };
}
