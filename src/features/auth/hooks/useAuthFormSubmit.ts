/**
 * Unified Auth Form Submission Hook
 *
 * Consolidates common form submission logic across Login/SignUp pages:
 * - Loading state management
 * - Error handling with toast notifications
 * - Analytics tracking
 * - Post-auth navigation
 * - Guard flag management (prevents race conditions)
 *
 * @module auth/hooks/useAuthFormSubmit
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { usePostAuthNavigation } from './usePostAuthNavigation';
import { useAnalytics } from '@/lib/analytics';
import { extractAuthError } from '../utils/errorHandler';
import type { AuthResponse } from '../types/auth.types';

/**
 * Configuration options for auth form submission
 */
export interface UseAuthFormSubmitOptions<TFormData> {
  /**
   * Authentication action to execute (login or register)
   * @param data - Form data
   * @returns Promise resolving to AuthResponse
   */
  authAction: (data: TFormData) => Promise<AuthResponse>;

  /**
   * Translation key for error messages
   * @example 'auth.login_failed' or 'auth.signup_failed'
   */
  errorKey: string;

  /**
   * Optional callback executed after successful auth but before navigation
   * @param response - AuthResponse from the auth action
   */
  onSuccess?: (response: AuthResponse) => void | Promise<void>;

  /**
   * Optional analytics tracking event name
   * @example 'signup_completed' or 'login_completed'
   */
  trackingEvent?: string;

  /**
   * Optional function to generate tracking data from auth response
   * @param response - AuthResponse from the auth action
   * @returns Object containing tracking properties
   */
  trackingData?: (response: AuthResponse) => Record<string, any>;

  /**
   * Optional ref for guard flag (prevents race condition on signup page)
   * Used to prevent useEffect redirect guard from triggering prematurely
   */
  guardRef?: React.MutableRefObject<boolean>;
}

/**
 * Return type for useAuthFormSubmit hook
 */
export interface UseAuthFormSubmitReturn<TFormData> {
  /**
   * Form submission handler to pass to react-hook-form handleSubmit
   */
  handleSubmit: (data: TFormData) => Promise<void>;

  /**
   * Loading state (true during auth API call)
   */
  isLoading: boolean;

  /**
   * Error message (null if no error)
   */
  error: string | null;
}

/**
 * Custom hook for unified auth form submission logic
 *
 * Eliminates duplication between Login/SignUp pages by consolidating:
 * - Try-catch-finally error handling
 * - Loading state management
 * - Analytics tracking
 * - Post-auth navigation
 * - Guard ref synchronization
 *
 * @example
 * ```typescript
 * const { handleSubmit, isLoading, error } = useAuthFormSubmit({
 *   authAction: (data) => authService.login(data),
 *   errorKey: 'auth.login_failed',
 * });
 * ```
 *
 * @param options - Configuration options
 * @returns Form submission handler, loading state, and error state
 */
export function useAuthFormSubmit<TFormData>({
  authAction,
  errorKey,
  onSuccess,
  trackingEvent,
  trackingData,
  guardRef,
}: UseAuthFormSubmitOptions<TFormData>): UseAuthFormSubmitReturn<TFormData> {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { navigateAfterAuth } = usePostAuthNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: TFormData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      // Set guard flag IMMEDIATELY (synchronously) if provided
      // This prevents React batching race conditions in signup flow
      if (guardRef) {
        guardRef.current = true;
      }

      try {
        // Execute authentication action (login or register)
        const authResponse = await authAction(data);

        // Track analytics event if configured
        if (trackingEvent && trackingData) {
          track(trackingEvent, trackingData(authResponse));
        }

        // Execute custom success callback if provided (e.g., reset onboarding state)
        if (onSuccess) {
          await onSuccess(authResponse);
        }

        // Unified post-auth flow (agents + invitations + navigation)
        await navigateAfterAuth(authResponse.user.email);

        // Reset guard flag AFTER navigation completes
        // This prevents useEffect guard from firing prematurely
        if (guardRef) {
          guardRef.current = false;
        }
      } catch (err) {
        // Extract user-friendly error message
        const errorMessage = extractAuthError(err, errorKey, t);
        setError(errorMessage);
        toast.error(errorMessage);

        // Reset guard flag on error so user can retry
        if (guardRef) {
          guardRef.current = false;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [authAction, errorKey, t, track, navigateAfterAuth, onSuccess, trackingEvent, trackingData, guardRef]
  );

  return {
    handleSubmit,
    isLoading,
    error,
  };
}
