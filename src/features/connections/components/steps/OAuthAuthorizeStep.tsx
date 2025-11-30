/**
 * OAuth Authorization Step
 * Handles the OAuth flow with popup support and fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, ExternalLink, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { logger } from '@/lib/logger';
import type { OAuthIntegrationType } from '../../types';
import { useOAuthConnectionFlow } from '../../hooks/useAddConnection';
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
  const { agentId } = useAgentContext();
  const { initiateOAuth, isInitiating, initiationData, resetAll } = useOAuthConnectionFlow();

  const [authState, setAuthState] = useState<AuthorizationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const platformName = platform === 'facebook' ? 'Facebook' : 'Instagram';
  const platformMetadata = getPlatformById(platform);
  const PlatformIcon = platform === 'facebook' ? Facebook : Instagram;

  // Start the OAuth flow
  const startOAuthFlow = useCallback(async () => {
    if (!agentId) {
      setErrorMessage('No agent selected. Please select an agent first.');
      setAuthState('error');
      return;
    }

    setAuthState('initiating');
    setErrorMessage('');
    setPopupBlocked(false);

    // Generate and store state for CSRF protection
    const state = generateOAuthState();
    storeOAuthState(state, platform);

    // Initiate OAuth to get authorization URL
    initiateOAuth(
      { agentId, platform },
      {
        onSuccess: async (data) => {
          // Check if component is still mounted
          if (!mountedRef.current) return;

          // Validate authorization URL before proceeding
          if (!data.authorizationUrl || typeof data.authorizationUrl !== 'string') {
            logger.error('Invalid authorization URL received', { authUrl: data.authorizationUrl });
            setErrorMessage('Invalid authorization URL received from server.');
            setAuthState('error');
            cleanupOAuthStorage();
            return;
          }

          // Validate it's a proper URL
          try {
            const url = new URL(data.authorizationUrl);
            if (!url.protocol.startsWith('http')) {
              throw new Error('Invalid protocol');
            }
          } catch {
            logger.error('Malformed authorization URL', { authUrl: data.authorizationUrl });
            if (!mountedRef.current) return;
            setErrorMessage('Received malformed authorization URL from server.');
            setAuthState('error');
            cleanupOAuthStorage();
            return;
          }

          if (!mountedRef.current) return;
          setAuthUrl(data.authorizationUrl);
          setAuthState('authorizing');

          try {
            // Try to open popup
            const result = await openOAuthPopup(data.authorizationUrl);

            if (!mountedRef.current) return;
            if (result.tempConnectionId) {
              logger.info('OAuth completed successfully', { tempConnectionId: result.tempConnectionId });
              onSuccess(result.tempConnectionId);
            }
          } catch (error) {
            if (!mountedRef.current) return;
            if (error instanceof Error) {
              if (error.message === OAuthErrorTypes.POPUP_BLOCKED) {
                setPopupBlocked(true);
                setAuthState('authorizing'); // Still show authorizing UI with manual option
              } else if (error.message === OAuthErrorTypes.POPUP_CLOSED) {
                setErrorMessage('Authorization was cancelled. Please try again.');
                setAuthState('error');
                cleanupOAuthStorage();
              } else if (error.message === OAuthErrorTypes.OAUTH_TIMEOUT) {
                setErrorMessage('Authorization timed out. Please try again.');
                setAuthState('error');
                cleanupOAuthStorage();
              } else {
                setErrorMessage(getOAuthErrorMessage(error));
                setAuthState('error');
                cleanupOAuthStorage();
              }
            } else {
              setErrorMessage('An unexpected error occurred.');
              setAuthState('error');
              cleanupOAuthStorage();
            }
          }
        },
        onError: (error) => {
          if (!mountedRef.current) return;
          logger.error('OAuth initiation failed', { error });
          // Check for network/server errors
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
            setErrorMessage('Unable to connect to the server. Please ensure the backend is running.');
          } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            setErrorMessage('Authentication failed. Please log in again.');
          } else if (errorMsg.includes('404')) {
            setErrorMessage('OAuth endpoint not found. Please check backend configuration.');
          } else {
            setErrorMessage(getOAuthErrorMessage(error));
          }
          setAuthState('error');
          cleanupOAuthStorage();
        },
      }
    );
  }, [agentId, platform, initiateOAuth, onSuccess]);

  // Open OAuth URL in new tab (fallback)
  const openInNewTab = useCallback(() => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'noopener,noreferrer');
    }
  }, [authUrl]);

  // Handle retry
  const handleRetry = useCallback(() => {
    cleanupOAuthStorage();
    resetAll();
    setAuthState('idle');
    setErrorMessage('');
    setPopupBlocked(false);
    setAuthUrl('');
  }, [resetAll]);

  // Auto-start OAuth when component mounts
  useEffect(() => {
    if (authState === 'idle' && agentId) {
      startOAuthFlow();
    }
  }, [authState, agentId, startOAuthFlow]);

  // Add timeout for initiating state to prevent hanging indefinitely
  useEffect(() => {
    if (authState === 'initiating' || isInitiating) {
      const timeoutId = setTimeout(() => {
        // Check if still mounted and still in initiating state
        if (mountedRef.current && (authState === 'initiating' || isInitiating)) {
          logger.warn('OAuth initiation timed out');
          setErrorMessage(
            `Unable to connect to the server. Please ensure the backend API is running at ${
              import.meta.env.VITE_API_URL || 'http://localhost:5000'
            }`
          );
          setAuthState('error');
          cleanupOAuthStorage();
          resetAll();
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [authState, isInitiating, resetAll]);

  return (
    <div className="flex items-center justify-center py-12">
      {/* Content Container */}
      <div className="w-full max-w-md">
        <div className="px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Platform Icon with Spinner */}
            <div className="relative">
              {/* Spinning loader ring around icon */}
              {(authState === 'idle' || authState === 'initiating' || isInitiating || (authState === 'authorizing' && !popupBlocked)) && (
                <Loader2 className="absolute inset-0 w-20 h-20 -m-2 animate-spin text-neutral-300" />
              )}

              {/* Platform Icon */}
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

            {/* Initiating state */}
            {(authState === 'idle' || authState === 'initiating' || isInitiating) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">Preparing authorization</p>
                <p className="text-xs text-neutral-600">
                  You'll be redirected to {platformName} to authorize your account
                </p>
              </div>
            )}

            {/* Authorizing state - waiting for user */}
            {authState === 'authorizing' && !popupBlocked && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">Waiting for authorization</p>
                <p className="text-xs text-neutral-600">
                  Complete the authorization in the popup window
                  <br />
                  This will update automatically
                </p>
              </div>
            )}

            {/* Popup blocked state */}
            {authState === 'authorizing' && popupBlocked && (
              <>
                <div>
                  <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900">Popup Blocked</p>
                    <p className="text-xs text-neutral-600">
                      Your browser blocked the authorization popup
                      <br />
                      Click below to open it manually
                    </p>
                  </div>
                  <Button
                    onClick={openInNewTab}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open {platformName} Authorization
                  </Button>
                  <p className="text-xs text-neutral-500">
                    After authorizing, return to this page
                  </p>
                </div>
              </>
            )}

            {/* Error state */}
            {authState === 'error' && (
              <>
                <ErrorState
                  title="Authorization Failed"
                  description={errorMessage}
                  onRetry={handleRetry}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
