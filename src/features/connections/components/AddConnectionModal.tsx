/**
 * Add Connection Modal
 * Main orchestrator for the connection wizard flow
 */

import { useReducer, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { logger } from '@/lib/logger';
import { useConnections } from '../hooks/useConnections';
import { useConnectPage } from '../hooks/useAddConnection';
import { cleanupOAuthStorage } from '../utils/oauthManager';
import { platformShowsWidget } from '../constants/platforms';
import type { OAuthIntegrationType, InstagramAccount, WhatsAppPhoneNumber, PlatformType } from '../types';
import { WidgetSnippetDialog } from './dialogs/WidgetSnippetDialog';

import {
  StepIndicator,
  type WizardStep,
  PlatformSelectStep,
  OAuthAuthorizeStep,
  AccountSelectStep,
} from './steps';

type AddConnectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: PlatformType | null;
};

// Wizard state management
type WizardState = {
  step: WizardStep;
  platform: OAuthIntegrationType | null;
  tempConnectionId: string | null;
};

type WizardAction =
  | { type: 'SELECT_PLATFORM'; platform: OAuthIntegrationType }
  | { type: 'OAUTH_SUCCESS'; tempConnectionId: string }
  | { type: 'CONNECTION_SUCCESS' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' };

const initialState: WizardState = {
  step: 'platform',
  platform: null,
  tempConnectionId: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SELECT_PLATFORM':
      return {
        ...state,
        platform: action.platform,
        step: 'authorize',
      };
    case 'OAUTH_SUCCESS':
      return {
        ...state,
        tempConnectionId: action.tempConnectionId,
        step: 'select',
      };
    case 'CONNECTION_SUCCESS':
      return {
        ...state,
        step: 'complete',
      };
    case 'GO_BACK':
      if (state.step === 'authorize') {
        return { ...state, step: 'platform', platform: null };
      }
      if (state.step === 'select') {
        return { ...state, step: 'authorize', tempConnectionId: null };
      }
      return state;
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AddConnectionModal({ isOpen, onClose, initialPlatform }: AddConnectionModalProps) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { data: connections = [] } = useConnections();
  const { mutate: connectPage, isPending: isConnecting } = useConnectPage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);

  // Log state changes
  useEffect(() => {
    logger.debug('📋 AddConnectionModal state changed', {
      step: state.step,
      platform: state.platform,
      tempConnectionId: state.tempConnectionId,
      isOpen
    });
  }, [state, isOpen]);

  // Handle widget platform
  useEffect(() => {
    if (isOpen && initialPlatform && platformShowsWidget(initialPlatform)) {
      setShowWidgetDialog(true);
    }
  }, [isOpen, initialPlatform]);

  // Reset state when modal closes or when initialPlatform changes
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: 'RESET' });
      cleanupOAuthStorage();
      setShowWidgetDialog(false);
    } else if (isOpen && initialPlatform && !platformShowsWidget(initialPlatform)) {
      // When modal opens with a new platform, reset and go to authorize
      dispatch({ type: 'SELECT_PLATFORM', platform: initialPlatform as OAuthIntegrationType });
    }
  }, [isOpen, initialPlatform]);

  // Auto-close after success
  useEffect(() => {
    if (state.step === 'complete') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.step, onClose]);

  // Focus management - move focus to content when step changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Small delay to allow content to render
      const timer = setTimeout(() => {
        contentRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.step, isOpen]);

  const handlePlatformSelect = (platform: OAuthIntegrationType) => {
    // Check if this is a widget platform
    if (platformShowsWidget(platform as PlatformType)) {
      setShowWidgetDialog(true);
      // Don't close the main modal yet - let user complete widget setup
    } else {
      dispatch({ type: 'SELECT_PLATFORM', platform });
    }
  };

  const handleWidgetDialogClose = () => {
    setShowWidgetDialog(false);
    onClose(); // Close the main modal too
  };

  const handleOAuthSuccess = (tempConnectionId: string) => {
    dispatch({ type: 'OAUTH_SUCCESS', tempConnectionId });
  };

  const handleAccountSelect = (
    pageId: string,
    instagramAccount?: InstagramAccount,
    whatsAppPhone?: WhatsAppPhoneNumber
  ) => {
    if (!state.tempConnectionId) return;

    connectPage(
      {
        tempConnectionId: state.tempConnectionId,
        pageId,
        instagramAccountId: instagramAccount?.id,
        instagramUsername: instagramAccount?.username,
        whatsAppPhoneNumberId: whatsAppPhone?.id,
        whatsAppBusinessAccountId: whatsAppPhone?.businessAccountId || undefined,
      },
      {
        onSuccess: () => {
          dispatch({ type: 'CONNECTION_SUCCESS' });
        },
      }
    );
  };

  const handleBack = () => {
    // Only allow going back if we started from platform selection
    // If we have initialPlatform, we skip platform selection, so back should close
    if (initialPlatform && state.step === 'authorize') {
      handleClose();
    } else {
      dispatch({ type: 'GO_BACK' });
    }
  };

  const handleClose = () => {
    // Clean up and close
    cleanupOAuthStorage();
    onClose();
  };

  // Get modal title based on platform
  const getModalTitle = () => {
    if (state.platform) {
      const platformName =
        state.platform === 'facebook' ? t('connections.platform_facebook_name') :
        state.platform === 'instagram' ? t('connections.platform_instagram_name') :
        t('connections.platform_whatsapp_name');
      return t('connections.connect_platform', { platform: platformName });
    }
    return t('connections.add_title');
  };

  return (
    <>
      {/* OAuth Connection Modal */}
      <BaseModal
        isOpen={isOpen && !showWidgetDialog}
        onClose={handleClose}
        title={getModalTitle()}
        maxWidth="lg"
        isLoading={isConnecting}
        closable={!isConnecting}
      >
        <div className="space-y-6">
          {/* Step indicator - only show if we're in the multi-step flow */}
          {state.step !== 'complete' && !initialPlatform && (
            <div className="border-b border-neutral-200 pb-4">
              <StepIndicator currentStep={state.step} />
            </div>
          )}

          {/* Step content */}
          <div ref={contentRef} className="min-h-[300px]" tabIndex={-1} aria-live="polite">
            {/* Only show platform selection if no initial platform */}
            {state.step === 'platform' && !initialPlatform && (
              <PlatformSelectStep onSelect={handlePlatformSelect} existingConnections={connections} />
            )}

            {state.step === 'authorize' && state.platform && (() => {
              logger.debug('🎯 Rendering OAuthAuthorizeStep', { platform: state.platform });
              return (
                <OAuthAuthorizeStep
                  platform={state.platform}
                  onSuccess={handleOAuthSuccess}
                  onBack={handleBack}
                />
              );
            })()}

            {state.step === 'select' && state.platform && state.tempConnectionId && (
              <AccountSelectStep
                tempConnectionId={state.tempConnectionId}
                platform={state.platform}
                onSelect={handleAccountSelect}
                onBack={handleBack}
                isConnecting={isConnecting}
              />
            )}

            {state.step === 'complete' && (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-xl font-semibold text-neutral-900">{t('connections.success_title')}</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {t('connections.success_message', {
                    platform: state.platform === 'instagram' ? t('connections.platform_instagram_name') : t('connections.platform_facebook_name')
                  })}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{t('connections.auto_close')}</p>
              </div>
            )}
          </div>
        </div>
      </BaseModal>

      {/* Widget Snippet Dialog */}
      <WidgetSnippetDialog
        isOpen={showWidgetDialog}
        onClose={handleWidgetDialogClose}
      />
    </>
  );
}
