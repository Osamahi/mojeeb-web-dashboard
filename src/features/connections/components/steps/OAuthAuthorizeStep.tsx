/**
 * OAuth Authorization Step
 * - WhatsApp: Uses Facebook JS SDK Embedded Signup (inline modal)
 * - Facebook/Instagram: Uses OAuth redirect popup (existing flow)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, ExternalLink, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { logger } from '@/lib/logger';
import type { OAuthIntegrationType } from '../../types';
import { useOAuthConnectionFlow } from '../../hooks/useAddConnection';
import { connectionService } from '../../services/connectionService';
import { useAgentContext } from '@/hooks/useAgentContext';
import { getPlatformById } from '../../constants/platforms';
import {
  generateOAuthState,
  storeOAuthState,
  openOAuthPopup,
  getOAuthErrorMessage,
  cleanupOAuthStorage,
  OAuthErrorTypes,
} from '../../utils/oauthManager';

type OAuthAuthorizeStepProps = {
  platform: OAuthIntegrationType;
  onSuccess: (tempConnectionId: string) => void;
  onBack: () => void;
};

type AuthorizationState = 'idle' | 'initiating' | 'authorizing' | 'error';

export function OAuthAuthorizeStep({ platform, onSuccess, onBack }: OAuthAuthorizeStepProps) {
  const { t } = useTranslation();
  const { agentId } = useAgentContext();
  const { initiateOAuthAsync, isInitiating, resetAll } = useOAuthConnectionFlow();

  const [authState, setAuthState] = useState<AuthorizationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  const mountedRef = useRef(true);
  const hasStartedRef = useRef(false);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isWhatsApp = platform === 'whatsapp';
  const platformName = platform === 'facebook' ? t('connections.platform_facebook_name') : platform === 'instagram' ? t('connections.platform_instagram_name') : t('connections.platform_whatsapp_name');
  const platformMetadata = getPlatformById(platform);
  const PlatformIcon = platform === 'facebook' ? Facebook : platform === 'instagram' ? Instagram : MessageCircle;

  // WhatsApp Embedded Signup flow — FB.login() MUST be called directly in click handler
  const startWhatsAppEmbedded = useCallback(() => {
    if (!agentId) {
      setErrorMessage(t('oauth_authorize.error_no_agent'));
      setAuthState('error');
      return;
    }

    if (!window.FB) {
      setErrorMessage('Facebook SDK not loaded. Please refresh the page and try again.');
      setAuthState('error');
      return;
    }

    setAuthState('authorizing');
    setErrorMessage('');

    // Call FB.login() DIRECTLY — no async, no Promise wrapper, no indirection
    window.FB.login(
      (response) => {
        logger.info('[EmbeddedSignup] FB.login response', { status: response.status });

        if (response.status !== 'connected' || !response.authResponse?.code) {
          const msg = response.status === 'not_authorized'
            ? 'Authorization was not granted. Please try again.'
            : 'Login was cancelled or failed.';
          if (mountedRef.current) {
            setErrorMessage(msg);
            setAuthState('error');
          }
          return;
        }

        // Exchange code with backend
        connectionService.exchangeEmbeddedCode(
          response.authResponse.code,
          agentId,
          'whatsapp'
        ).then((tempConnectionId) => {
          logger.info('[EmbeddedSignup] Code exchanged, calling onSuccess', { tempConnectionId });
          // Always call onSuccess — parent modal is still mounted and needs the tempConnectionId
          onSuccess(tempConnectionId);
        }).catch((err) => {
          const msg = err instanceof Error ? err.message : 'Failed to exchange authorization code';
          logger.error('[EmbeddedSignup] Code exchange failed', { error: err });
          if (!mountedRef.current) return;
          setErrorMessage(msg);
          setAuthState('error');
        });
      },
      {
        config_id: '1601450690875651',
        response_type: 'code',
        override_default_response_type: true,
      }
    );
  }, [agentId, onSuccess, t]);

  // Facebook/Instagram popup OAuth flow (existing)
  const startOAuthFlow = useCallback(async () => {
    if (!agentId) {
      setErrorMessage(t('oauth_authorize.error_no_agent'));
      setAuthState('error');
      return;
    }

    setAuthState('initiating');
    setErrorMessage('');
    setPopupBlocked(false);

    const state = generateOAuthState();
    storeOAuthState(state, platform);

    try {
      const data = await Promise.race([
        initiateOAuthAsync({ agentId, platform }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
      ]);

      if (!data.authorizationUrl || typeof data.authorizationUrl !== 'string') {
        setErrorMessage(t('oauth_authorize.error_invalid_url'));
        setAuthState('error');
        cleanupOAuthStorage();
        return;
      }

      try {
        const url = new URL(data.authorizationUrl);
        if (!url.protocol.startsWith('http')) throw new Error('Invalid protocol');
      } catch {
        setErrorMessage(t('oauth_authorize.error_malformed_url'));
        setAuthState('error');
        cleanupOAuthStorage();
        return;
      }

      setAuthUrl(data.authorizationUrl);
      setAuthState('authorizing');

      try {
        const result = await openOAuthPopup(data.authorizationUrl);
        const tempConnectionId = result.tempConnectionId || (result as any).result?.tempConnectionId;

        if (tempConnectionId) {
          logger.info('OAuth completed successfully', { tempConnectionId });
          onSuccess(tempConnectionId);
          if (!mountedRef.current) return;
        }
      } catch (error) {
        if (!mountedRef.current) return;
        if (error instanceof Error) {
          if (error.message === OAuthErrorTypes.POPUP_BLOCKED) {
            setPopupBlocked(true);
            setAuthState('authorizing');
          } else if (error.message === OAuthErrorTypes.POPUP_CLOSED) {
            setErrorMessage(t('oauth_authorize.error_cancelled'));
            setAuthState('error');
            cleanupOAuthStorage();
          } else if (error.message === OAuthErrorTypes.OAUTH_TIMEOUT) {
            setErrorMessage(t('oauth_authorize.error_timeout'));
            setAuthState('error');
            cleanupOAuthStorage();
          } else {
            setErrorMessage(getOAuthErrorMessage(error));
            setAuthState('error');
            cleanupOAuthStorage();
          }
        } else {
          setErrorMessage(t('oauth_authorize.error_unexpected'));
          setAuthState('error');
          cleanupOAuthStorage();
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        setErrorMessage(t('oauth_authorize.error_server_connection'));
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        setErrorMessage(t('oauth_authorize.error_auth_failed'));
      } else if (errorMsg.includes('404')) {
        setErrorMessage(t('oauth_authorize.error_endpoint_not_found'));
      } else {
        setErrorMessage(getOAuthErrorMessage(error));
      }
      setAuthState('error');
      cleanupOAuthStorage();
    }
  }, [agentId, platform, initiateOAuthAsync, onSuccess, t]);

  const openInNewTab = useCallback(() => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'noopener,noreferrer');
    }
  }, [authUrl]);

  const handleRetry = useCallback(() => {
    cleanupOAuthStorage();
    resetAll();
    hasStartedRef.current = false;
    setAuthState('idle');
    setErrorMessage('');
    setPopupBlocked(false);
    setAuthUrl('');
  }, [resetAll]);

  // Auto-start OAuth flow on mount (once only).
  // WhatsApp uses FB.login() which normally requires a direct user click,
  // but works here because the user just clicked "Connect +" moments ago.
  useEffect(() => {
    if (authState === 'idle' && agentId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      if (isWhatsApp) {
        startWhatsAppEmbedded();
      } else {
        startOAuthFlow();
      }
    }
  }, [authState, agentId, isWhatsApp, startOAuthFlow, startWhatsAppEmbedded]);

  // Timeout for initiating state
  useEffect(() => {
    if (authState === 'initiating' || isInitiating) {
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && (authState === 'initiating' || isInitiating)) {
          setErrorMessage(
            `Unable to connect to the server. Please ensure the backend API is running at ${
              import.meta.env.VITE_API_URL || 'http://localhost:5000'
            }`
          );
          setAuthState('error');
          cleanupOAuthStorage();
          resetAll();
        }
      }, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [authState, isInitiating, resetAll]);

  const isLoadingState = authState === 'idle' || authState === 'initiating' || isInitiating;
  const isAuthorizingPopup = authState === 'authorizing' && !isWhatsApp && !popupBlocked;
  const isWhatsAppAuthorizing = isWhatsApp && authState === 'authorizing';

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Platform Icon with Spinner */}
            <div className="relative">
              {(isLoadingState || isAuthorizingPopup || isWhatsAppAuthorizing) && (
                <Loader2 className="absolute inset-0 w-20 h-20 -m-2 animate-spin text-neutral-300" />
              )}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                style={{ backgroundColor: platformMetadata?.brandBgColor }}
              >
                <PlatformIcon
                  className="w-8 h-8"
                  style={{ color: platformMetadata?.brandColor }}
                />
              </div>
            </div>

            {/* Loading / Initiating state */}
            {isLoadingState && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">
                  {t('oauth_authorize.preparing')}
                </p>
                <p className="text-xs text-neutral-600">
                  {t('oauth_authorize.redirect_message', { platform: platformName })}
                </p>
              </div>
            )}

            {/* WhatsApp authorizing state (embedded signup in progress) */}
            {isWhatsAppAuthorizing && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">
                  {t('oauth_authorize.preparing_whatsapp', 'Connecting to WhatsApp...')}
                </p>
                <p className="text-xs text-neutral-600">
                  {t('oauth_authorize.embedded_signup_message', 'Complete the signup in the popup window.')}
                </p>
              </div>
            )}

            {/* Authorizing state - popup (Facebook/Instagram only) */}
            {isAuthorizingPopup && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">{t('oauth_authorize.waiting')}</p>
                <p className="text-xs text-neutral-600">
                  {t('oauth_authorize.complete_in_popup')}
                  <br />
                  {t('oauth_authorize.auto_update')}
                </p>
              </div>
            )}

            {/* Popup blocked state (Facebook/Instagram only) */}
            {authState === 'authorizing' && popupBlocked && !isWhatsApp && (
              <>
                <div>
                  <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900">{t('oauth_authorize.popup_blocked_title')}</p>
                    <p className="text-xs text-neutral-600">
                      {t('oauth_authorize.popup_blocked_message')}
                      <br />
                      {t('oauth_authorize.popup_blocked_instruction')}
                    </p>
                  </div>
                  <Button onClick={openInNewTab} className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {t('oauth_authorize.open_authorization', { platform: platformName })}
                  </Button>
                  <p className="text-xs text-neutral-500">
                    {t('oauth_authorize.return_message')}
                  </p>
                </div>
              </>
            )}

            {/* Error state */}
            {authState === 'error' && (
              <ErrorState
                title={t('oauth_authorize.error_title')}
                description={errorMessage}
                onRetry={handleRetry}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
