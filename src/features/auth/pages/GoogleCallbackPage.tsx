/**
 * Google OAuth Callback Page
 *
 * This page handles the OAuth redirect from Google Sign-In.
 * It exchanges the authorization code for an access token,
 * fetches user info, and completes the authentication flow.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/lib/analytics';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function GoogleCallbackPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_google_callback');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract parameters from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        logger.info('Processing Google OAuth callback', {
          hasCode: !!code,
          hasError: !!error,
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

        // Track signup/login completion
        track('signup_completed', {
          userId: authResponse.user.id,
          email: authResponse.user.email,
          name: authResponse.user.name,
          signupMethod: 'google',
        });

        setStatus('success');
        toast.success(t('social_login.google_success'));

        // Redirect to conversations after brief delay
        setTimeout(() => {
          navigate('/conversations');
        }, 1500);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        logger.error('Error processing Google OAuth callback', { error: err });
        const message = axiosError?.response?.data?.message || t('social_login.google_error');
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    };

    handleCallback();
  }, [searchParams, navigate, track, t]);

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
