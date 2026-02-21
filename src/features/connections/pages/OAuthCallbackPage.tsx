/**
 * OAuth Callback Page
 *
 * This page handles the OAuth redirect from Facebook/Instagram.
 * It extracts the temporary connection ID from URL params,
 * validates the state parameter for CSRF protection,
 * and communicates the result back to the parent window.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { logger } from '@/lib/logger';
import {
  validateOAuthState,
  storeTempConnectionId,
  cleanupOAuthStorage,
  OAuthErrorTypes,
} from '../utils/oauthManager';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function OAuthCallbackPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_oauth_callback');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    // Check if this is a popup window
    const hasOpener = !!window.opener;
    setIsPopup(hasOpener);

    const handleCallback = () => {
      try {
        // Extract parameters from URL
        const tempConnectionId = searchParams.get('tempConnectionId') || searchParams.get('temp');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        logger.info('Processing OAuth callback', {
          hasTempConnectionId: !!tempConnectionId,
          hasState: !!state,
          hasError: !!error,
          isPopup: hasOpener,
        });

        // Handle OAuth errors from provider
        if (error) {
          const message = errorDescription || `Authorization error: ${error}`;
          logger.error('OAuth provider returned error', { error, errorDescription });
          setErrorMessage(message);
          setStatus('error');

          if (hasOpener && window.opener) {
            window.opener.postMessage(
              {
                type: 'OAUTH_CALLBACK',
                error: error === 'access_denied' ? OAuthErrorTypes.ACCESS_DENIED : error,
              },
              window.location.origin
            );
          }
          return;
        }

        // Validate state parameter for CSRF protection
        if (state && !validateOAuthState(state)) {
          logger.error('OAuth state validation failed');
          setErrorMessage(t('oauth_callback.security_validation_failed'));
          setStatus('error');

          if (hasOpener && window.opener) {
            window.opener.postMessage(
              {
                type: 'OAUTH_CALLBACK',
                error: OAuthErrorTypes.STATE_MISMATCH,
              },
              window.location.origin
            );
          }
          return;
        }

        // Check for temp connection ID
        if (!tempConnectionId) {
          logger.error('No temporary connection ID in callback');
          setErrorMessage(t('oauth_callback.no_connection_id'));
          setStatus('error');

          if (hasOpener && window.opener) {
            window.opener.postMessage(
              {
                type: 'OAUTH_CALLBACK',
                error: OAuthErrorTypes.UNKNOWN_ERROR,
              },
              window.location.origin
            );
          }
          return;
        }

        // Success! Store the temp connection ID
        storeTempConnectionId(tempConnectionId);
        setStatus('success');

        // Communicate success to parent window
        if (hasOpener && window.opener) {
          window.opener.postMessage(
            {
              type: 'OAUTH_CALLBACK',
              tempConnectionId,
            },
            window.location.origin
          );

          // Auto-close popup after brief delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // Not a popup - redirect back to connections page
          setTimeout(() => {
            navigate(`/connections?oauth=success&temp=${tempConnectionId}`);
          }, 2000);
        }
      } catch (err) {
        logger.error('Error processing OAuth callback', { error: err });
        setErrorMessage(t('oauth_callback.unexpected_error'));
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    cleanupOAuthStorage();
    if (isPopup) {
      window.close();
    } else {
      navigate('/connections');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-400" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">{t('oauth_callback.processing_title')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t('oauth_callback.processing_message')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">{t('oauth_callback.success_title')}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              {isPopup
                ? t('oauth_callback.success_message_popup')
                : t('oauth_callback.success_message_redirect')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">{t('oauth_callback.error_title')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              {isPopup ? t('oauth_callback.close_window') : t('oauth_callback.return_to_connections')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
