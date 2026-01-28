/**
 * Google OAuth Callback Page
 *
 * This page handles the OAuth redirect from Google Sign-In.
 * It exchanges the authorization code for an access token,
 * fetches user info, and completes the authentication flow.
 */

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/lib/analytics';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { usePostAuthNavigation } from '../hooks/usePostAuthNavigation';
import { extractAuthError } from '../utils/errorHandler';

type CallbackStatus = 'processing' | 'success' | 'error';

// UX delay before redirecting after successful authentication
const UX_DELAY_MS = 1500;

export default function GoogleCallbackPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_google_callback');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const { navigateAfterAuth } = usePostAuthNavigation();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // CRITICAL: Use useRef for atomic idempotency guard (prevents race condition in React Strict Mode)
  // useState would allow both effect invocations to read false before either sets true
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Atomic idempotency guard: prevent processing callback multiple times
    if (hasProcessedRef.current) {
      logger.info('Google OAuth callback already processed, skipping', {
        component: 'GoogleCallbackPage',
      });
      return;
    }

    // Mark as processed IMMEDIATELY (synchronous, atomic)
    // This prevents race condition in React Strict Mode where both invocations
    // could pass the guard check before either sets the flag
    hasProcessedRef.current = true;

    // AbortController for canceling async operations on unmount
    const abortController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleCallback = async () => {
      try {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          logger.info('Google OAuth callback aborted (component unmounted)');
          return;
        }

        // Extract parameters from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        logger.info('Processing Google OAuth callback', {
          hasCode: !!code,
          hasError: !!error,
          codeLength: code?.length || 0,
        });

        // Handle OAuth errors from Google
        if (error) {
          const message = errorDescription || `Authorization error: ${error}`;
          logger.error('Google OAuth returned error', { error, errorDescription });
          setErrorMessage(message);
          setStatus('error');
          toast.error(message);
          return;
        }

        // Check for authorization code
        if (!code) {
          logger.error('No authorization code in Google OAuth callback');
          setErrorMessage(t('social_login.google_no_code'));
          setStatus('error');
          toast.error(t('social_login.google_no_code'));
          return;
        }

        // Send authorization code to backend for token exchange
        // Backend will exchange code for tokens and fetch user info securely
        logger.info('Sending authorization code to backend for exchange');
        const authResponse = await authService.loginWithGoogleCode(code);

        // Check abort again after async operation
        if (abortController.signal.aborted) {
          logger.info('Google OAuth callback aborted after token exchange (component unmounted)');
          return;
        }

        // Track signup/login completion
        track('signup_completed', {
          userId: authResponse.user.id,
          email: authResponse.user.email,
          name: authResponse.user.name,
          signupMethod: 'google',
        });

        setStatus('success');
        toast.success(t('social_login.google_success'));

        // Unified post-auth flow (agents + invitations + navigation) after brief delay for UX
        timeoutId = setTimeout(async () => {
          // Final abort check before navigation
          if (!abortController.signal.aborted) {
            await navigateAfterAuth(authResponse.user.email);
          } else {
            logger.info('Navigation aborted (component unmounted)', {
              component: 'GoogleCallbackPage',
            });
          }
        }, UX_DELAY_MS);
      } catch (err) {
        // Don't update state if component unmounted
        if (abortController.signal.aborted) {
          logger.info('Error handling skipped (component unmounted)', {
            component: 'GoogleCallbackPage',
          });
          return;
        }

        logger.error('Error processing Google OAuth callback', err instanceof Error ? err : new Error(String(err)), {
          component: 'GoogleCallbackPage',
        });

        const message = extractAuthError(err, 'social_login.google_error', t);
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    };

    handleCallback();

    // Cleanup: abort in-flight operations and clear timeout if component unmounts
    return () => {
      abortController.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
        logger.info('Google OAuth callback: cleared pending navigation timeout and aborted async operations', {
          component: 'GoogleCallbackPage',
        });
      }
    };
    // Note: t and track are stable functions, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, navigateAfterAuth]);

  const handleRetry = () => {
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-400" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">
              {t('social_login.google_processing_title')}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{t('social_login.google_processing_message')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">{t('social_login.google_success_title')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t('social_login.google_success_message')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">{t('social_login.google_error_title')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              {t('social_login.return_to_login')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
