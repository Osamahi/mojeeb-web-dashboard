/**
 * Phone Number Formatting Utilities
 * Handles formatting and validation of international phone numbers
 */

import { VALIDATION_RULES } from '../constants/validationRules';

// Regex to extract only digits from a string
const DIGITS_REGEX = /\D/g;

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  format: string;
  flag: string;
}

/**
 * Extract digits only from a string
 * Removes all non-digit characters
 */
function extractDigits(value: string): string {
  return value.replace(DIGITS_REGEX, '');
}

/**
 * Format phone number according to country format
 * Example: "1234567890" with format "XX XXX XXXX" -> "12 345 6789"
 */
export function formatPhoneNumber(value: string, format: string): string {
  const digits = extractDigits(value);
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }

  return formatted.trim();
}

/**
 * Format phone number for display (adds spaces for readability)
 * Example: "+966501234567" -> "+966 50 123 4567"
 */
export function formatPhoneForDisplay(fullPhone: string): string {
  if (!fullPhone) return '';

  // Extract dial code and number
  const match = fullPhone.match(/^(\+\d{1,4})(\d+)$/);
  if (!match) return fullPhone;

  const dialCode = match[1];
  const number = match[2];

  // Group number digits in 3s
  const groups: string[] = [];
  for (let i = 0; i < number.length; i += 3) {
    groups.push(number.substring(i, Math.min(i + 3, number.length)));
  }

  return `${dialCode} ${groups.join(' ')}`;
}

/**
 * Validate phone number (minimum digits based on validation rules)
 */
export function validatePhoneNumber(value: string): boolean {
  const digits = extractDigits(value);
  return digits.length >= VALIDATION_RULES.PHONE_MIN_DIGITS;
}

/**
 * Get full international phone number
 * Example: dialCode="+966", number="501234567" -> "+966501234567"
 */
export function getFullPhoneNumber(dialCode: string, number: string): string {
  const digits = extractDigits(number);
  return `${dialCode}${digits}`;
}

/**
 * Extract digits only from formatted phone number
 * (Public alias for extractDigits function)
 */
export function getDigitsOnly(value: string): string {
  return extractDigits(value);
}
