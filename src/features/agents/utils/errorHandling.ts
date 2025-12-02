/**
 * Error Handling Utilities
 * Reusable error extraction and formatting for API errors
 */

import { isAxiosError } from '@/lib/errors';

/**
 * Extract error message from API response or use fallback
 * @param error - The error object (typically from a catch block)
 * @param fallbackMessage - Message to use if error details not available
 * @returns User-friendly error message string
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return isAxiosError(error)
    ? error.response?.data?.message || fallbackMessage
    : fallbackMessage;
};
