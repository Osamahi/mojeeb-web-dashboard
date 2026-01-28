/**
 * Shared Error Handler Utility
 * Consolidates error message extraction logic across all auth pages
 *
 * Handles multiple error formats from backend:
 * - AxiosError with nested response.data.message
 * - AxiosError with response.data.error
 * - AxiosError with response.data.errors array
 * - Standard Error objects
 * - Unknown error types
 */

import { isAxiosError, type AxiosError } from 'axios';
import type { TFunction } from 'i18next';

/**
 * Backend error response types
 */
interface BackendErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message: string }>;
}

/**
 * Extract error message from various error types with fallback to i18n key
 *
 * Priority order:
 * 1. AxiosError: response.data.message
 * 2. AxiosError: response.data.error
 * 3. AxiosError: response.data.errors[0].message
 * 4. AxiosError: error.message (generic Axios error)
 * 5. Standard Error: error.message
 * 6. Fallback: i18n translated fallback message
 *
 * @param error - The error object (unknown type)
 * @param fallbackKey - i18n translation key for fallback message
 * @param t - i18next translation function
 * @returns Human-readable error message
 *
 * @example
 * ```typescript
 * try {
 *   await authService.login(credentials);
 * } catch (error) {
 *   const errorMessage = extractAuthError(error, 'auth.login_failed', t);
 *   toast.error(errorMessage);
 * }
 * ```
 */
export function extractAuthError(error: unknown, fallbackKey: string, t: TFunction): string {
  // Handle Axios errors (most common - API errors)
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendErrorResponse>;

    // Try nested response data messages (priority order)
    if (axiosError.response?.data) {
      const { message, error: errorField, errors } = axiosError.response.data;

      if (message) return message;
      if (errorField) return errorField;
      if (errors && errors.length > 0 && errors[0].message) {
        return errors[0].message;
      }
    }

    // Fallback to generic Axios error message (e.g., "Network Error", "timeout of 5000ms exceeded")
    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Handle standard Error objects (e.g., thrown by application code)
  if (error instanceof Error) {
    return error.message;
  }

  // Last resort: use i18n fallback message
  return t(fallbackKey);
}
