/**
 * OAuth Authorization Step
 * Handles the OAuth flow with popup support and fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, ExternalLink, Facebook, Instagram, MessageCircle } from 'lucide-react';
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
  console.log('⚡⚡⚡ OAuthAuthorizeStep RENDER - NEW CODE LOADED ⚡⚡⚡', { platform });

  const { agentId } = useAgentContext();
  const { initiateOAuthAsync, isInitiating, initiationData, resetAll } = useOAuthConnectionFlow();

  const [authState, setAuthState] = useState<AuthorizationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    console.log('🎬🎬🎬 OAuthAuthorizeStep MOUNTED 🎬🎬🎬');
    logger.debug('🎬 OAuthAuthorizeStep MOUNTED', {
      platform,
      agentId,
      authState,
      isInitiating,
      hasInitiateOAuthAsync: !!initiateOAuthAsync
    });
    return () => {
      console.log('💀💀💀 OAuthAuthorizeStep UNMOUNTING 💀💀💀');
      console.trace('Component unmount stack trace');
      logger.debug('🎬 OAuthAuthorizeStep UNMOUNTING');
      mountedRef.current = false;
    };
  }, []);

  console.log('🔧 Component setup:', {
    agentId,
    platform,
    hasInitiateOAuthAsync: !!initiateOAuthAsync,
    isInitiating,
    authState
  });

  const platformName = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'WhatsApp';
  const platformMetadata = getPlatformById(platform);
  const PlatformIcon = platform === 'facebook' ? Facebook : platform === 'instagram' ? Instagram : MessageCircle;

  // Start the OAuth flow
  const startOAuthFlow = useCallback(async () => {
    console.log('🚀🚀🚀 startOAuthFlow CALLED', { agentId, platform });

    if (!agentId) {
      console.error('❌ No agentId available');
      setErrorMessage('No agent selected. Please select an agent first.');
      setAuthState('error');
      return;
    }

    console.log('✅ Setting authState to initiating');
    setAuthState('initiating');
    setErrorMessage('');
    setPopupBlocked(false);

    // Generate and store state for CSRF protection
    const state = generateOAuthState();
    storeOAuthState(state, platform);

    try {
      // Initiate OAuth to get authorization URL
      console.log('📞 Calling initiateOAuthAsync');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: initiateOAuthAsync took > 5s')), 5000)
      );

      const data = await Promise.race([
        initiateOAuthAsync({ agentId, platform }),
        timeoutPromise
      ]).catch(err => {
        console.error('💥 initiateOAuthAsync FAILED:', err);
        throw err;
      });

      console.log('📥 OAuth initiation response received', { data });

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
        setErrorMessage('Received malformed authorization URL from server.');
        setAuthState('error');
        cleanupOAuthStorage();
        return;
      }

      setAuthUrl(data.authorizationUrl);
      console.log('🎯 Setting state to authorizing and opening popup', { authUrl: data.authorizationUrl });
      setAuthState('authorizing');

      try {
        // Try to open popup
        console.log('🪟 Calling openOAuthPopup');
        const result = await openOAuthPopup(data.authorizationUrl);
        console.log('✅ openOAuthPopup returned', { result });
        console.log('🔍 Checking result.tempConnectionId:', result.tempConnectionId);
        console.log('🔍 Checking result.result?.tempConnectionId:', (result as any).result?.tempConnectionId);

        // Handle both direct and wrapped response formats
        const tempConnectionId = result.tempConnectionId || (result as any).result?.tempConnectionId;
        console.log('🎯 Final tempConnectionId:', tempConnectionId);

        if (tempConnectionId) {
          console.log('🎉🎉🎉 OAUTH FLOW COMPLETE! 🎉🎉🎉');
          console.log('📋 tempConnectionId to pass to onSuccess:', tempConnectionId);
          logger.info('OAuth completed successfully', { tempConnectionId });

          // Call onSuccess BEFORE checking mounted state
          // This ensures the parent component gets the result even if this component unmounts
          console.log('🚀 Calling onSuccess callback...');
          onSuccess(tempConnectionId);
          console.log('✅ onSuccess callback completed');

          // Now check if component is still mounted for state updates
          console.log('🔍 Checking mountedRef.current:', mountedRef.current);
          if (!mountedRef.current) {
            console.log('ℹ️ Component unmounted after successful OAuth - this is OK');
            return;
          }
        } else {
          console.error('❌ No tempConnectionId found in result:', result);
          console.error('❌ This should not happen - OAuth flow stuck!');
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
    } catch (error) {
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
    }
  }, [agentId, platform, initiateOAuthAsync, onSuccess]);

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
    logger.debug('🔍 Auto-start useEffect triggered', { authState, agentId, hasStartOAuthFlow: !!startOAuthFlow });
    if (authState === 'idle' && agentId) {
      logger.debug('✅ Conditions met, calling startOAuthFlow');
      startOAuthFlow();
    } else {
      logger.debug('❌ Conditions NOT met', {
        authStateIsIdle: authState === 'idle',
        hasAgentId: !!agentId,
        authState,
        agentId
      });
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
