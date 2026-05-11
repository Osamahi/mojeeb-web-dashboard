/**
 * Reconnect Connection Modal — 2-step horizontal-stepper wizard.
 *
 *   [1] Re-authenticate ────── [2] Confirm sheet
 *
 * Step 1: triggers Google OAuth popup on landing. Same "waiting for Google"
 *         body as CreateConnectionModal's step 1. On OAuth success → auto-
 *         advance to step 2.
 * Step 2: triggers the Drive Picker on landing. The user MUST pick the same
 *         spreadsheet the connection was originally bound to — Google's
 *         drive.file scope is per-grant, so a fresh token has no access to the
 *         original sheet until re-granted through the Picker. Picking a
 *         DIFFERENT sheet is rejected (column mappings on dependent actions
 *         would break). On correct pick → auto-fire the reconnect POST and
 *         close on success.
 *
 * Why no "Customize" step (unlike Create): reconnect's whole purpose is to
 * preserve the existing config (tab, column mapping, dependent actions). The
 * user only needs to re-grant OAuth + re-confirm the sheet. Anything else
 * lives in EditConnectionActionsModal.
 *
 * Visual chrome matches CreateConnectionModal exactly — same gradient accent,
 * same stepper pattern, same portal/backdrop/ESC handling. No BaseModal: the
 * stepper IS the header.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useReconnectConnection } from '../hooks/useIntegrations';
import { exchangeAuthCode, getOAuthSessionAccessToken } from '../services/googleOAuthApi';
import { openSpreadsheetPicker, type PickedSpreadsheet } from '../utils/googlePicker';
import { requestGoogleAuthCode } from '../utils/googleAuth';
import type { IntegrationConnection } from '../types';

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Stagger between sequential stepper element animations. Matches Create modal.
const STAGGER = 0.1;

type WizardStep = 1 | 2;
type StepStatus = 'done' | 'active' | 'locked';

interface ReconnectConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: IntegrationConnection;
}

export default function ReconnectConnectionModal({
  isOpen,
  onClose,
  connection,
}: ReconnectConnectionModalProps) {
  const { t } = useTranslation();
  const reconnectMutation = useReconnectConnection();

  // ─── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);

  // ─── Per-step state ──────────────────────────────────────────────────────
  const [oauthSessionId, setOauthSessionId] = useState<string | null>(null);
  const [pickedSheet, setPickedSheet] = useState<PickedSpreadsheet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  // Surfaced when the user picked a different spreadsheet than the connection
  // is bound to. Visible inline in step 2 with a retry CTA. Resets on retry.
  const [pickerError, setPickerError] = useState<string | null>(null);

  const developerKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const appId = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER as string | undefined;
  const integrationsClientId = import.meta.env.VITE_GOOGLE_INTEGRATIONS_CLIENT_ID as string | undefined;
  const expectedSheetId = connection.config?.spreadsheet_id as string | undefined;

  const isAnyMutationPending =
    reconnectMutation.isPending || isConnecting || isPicking;

  // ─── Reset ───────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setStep(1);
    setOauthSessionId(null);
    setPickedSheet(null);
    setIsConnecting(false);
    setIsPicking(false);
    setPickerError(null);
  }, []);

  // ─── Close ───────────────────────────────────────────────────────────────
  // No orphan-risk to handle here (reconnect doesn't create a backend record
  // until the final mutation fires). Cancel = clean close at any step.
  const requestClose = useCallback(() => {
    if (isAnyMutationPending) return;
    resetForm();
    onClose();
  }, [isAnyMutationPending, resetForm, onClose]);

  // ESC + body scroll lock — same pattern as CreateConnectionModal.
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAnyMutationPending) {
        requestClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAnyMutationPending]);

  // ─── Step 1: OAuth ───────────────────────────────────────────────────────
  const handleConnectGoogle = useCallback(async () => {
    if (!integrationsClientId) {
      toast.error('Google integrations client ID is not configured (VITE_GOOGLE_INTEGRATIONS_CLIENT_ID)');
      return;
    }
    setIsConnecting(true);
    setPickerError(null);
    try {
      const code = await requestGoogleAuthCode({
        clientId: integrationsClientId,
        scope: GOOGLE_DRIVE_FILE_SCOPE,
      });
      const newSessionId = await exchangeAuthCode(code);
      setOauthSessionId(newSessionId);
      setStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect Google account';
      toast.error(message);
      // Stay on step 1 — retry button is in the empty state.
    } finally {
      setIsConnecting(false);
    }
  }, [integrationsClientId]);

  // ─── Step 2: Drive Picker + reconnect POST ───────────────────────────────
  // Unlike Create, picking the sheet is the LAST thing — once the user picks
  // the correct sheet we fire the reconnect mutation immediately. No separate
  // confirm step: reconnect preserves the existing config wholesale, there's
  // nothing for the user to review.
  const handlePickSheet = useCallback(async () => {
    if (!oauthSessionId) return;
    if (!developerKey) {
      toast.error('Google API key is not configured (VITE_GOOGLE_API_KEY)');
      return;
    }
    setIsPicking(true);
    setPickerError(null);
    try {
      const oauthToken = await getOAuthSessionAccessToken(oauthSessionId);
      const result = await openSpreadsheetPicker({ oauthToken, developerKey, appId });
      if (!result) {
        // User closed the picker — stay on step 2, retry available.
        return;
      }
      if (expectedSheetId && result.id !== expectedSheetId) {
        // Wrong sheet picked. Column mappings on dependent actions would break
        // if we accepted this — reject and prompt for the original sheet. If
        // the user genuinely wants to switch sheets, they delete + recreate.
        setPickerError(t('integrations.reconnect_wrong_sheet'));
        setPickedSheet(null);
        return;
      }
      setPickedSheet(result);
      // Auto-fire the reconnect POST. Mutation hook handles success/error toasts.
      try {
        await reconnectMutation.mutateAsync({
          connectionId: connection.id,
          oauthSessionId,
        });
        resetForm();
        onClose();
      } catch {
        // Hook surfaces the error toast. Stay on step 2 so the user can retry.
        setPickedSheet(null);
      }
    } catch (error) {
      console.error('Picker failed', error);
      toast.error('Failed to open Google file picker');
    } finally {
      setIsPicking(false);
    }
  }, [
    oauthSessionId,
    developerKey,
    appId,
    expectedSheetId,
    reconnectMutation,
    connection.id,
    resetForm,
    onClose,
    t,
  ]);

  // ─── Auto-trigger OAuth on step-1 landing ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 1) return;
    if (oauthSessionId) return;
    if (isConnecting) return;
    handleConnectGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  // ─── Auto-trigger Picker on step-2 landing ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 2) return;
    if (!oauthSessionId) return;
    if (pickedSheet) return;
    if (isPicking) return;
    if (pickerError) return; // wait for explicit retry
    handlePickSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, oauthSessionId]);

  // ─── Stepper status derivation ───────────────────────────────────────────
  const stepStatuses: StepStatus[] = useMemo(() => {
    return [step > 1 ? 'done' : 'active', step === 2 ? 'active' : 'locked'];
  }, [step]);

  const stepLabels = [
    t('integrations.reconnect_modal_step_authenticate'),
    t('integrations.reconnect_modal_step_confirm_sheet'),
  ];

  // ─── Backdrop click closes (same UX as Create) ───────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isAnyMutationPending) {
      requestClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={handleBackdropClick}
          />

          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reconnect-title"
            >
              {/* ── Header: gradient accent + close + 2-step stepper ─────── */}
              <div className="relative flex-shrink-0">
                <motion.div
                  className="h-[2px] origin-left rtl:origin-right"
                  style={{ background: 'linear-gradient(90deg, #7DFF51, #00DBB7)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                <button
                  onClick={requestClose}
                  disabled={isAnyMutationPending}
                  className="absolute top-3 end-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none z-10"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>

                <h2 id="reconnect-title" className="sr-only">
                  {t('integrations.reconnect_modal_title')}
                </h2>

                <div className="px-6 pt-6 pb-5">
                  <div className="flex items-start" dir="ltr">
                    {stepStatuses.map((status, i) => (
                      <Fragment key={i}>
                        {i > 0 && (
                          <Connector
                            filled={stepStatuses[i - 1] === 'done'}
                            delay={(i * 2 - 1) * STAGGER}
                          />
                        )}
                        <Step
                          status={status}
                          label={stepLabels[i]}
                          delay={i * 2 * STAGGER}
                        />
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Body ───────────────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[280px]">
                {/* Connection summary strip — always visible so the user knows
                    which connection they're reconnecting. */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {connection.name}
                      </p>
                      {expectedSheetId && (
                        <p className="truncate font-mono text-[11px] text-neutral-500">
                          {expectedSheetId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {step === 1 && (
                  <Step1Body isConnecting={isConnecting} onRetry={handleConnectGoogle} />
                )}

                {step === 2 && (
                  <Step2Body
                    isPicking={isPicking}
                    isReconnecting={reconnectMutation.isPending}
                    pickerError={pickerError}
                    onRetry={handlePickSheet}
                  />
                )}
              </div>

              {/* ── Footer (Cancel only — wizard auto-progresses) ─────────── */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100 flex-shrink-0">
                <button
                  onClick={requestClose}
                  disabled={isAnyMutationPending}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return <>{createPortal(modalContent, document.body)}</>;
}

// ─── Stepper sub-components (mirror CreateConnectionModal exactly) ──────────

function Step({ status, label, delay }: { status: StepStatus; label: string; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center flex-1 min-w-0"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {status === 'done' ? (
        <motion.div
          className="w-6 h-6 rounded-full bg-brand-mojeeb flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.05, type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      ) : status === 'active' ? (
        <div className="w-6 h-6 rounded-full border-2 border-[#272726]" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#D8D8D0]/50" />
      )}
      <span
        className={cn(
          'text-[11px] mt-1.5 text-center whitespace-nowrap',
          status === 'done' && 'text-[#808178]',
          status === 'active' && 'text-[#272726] font-medium',
          status === 'locked' && 'text-[#D8D8D0]'
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}

function Connector({ filled, delay }: { filled: boolean; delay: number }) {
  return (
    <div className="flex-1 mt-3 h-px relative">
      <div className="absolute inset-0 bg-[#D8D8D0]" />
      {filled && (
        <motion.div
          className="absolute inset-0 bg-brand-mojeeb origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay, duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

// ─── Step body components ───────────────────────────────────────────────────

/** Step 1 — "waiting for Google sign-in". OAuth has already auto-fired on landing. */
function Step1Body({ isConnecting, onRetry }: { isConnecting: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4">
        <svg className="w-12 h-12" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {isConnecting
          ? t('integrations.reconnect_modal_step1_waiting_title')
          : t('integrations.reconnect_modal_step1_retry_title')}
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs">
        {isConnecting
          ? t('integrations.reconnect_modal_step1_waiting_body')
          : t('integrations.reconnect_modal_step1_retry_body')}
      </p>
      {/* Loader as its own beat below the body — clearer "we're working on it"
          signal than a tiny corner-mounted spinner. */}
      {isConnecting && (
        <Loader2
          className="mt-4 w-5 h-5 text-brand-mojeeb animate-spin"
          aria-hidden="true"
        />
      )}
      {!isConnecting && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-brand-mojeeb px-4 py-2 text-sm font-medium text-white hover:bg-brand-mojeeb-hover"
        >
          {t('integrations.reconnect_modal_step1_retry_button')}
        </button>
      )}
    </div>
  );
}

/**
 * Step 2 — Drive Picker fires immediately. Three states:
 *   - Picking / reconnecting: spinner + waiting copy
 *   - Picker error (wrong sheet): amber warning + retry CTA
 *   - Cancelled-picker (no sheet, no error): retry CTA
 */
function Step2Body({
  isPicking,
  isReconnecting,
  pickerError,
  onRetry,
}: {
  isPicking: boolean;
  isReconnecting: boolean;
  pickerError: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const showSpinner = isPicking || isReconnecting;

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
          <FileSpreadsheet className="w-7 h-7 text-green-600" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {isReconnecting
          ? t('integrations.reconnect_modal_step2_reconnecting_title')
          : isPicking
          ? t('integrations.reconnect_modal_step2_picking_title')
          : pickerError
          ? t('integrations.reconnect_modal_step2_wrong_sheet_title')
          : t('integrations.reconnect_modal_step2_retry_title')}
      </h3>
      <p className="text-sm text-neutral-500 max-w-sm">
        {isReconnecting
          ? t('integrations.reconnect_modal_step2_reconnecting_body')
          : isPicking
          ? t('integrations.reconnect_modal_step2_picking_body')
          : pickerError
          ? null
          : t('integrations.reconnect_modal_step2_retry_body')}
      </p>

      {/* Loader as its own beat below the body — see Step1Body comment. */}
      {showSpinner && (
        <Loader2
          className="mt-4 w-5 h-5 text-brand-mojeeb animate-spin"
          aria-hidden="true"
        />
      )}

      {pickerError && !showSpinner && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 max-w-sm text-start">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-700">{pickerError}</p>
        </div>
      )}

      {!showSpinner && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-brand-mojeeb px-4 py-2 text-sm font-medium text-white hover:bg-brand-mojeeb-hover"
        >
          {t('integrations.reconnect_modal_step2_retry_button')}
        </button>
      )}
    </div>
  );
}
