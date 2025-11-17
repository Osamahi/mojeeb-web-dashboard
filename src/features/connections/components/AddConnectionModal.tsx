/**
 * Add Connection Modal
 * Main orchestrator for the connection wizard flow
 */

import { useReducer, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useConnections } from '../hooks/useConnections';
import { useConnectPage } from '../hooks/useAddConnection';
import { cleanupOAuthStorage } from '../utils/oauthManager';
import type { OAuthIntegrationType, InstagramAccount } from '../types';

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

export function AddConnectionModal({ isOpen, onClose }: AddConnectionModalProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { data: connections = [] } = useConnections();
  const { mutate: connectPage, isPending: isConnecting } = useConnectPage();
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: 'RESET' });
      cleanupOAuthStorage();
    }
  }, [isOpen]);

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
    dispatch({ type: 'SELECT_PLATFORM', platform });
  };

  const handleOAuthSuccess = (tempConnectionId: string) => {
    dispatch({ type: 'OAUTH_SUCCESS', tempConnectionId });
  };

  const handleAccountSelect = (pageId: string, instagramAccount?: InstagramAccount) => {
    if (!state.tempConnectionId) return;

    connectPage(
      {
        tempConnectionId: state.tempConnectionId,
        pageId,
        instagramAccountId: instagramAccount?.id,
        instagramUsername: instagramAccount?.username,
      },
      {
        onSuccess: () => {
          dispatch({ type: 'CONNECTION_SUCCESS' });
        },
      }
    );
  };

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const handleClose = () => {
    // Clean up and close
    cleanupOAuthStorage();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Connection" size="lg">
      <div className="space-y-6">
        {/* Step indicator */}
        {state.step !== 'complete' && (
          <div className="border-b border-neutral-200 pb-4">
            <StepIndicator currentStep={state.step} />
          </div>
        )}

        {/* Step content */}
        <div ref={contentRef} className="min-h-[300px]" tabIndex={-1} aria-live="polite">
          {state.step === 'platform' && (
            <PlatformSelectStep onSelect={handlePlatformSelect} existingConnections={connections} />
          )}

          {state.step === 'authorize' && state.platform && (
            <OAuthAuthorizeStep
              platform={state.platform}
              onSuccess={handleOAuthSuccess}
              onBack={handleBack}
            />
          )}

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
              <h3 className="mt-4 text-xl font-semibold text-neutral-900">Connection Successful!</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Your {state.platform === 'instagram' ? 'Instagram' : 'Facebook'} account has been connected.
              </p>
              <p className="mt-1 text-xs text-neutral-500">This dialog will close automatically...</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
