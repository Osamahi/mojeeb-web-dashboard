/**
 * Create Connection Modal — 3-step horizontal-stepper wizard.
 *
 *   [1] Connect ────── [2] Choose sheet ────── [3] Customize
 *
 * Step 1: triggers the Google OAuth popup on landing. Body shows a "waiting
 *         for Google" visual. On OAuth success → auto-advance to step 2.
 * Step 2: triggers the Drive Picker on landing. Body shows a confirmation of
 *         the connected account + a "Pick a spreadsheet" affordance (in case
 *         the auto-trigger fails or user closes the Picker). On pick → auto-
 *         advance to step 3.
 * Step 3: connection name (auto-filled from picker) + tab dropdown + column
 *         mapping + trigger prompt. Save button creates the connection AND
 *         the first add_row action atomically (from the frontend's POV).
 *
 * Cancellation:
 *   - Steps 1 + 2: clean close, nothing was created on the backend.
 *   - Step 3 after connection-create has succeeded: warn dialog → confirm
 *     deletes the orphan connection.
 *
 * The stepper visual recipe mirrors features/agents/components/SetupChecklist
 * (dots + connecting lines + bottom labels). Same component pattern, locally
 * inlined here to avoid cross-feature dependency on what's currently an
 * agent-specific UI.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/Switch';
import { useAgentContext } from '@/hooks/useAgentContext';
import {
  useCreateConnection,
  useConnectionMetadata,
  useDeleteConnection,
} from '../hooks/useIntegrations';
import { actionService } from '@/features/actions/services/actionService';
import { ColumnMappingBuilder } from '@/features/actions/components/ColumnMappingBuilder';
import {
  buildPairedActionRequest,
  headerToVariableName,
  type ActionLike,
} from '@/features/actions/utils/integrationUtils';
import { exchangeAuthCode, getOAuthSessionAccessToken } from '../services/googleOAuthApi';
import { openSpreadsheetPicker, type PickedSpreadsheet } from '../utils/googlePicker';
import { requestGoogleAuthCode } from '../utils/googleAuth';
import type { ColumnMappingEntry } from '../types';

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Default trigger prompts for the trio. The user only ever sees `add` in the
// modal (under Advanced); update/read fire with these defaults and become
// editable post-create via the Edit-connection modal. Mirrors the prompts
// defined in CreateActionModal so the user-facing copy stays consistent.
const DEFAULT_ADD_TRIGGER_PROMPT =
  'When the customer provides the required information, extract these details as variables and add a new row to the Google Sheet.';

const DEFAULT_UPDATE_TRIGGER_PROMPT =
  'When the customer wants to update or change information from a row they previously created in this conversation, ' +
  'extract the new field values and call this with the row_reference_id from the earlier add result and only the fields that should change.';

const DEFAULT_READ_TRIGGER_PROMPT =
  'When the customer asks about details of a row they previously created in this conversation ' +
  '(e.g., "what did I submit?", "check my entry", "confirm my details"), ' +
  'call this with the row_reference_id from the earlier add result to fetch the current values.';

// Stagger between sequential stepper element animations. Matches SetupChecklist.
const STAGGER = 0.1;

type WizardStep = 1 | 2 | 3;
type StepStatus = 'done' | 'active' | 'locked';

interface CreateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateConnectionModal({ isOpen, onClose }: CreateConnectionModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();
  const createConnectionMutation = useCreateConnection();
  // Silent variant: skips the success toast (the user clicked "Discard", a
  // celebration would feel off-tone). Cache invalidation + optimistic splice
  // still run — that's the whole point of routing through the hook instead of
  // calling the service directly.
  const deleteConnectionMutation = useDeleteConnection({ silent: true });

  // Pending state for the trio-create on Save. Local flag (not a mutation hook)
  // because we orchestrate three parallel POSTs via actionService.createAction
  // directly — TanStack mutations don't compose well with Promise.allSettled.
  const [isCreatingActions, setIsCreatingActions] = useState(false);

  // ─── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);

  // ─── Per-step state ──────────────────────────────────────────────────────
  const [oauthSessionId, setOauthSessionId] = useState<string | null>(null);
  const [pickedSheet, setPickedSheet] = useState<PickedSpreadsheet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [createdConnectionId, setCreatedConnectionId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [targetTab, setTargetTab] = useState('');
  const [targetSheetId, setTargetSheetId] = useState<number>(0);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingEntry[]>([]);

  // Per-op trigger prompts. `add` is required and always fires. `update` and
  // `read` only fire if their corresponding toggle in `enabledOps` is on.
  // Prompts default to the canonical defaults — user can override in Advanced.
  const [addPrompt, setAddPrompt] = useState(DEFAULT_ADD_TRIGGER_PROMPT);
  const [updatePrompt, setUpdatePrompt] = useState(DEFAULT_UPDATE_TRIGGER_PROMPT);
  const [readPrompt, setReadPrompt] = useState(DEFAULT_READ_TRIGGER_PROMPT);

  // Op toggles. `add` is structurally always-on (no Add row = useless connection)
  // and rendered as a disabled-but-checked Switch — matches EditConnectionActions-
  // Modal's "base op" visual convention. `update` and `read` default to on so the
  // LLM can follow up on what it just added without the user knowing to enable them.
  const [enabledOps, setEnabledOps] = useState<{ update: boolean; read: boolean }>({
    update: true,
    read: true,
  });

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);

  const developerKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const appId = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER as string | undefined;
  const integrationsClientId = import.meta.env.VITE_GOOGLE_INTEGRATIONS_CLIENT_ID as string | undefined;

  // ─── Metadata for step 3 ────────────────────────────────────────────────
  const { data: connectionMetadata } = useConnectionMetadata(
    isOpen && createdConnectionId ? createdConnectionId : null
  );

  const isAnyMutationPending =
    createConnectionMutation.isPending ||
    isCreatingActions ||
    isConnecting ||
    isPicking ||
    isCleaningUp;

  // ─── Reset ───────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setStep(1);
    setOauthSessionId(null);
    setPickedSheet(null);
    setIsConnecting(false);
    setIsPicking(false);
    setCreatedConnectionId(null);
    setName('');
    setTargetTab('');
    setTargetSheetId(0);
    setColumnMapping([]);
    setAddPrompt(DEFAULT_ADD_TRIGGER_PROMPT);
    setUpdatePrompt(DEFAULT_UPDATE_TRIGGER_PROMPT);
    setReadPrompt(DEFAULT_READ_TRIGGER_PROMPT);
    setEnabledOps({ update: true, read: true });
    setIsCleaningUp(false);
    setShowCancelWarning(false);
  }, []);

  // ─── Cancellation ────────────────────────────────────────────────────────
  // Orphan risk only exists once we've created the connection on the backend
  // (which happens between step 2 and step 3, on picker success). At step 3
  // a `createdConnectionId` is set → cancel must clean up.
  const requestClose = useCallback(() => {
    if (isAnyMutationPending) return;
    if (createdConnectionId) {
      setShowCancelWarning(true);
      return;
    }
    resetForm();
    onClose();
  }, [isAnyMutationPending, createdConnectionId, resetForm, onClose]);

  // ESC key + body scroll lock. We rolled our own modal chrome instead of
  // BaseModal because the header IS the stepper (gradient accent + dots inline),
  // which BaseModal's fixed title/border layout can't express. Everything else
  // (portal, backdrop, ESC, scroll lock) is replicated below.
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
    // requestClose is stable through useCallback deps; including it would cause
    // a re-bind every render. Same pattern as BaseModal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAnyMutationPending]);

  const confirmCancelAndDelete = useCallback(async () => {
    if (!createdConnectionId) {
      setShowCancelWarning(false);
      resetForm();
      onClose();
      return;
    }
    setIsCleaningUp(true);
    try {
      // Route through the hook so cache invalidation + optimistic splice both
      // run — single source of truth for "delete a connection". The hook is in
      // silent mode so no success toast fires; errors still toast (handled by
      // the hook's onError, which respects isToastHandled).
      await deleteConnectionMutation.mutateAsync(createdConnectionId);
    } catch (err) {
      // Hook already toasted; we just need to log + recover the UI state.
      console.error('[CreateConnectionModal] Failed to delete orphan connection', err);
    } finally {
      setIsCleaningUp(false);
      setShowCancelWarning(false);
      resetForm();
      onClose();
    }
  }, [createdConnectionId, deleteConnectionMutation, resetForm, onClose]);

  // ─── Step 1: OAuth ───────────────────────────────────────────────────────
  const handleConnectGoogle = useCallback(async () => {
    if (!integrationsClientId) {
      toast.error('Google integrations client ID is not configured (VITE_GOOGLE_INTEGRATIONS_CLIENT_ID)');
      return;
    }
    setIsConnecting(true);
    try {
      const code = await requestGoogleAuthCode({
        clientId: integrationsClientId,
        scope: GOOGLE_DRIVE_FILE_SCOPE,
      });
      const newSessionId = await exchangeAuthCode(code);
      setOauthSessionId(newSessionId);
      // Auto-advance to step 2 on OAuth success.
      setStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect Google account';
      toast.error(message);
      // Stay on step 1 — the retry button is visible in the empty state.
    } finally {
      setIsConnecting(false);
    }
  }, [integrationsClientId]);

  // ─── Step 2: Drive Picker ────────────────────────────────────────────────
  const handlePickSheet = useCallback(async () => {
    if (!oauthSessionId) return;
    if (!developerKey) {
      toast.error('Google API key is not configured (VITE_GOOGLE_API_KEY)');
      return;
    }
    setIsPicking(true);
    try {
      const oauthToken = await getOAuthSessionAccessToken(oauthSessionId);
      const result = await openSpreadsheetPicker({ oauthToken, developerKey, appId });
      if (!result) {
        // User closed the picker without picking. Stay on step 2; they can
        // retry by clicking the "Pick a spreadsheet" button again.
        return;
      }
      setPickedSheet(result);
      // Connection name defaults to the spreadsheet name; user can override
      // in step 3.
      setName(result.name);
      // Create the connection on the backend BEFORE advancing — step 3 needs
      // a connection id to fetch /metadata for tab/header info.
      const created = await createConnectionMutation.mutateAsync({
        connectorType: 'google_sheets',
        name: result.name,
        config: { spreadsheet_id: result.id },
        oauthSessionId,
      });
      setCreatedConnectionId(created.id);
      setStep(3);
    } catch (error) {
      console.error('Picker / connection-create failed', error);
      toast.error('Failed to set up the spreadsheet connection');
    } finally {
      setIsPicking(false);
    }
  }, [oauthSessionId, developerKey, appId, createConnectionMutation]);

  // ─── Auto-trigger OAuth on step-1 landing ───────────────────────────────
  // Fires once when modal opens with empty state. Same trigger fires again
  // if user retries (clicks the retry button in the empty state).
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 1) return;
    if (oauthSessionId) return;
    if (isConnecting) return;
    handleConnectGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  // ─── Auto-trigger Picker on step-2 landing ──────────────────────────────
  // Fires once when arriving at step 2 with OAuth ready but no sheet picked.
  // Picker is Google's UI — we have no Mojeeb form for the user to interact
  // with on this step, so auto-firing is the right default.
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 2) return;
    if (!oauthSessionId) return;
    if (pickedSheet) return;
    if (isPicking) return;
    handlePickSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, oauthSessionId]);

  // ─── Step 3 metadata effects ─────────────────────────────────────────────
  // Seed tab + mapping from the first available tab once metadata loads.
  useEffect(() => {
    if (!connectionMetadata?.tabs?.length) return;
    if (targetTab) return;
    const firstTab = connectionMetadata.tabs[0];
    setTargetTab(firstTab.name);
    setTargetSheetId(firstTab.sheet_id);
    setColumnMapping(
      firstTab.headers.map((header) => ({
        source: 'variable',
        header,
        variable_name: headerToVariableName(header),
        enabled: true,
      }))
    );
  }, [connectionMetadata, targetTab]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setTargetTab(newTab);
      const tabMeta = connectionMetadata?.tabs?.find((tab) => tab.name === newTab);
      if (!tabMeta) return;
      setTargetSheetId(tabMeta.sheet_id);
      setColumnMapping(
        tabMeta.headers.map((header) => ({
          source: 'variable',
          header,
          variable_name: headerToVariableName(header),
          enabled: true,
        }))
      );
    },
    [connectionMetadata]
  );

  // ─── Step 3 final submit ─────────────────────────────────────────────────
  //
  // Creates 1-3 actions in parallel depending on the op toggles. `add_row`
  // always fires (it's structurally required); `update_row` and `read_row` fire
  // only when their toggle in `enabledOps` is on. Each uses its respective
  // trigger prompt from state (Advanced lets the user edit all three).
  //
  // Why direct `actionService.createAction` instead of the mutation hook: we
  // compose Promise.allSettled to send all enabled ops in one batch; mutation
  // hooks don't compose cleanly with that.
  const handleCreateAction = useCallback(async () => {
    if (!createdConnectionId || !targetTab || columnMapping.length === 0) return;
    if (!agentId) {
      // Belt-and-suspenders: ToolsPage already gates on isAgentSelected, so this
      // is unreachable in practice. We still guard rather than send agentId: ''
      // to the backend, which would 400 with a confusing validation error.
      toast.error(t('common.error_loading_data'));
      return;
    }
    const enabledColumns = columnMapping.filter((col) => col.enabled);
    if (enabledColumns.length === 0) {
      toast.error(t('integrations.at_least_one_column_required'));
      return;
    }
    const wireMapping = enabledColumns.map((col) => {
      const entry: Record<string, unknown> = { source: col.source };
      if (col.header) entry.header = col.header;
      if (col.source === 'variable') {
        entry.variable_name = col.variable_name || '';
        if (col.default) entry.default = col.default;
      }
      if (col.source === 'auto_increment') entry.prefix = col.prefix || 'MOJ';
      if (col.source === 'timestamp') entry.format = col.format || 'yyyy-MM-dd HH:mm';
      if (col.source === 'static') entry.value = col.value || '';
      return entry;
    });

    const baseName = `Save to ${name.trim() || pickedSheet?.name || 'sheet'} - ${targetTab}`;
    const addRowConfig = {
      operation: 'add_row',
      target_tab: targetTab,
      target_sheet_id: targetSheetId,
      column_mapping: wireMapping,
    };

    // add_row — always required. Trimmed prompt falls back to default if blank.
    const addRowReq = {
      agentId: agentId,
      name: baseName,
      description: `Appends a row to Google Sheets tab "${targetTab}" when data is collected from conversation.`,
      triggerPrompt: addPrompt.trim() || DEFAULT_ADD_TRIGGER_PROMPT,
      actionType: 'integration' as const,
      actionConfig: addRowConfig,
      isActive: true,
      priority: 100,
      integrationConnectionId: createdConnectionId,
    };

    // Synthetic sibling for the paired-action helper. We haven't POSTed add_row
    // yet — but buildPairedActionRequest only reads fields off the sibling, it
    // doesn't care that the sibling is unsaved. This sidesteps a sequential
    // chain (POST add_row → then POST update/read) in favor of one parallel batch.
    const seedSibling: ActionLike = {
      id: 'pending',
      agentId: agentId,
      name: baseName,
      description: addRowReq.description,
      triggerPrompt: addRowReq.triggerPrompt,
      actionType: 'integration',
      actionConfig: addRowConfig,
      integrationConnectionId: createdConnectionId,
      isActive: true,
      priority: 100,
    };

    // Build the parallel batch — add is always in; update/read only when toggled on.
    // Same fallback rule: trimmed user-edited prompt or canonical default.
    const dispatches: Array<Promise<unknown>> = [actionService.createAction(addRowReq)];
    if (enabledOps.update) {
      dispatches.push(
        actionService.createAction(
          buildPairedActionRequest(
            seedSibling,
            'update_row',
            updatePrompt.trim() || DEFAULT_UPDATE_TRIGGER_PROMPT
          )
        )
      );
    }
    if (enabledOps.read) {
      dispatches.push(
        actionService.createAction(
          buildPairedActionRequest(
            seedSibling,
            'read_row',
            readPrompt.trim() || DEFAULT_READ_TRIGGER_PROMPT
          )
        )
      );
    }

    setIsCreatingActions(true);
    try {
      const results = await Promise.allSettled(dispatches);

      // Invalidate the actions list regardless — partial state is still real.
      queryClient.invalidateQueries({ queryKey: ['actions', agentId] });

      const failures = results.filter((r) => r.status === 'rejected');

      if (failures.length === 0) {
        toast.success(t('integrations.create_modal_trio_success'));
        resetForm();
        onClose();
      } else if (failures.length === 3) {
        // Everything failed — surface the first error and stay open.
        toast.error(t('integrations.create_modal_trio_all_failed'));
      } else {
        // Partial — add_row may have landed but one of the paired ops failed.
        // Treat as success for the flow (connection is usable) but warn so the
        // user knows to revisit Edit.
        toast.warning(
          t('integrations.create_modal_trio_partial_failure', {
            failed: failures.length,
            total: results.length,
          })
        );
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('[CreateConnectionModal] Trio create unexpected error', error);
      toast.error(t('integrations.create_modal_trio_all_failed'));
    } finally {
      setIsCreatingActions(false);
    }
  }, [
    createdConnectionId,
    targetTab,
    targetSheetId,
    columnMapping,
    name,
    pickedSheet,
    addPrompt,
    updatePrompt,
    readPrompt,
    enabledOps,
    agentId,
    queryClient,
    resetForm,
    onClose,
    t,
  ]);

  const isStep3Valid = useMemo(
    () => !!targetTab && columnMapping.some((col) => col.enabled),
    [targetTab, columnMapping]
  );

  // ─── Stepper status derivation ───────────────────────────────────────────
  // Each step's status (done/active/locked) is fully derived from step + flags.
  // The stepper auto-updates as state advances; no separate stepper state.
  const stepStatuses: StepStatus[] = useMemo(() => {
    return [
      step > 1 ? 'done' : 'active',
      step > 2 ? 'done' : step === 2 ? 'active' : 'locked',
      step === 3 ? 'active' : 'locked',
    ];
  }, [step]);

  const stepLabels = [
    t('integrations.create_modal_step_connect'),
    t('integrations.create_modal_step_choose_sheet'),
    t('integrations.create_modal_step_customize'),
  ];

  const availableTabs = connectionMetadata?.tabs ?? [];

  // Backdrop click closes (same UX as BaseModal). Pending mutations block close
  // so we don't orphan a half-created connection mid-API-call.
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

          {/* Modal container — backdrop click closes */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-connection-title"
            >
              {/* ── Custom header: gradient accent + close button + stepper ─────── */}
              {/* The gradient accent is the brand signature — same recipe as the
                  agent SetupChecklist. The stepper sits directly under it as the
                  modal's only header (no separate title row), which is why we
                  hand-rolled the chrome instead of using BaseModal. */}
              <div className="relative flex-shrink-0">
                {/* Top accent line — gradient sweep on mount */}
                <motion.div
                  className="h-[2px] origin-left rtl:origin-right"
                  style={{ background: 'linear-gradient(90deg, #7DFF51, #00DBB7)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {/* Close button — absolute-positioned in the top-right corner.
                    Sized to match BaseModal's close button so the affordance is
                    familiar across modals. Uses logical end-inline-side so it
                    flips correctly in RTL without an extra rule. */}
                <button
                  onClick={requestClose}
                  disabled={isAnyMutationPending}
                  className="absolute top-3 end-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none z-10"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>

                {/* Hidden a11y title — the stepper is the visual header but a
                    dialog still needs an accessible name for screen readers. */}
                <h2 id="create-connection-title" className="sr-only">
                  {t('integrations.create_connection')}
                </h2>

                {/* Stepper row — dots + connecting lines + labels below. */}
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

              {/* ── Step body (scrollable) ──────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[280px]">
                {step === 1 && (
                  <Step1Body isConnecting={isConnecting} onRetry={handleConnectGoogle} />
                )}

                {step === 2 && (
                  <Step2Body
                    isPicking={isPicking}
                    isCreating={createConnectionMutation.isPending}
                    pickedSheet={pickedSheet}
                    onRetry={handlePickSheet}
                  />
                )}

                {step === 3 && (
                  <Step3Body
                    name={name}
                    onNameChange={setName}
                    tabs={availableTabs}
                    targetTab={targetTab}
                    onTabChange={handleTabChange}
                    columnMapping={columnMapping}
                    onColumnMappingChange={setColumnMapping}
                    addPrompt={addPrompt}
                    onAddPromptChange={setAddPrompt}
                    updatePrompt={updatePrompt}
                    onUpdatePromptChange={setUpdatePrompt}
                    readPrompt={readPrompt}
                    onReadPromptChange={setReadPrompt}
                    enabledOps={enabledOps}
                    onEnabledOpsChange={setEnabledOps}
                    disabled={isCreatingActions}
                  />
                )}
              </div>

              {/* ── Footer ───────────────────────────────────────────────────────── */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100 flex-shrink-0">
                <button
                  onClick={requestClose}
                  disabled={isAnyMutationPending}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                {step === 3 && (
                  <button
                    onClick={handleCreateAction}
                    disabled={!isStep3Valid || isCreatingActions}
                    className="rounded-lg bg-brand-mojeeb px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-mojeeb-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingActions
                      ? t('common.saving')
                      : t('integrations.create_modal_create_integration_button')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Cancel-with-orphan warning */}
      {showCancelWarning && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40"
          onClick={() => !isCleaningUp && setShowCancelWarning(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="cancel-warning-title"
          >
            <h3
              id="cancel-warning-title"
              className="text-base font-semibold text-neutral-900 mb-2"
            >
              {t('integrations.cancel_warning_title')}
            </h3>
            <p className="text-sm text-neutral-600 mb-5">
              {t('integrations.cancel_warning_body')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelWarning(false)}
                disabled={isCleaningUp}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {t('integrations.cancel_warning_keep_editing')}
              </button>
              <button
                onClick={confirmCancelAndDelete}
                disabled={isCleaningUp}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isCleaningUp
                  ? t('integrations.cancel_warning_cleaning_up')
                  : t('integrations.cancel_warning_discard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Stepper sub-components ─────────────────────────────────────────────────

/** Dot + label below. Mirrors SetupChecklist's AnimatedStep visual recipe. */
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

/** Horizontal connecting line between two steps. */
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

// ─── Step body components ────────────────────────────────────────────────────

/** Step 1 — visual: "waiting for Google sign-in". OAuth has already auto-fired. */
function Step1Body({ isConnecting, onRetry }: { isConnecting: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
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
          ? t('integrations.create_modal_step1_waiting_title')
          : t('integrations.create_modal_step1_retry_title')}
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs">
        {isConnecting
          ? t('integrations.create_modal_step1_waiting_body')
          : t('integrations.create_modal_step1_retry_body')}
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
          {t('integrations.create_modal_step1_retry_button')}
        </button>
      )}
    </div>
  );
}

/** Step 2 — visual: Drive Picker is firing (or has fired). */
function Step2Body({
  isPicking,
  isCreating,
  pickedSheet,
  onRetry,
}: {
  isPicking: boolean;
  isCreating: boolean;
  pickedSheet: PickedSpreadsheet | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const showSpinner = isPicking || isCreating;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
          <FileSpreadsheet className="w-7 h-7 text-green-600" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {showSpinner
          ? t('integrations.create_modal_step2_picking_title')
          : pickedSheet
          ? t('integrations.create_modal_step2_picked_title')
          : t('integrations.create_modal_step2_retry_title')}
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs">
        {showSpinner
          ? t('integrations.create_modal_step2_picking_body')
          : pickedSheet
          ? pickedSheet.name
          : t('integrations.create_modal_step2_retry_body')}
      </p>
      {/* Loader as its own beat below the body — see Step1Body comment. */}
      {showSpinner && (
        <Loader2
          className="mt-4 w-5 h-5 text-brand-mojeeb animate-spin"
          aria-hidden="true"
        />
      )}
      {!showSpinner && !pickedSheet && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-brand-mojeeb px-4 py-2 text-sm font-medium text-white hover:bg-brand-mojeeb-hover"
        >
          {t('integrations.create_modal_step2_retry_button')}
        </button>
      )}
    </div>
  );
}

/**
 * Step 3 — main view shows tab selector + op toggles + sheet preview table.
 * Advanced disclosure holds connection name, column mapping, and per-op
 * trigger prompts.
 *
 * Visual structure:
 *   ┌─ Tab: [dropdown if >1 tab, plain label if 1] ────────────────┐
 *   ├─ Toggles: [Add (locked-on)] [Edit] [View] ───────────────────┤
 *   ├─ Sheet preview (dimmed scrollable header table) ─────────────┤
 *   ├─ Advanced ▾ ─────────────────────────────────────────────────┤
 *   │    Connection name                                            │
 *   │    Column mapping (ColumnMappingBuilder)                      │
 *   │    Add row prompt        (always shown — required op)         │
 *   │    Update row prompt     (shown iff enabledOps.update)        │
 *   │    Read row prompt       (shown iff enabledOps.read)          │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * `add_row` is structurally always on (no add = useless integration). It's
 * rendered as a disabled-but-checked Switch, mirroring the "base op" visual
 * in EditConnectionActionsModal for cross-modal consistency.
 */
function Step3Body({
  name,
  onNameChange,
  tabs,
  targetTab,
  onTabChange,
  columnMapping,
  onColumnMappingChange,
  addPrompt,
  onAddPromptChange,
  updatePrompt,
  onUpdatePromptChange,
  readPrompt,
  onReadPromptChange,
  enabledOps,
  onEnabledOpsChange,
  disabled,
}: {
  name: string;
  onNameChange: (v: string) => void;
  tabs: Array<{ name: string; sheet_id: number; headers: string[] }>;
  targetTab: string;
  onTabChange: (v: string) => void;
  columnMapping: ColumnMappingEntry[];
  onColumnMappingChange: (cols: ColumnMappingEntry[]) => void;
  addPrompt: string;
  onAddPromptChange: (v: string) => void;
  updatePrompt: string;
  onUpdatePromptChange: (v: string) => void;
  readPrompt: string;
  onReadPromptChange: (v: string) => void;
  enabledOps: { update: boolean; read: boolean };
  onEnabledOpsChange: (next: { update: boolean; read: boolean }) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Column headers for the preview table — only enabled columns.
  const columnHeaders = useMemo(
    () => columnMapping.filter((c) => c.enabled && c.header).map((c) => c.header || ''),
    [columnMapping]
  );

  // Scroll-edge fades — same logic as EditConnectionActionsModal. Forced LTR
  // scroll container so "start" = left and "end" = right in pixel terms
  // regardless of UI direction.
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<{ canStart: boolean; canEnd: boolean }>({
    canStart: false,
    canEnd: false,
  });

  const recalcScrollState = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const canEnd = el.scrollWidth - el.clientWidth - el.scrollLeft > 1;
    const canStart = el.scrollLeft > 1;
    setScrollState((prev) =>
      prev.canStart === canStart && prev.canEnd === canEnd ? prev : { canStart, canEnd }
    );
  }, []);

  useLayoutEffect(() => {
    recalcScrollState();
    const el = tableScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(recalcScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalcScrollState, columnHeaders]);

  // Op rows for the toggles section. `add` is intentionally rendered with the
  // same Switch component as the others (disabled + checked) instead of a pill
  // badge — keeps the visual language consistent across all three rows. Same
  // pattern as EditConnectionActionsModal's `EDITABLE_OPERATIONS`. The `hintKey`
  // surfaces a short 5–6-word subline so the user knows what each op does
  // before they toggle it.
  const opRows: Array<{
    id: 'add' | 'update' | 'read';
    labelKey: string;
    hintKey: string;
    toggleable: boolean;
    checked: boolean;
  }> = [
    {
      id: 'add',
      labelKey: 'tools.op_add_row',
      hintKey: 'integrations.create_modal_step3_op_hint_add',
      toggleable: false,
      checked: true,
    },
    {
      id: 'update',
      labelKey: 'tools.op_update_row',
      hintKey: 'integrations.create_modal_step3_op_hint_update',
      toggleable: true,
      checked: enabledOps.update,
    },
    {
      id: 'read',
      labelKey: 'tools.op_read_row',
      hintKey: 'integrations.create_modal_step3_op_hint_read',
      toggleable: true,
      checked: enabledOps.read,
    },
  ];

  const handleOpToggle = (op: 'update' | 'read', next: boolean) => {
    onEnabledOpsChange({ ...enabledOps, [op]: next });
  };

  const hasMultipleTabs = tabs.length > 1;
  const isLoadingTabs = tabs.length === 0;

  // While the connection metadata is still loading, render a skeleton instead
  // of the full form. Showing the op toggles + Advanced disclosure before we
  // know what's in the sheet is jarring — the user can technically toggle Update
  // off, but they have no idea what columns the toggle affects yet. A skeleton
  // that matches the eventual layout's footprint keeps the modal from jumping
  // when content lands.
  if (isLoadingTabs) {
    return <Step3Skeleton />;
  }

  return (
    <div className="space-y-4">
      {/* ── Mini spreadsheet preview (top) ────────────────────────────────── */}
      {/* Same visual recipe as EditConnectionActionsModal — soft Mint-White,
          deep elevation shadow, hairline border, hidden scrollbar, edge fades.
          Pinned to the top so the user sees "this is your sheet" before any
          configuration controls. */}
      {columnHeaders.length > 0 ? (
        <div className="relative" dir="ltr">
          <div
            ref={tableScrollRef}
            onScroll={recalcScrollState}
            className="overflow-x-auto scrollbar-hide rounded-xl"
            style={{
              background: '#FCFEFC',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <table className="border-collapse min-w-full">
              <thead>
                <tr>
                  {columnHeaders.map((header, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={cn(
                        'px-3 py-2 min-w-[120px] text-[11px] font-semibold text-neutral-700 text-start whitespace-nowrap',
                        i < columnHeaders.length - 1 && 'border-e border-neutral-200'
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {columnHeaders.map((_, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-3 py-2 h-7 border-t border-neutral-200',
                        i < columnHeaders.length - 1 && 'border-e border-neutral-200'
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {scrollState.canStart && (
            <div
              className="pointer-events-none absolute inset-y-0 start-0 w-8 rounded-s-xl"
              style={{
                background: 'linear-gradient(to right, #FCFEFC, rgba(252,254,252,0))',
              }}
              aria-hidden="true"
            />
          )}
          {scrollState.canEnd && (
            <div
              className="pointer-events-none absolute inset-y-0 end-0 w-8 rounded-e-xl"
              style={{
                background: 'linear-gradient(to left, #FCFEFC, rgba(252,254,252,0))',
              }}
              aria-hidden="true"
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-10 text-sm text-neutral-500 rounded-xl border border-dashed border-neutral-200 text-center px-4">
          {t('integrations.create_modal_step3_no_columns_enabled')}
        </div>
      )}

      {/* ── Tab selector (multi-tab only) ─────────────────────────────────── */}
      {/* Single-tab spreadsheets hide this row entirely — there's nothing to
          choose between, so showing "Tab: Sheet1" is just visual noise. The
          auto-pick logic in the parent already seeded `targetTab` either way. */}
      {hasMultipleTabs && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-700 shrink-0">
            {t('integrations.create_modal_step3_tab_label')}
          </label>
          <select
            value={targetTab}
            onChange={(e) => onTabChange(e.target.value)}
            disabled={disabled}
            className="flex-1 min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-mojeeb focus:outline-none focus:ring-1 focus:ring-brand-mojeeb"
          >
            {tabs.map((tab) => (
              <option key={tab.name} value={tab.name}>
                {tab.name}{' '}
                {tab.headers.length > 0 ? `(${tab.headers.length} columns)` : '(empty)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Op toggles ────────────────────────────────────────────────────── */}
      {/* Three toggles inside a single hairline-bordered card with hairline
          dividers between rows. Each row carries a short subline that explains
          in plain words what the op does — so the user can decide whether to
          keep Update / Read enabled without having to read the prompt itself.
          `Add row` renders as a disabled-but-checked Switch (locked-on base op,
          matches EditConnectionActionsModal's visual convention). */}
      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {opRows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-800">{t(row.labelKey)}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{t(row.hintKey)}</div>
            </div>
            <Switch
              checked={row.checked}
              onChange={(next) =>
                row.toggleable && handleOpToggle(row.id as 'update' | 'read', next)
              }
              disabled={!row.toggleable || disabled}
              size="sm"
              aria-label={
                row.toggleable ? undefined : t('tools.edit_modal_base_op_badge')
              }
              title={row.toggleable ? undefined : t('tools.edit_modal_base_op_badge')}
            />
          </div>
        ))}
      </div>

      {/* ── Advanced settings disclosure ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
        aria-expanded={showAdvanced}
      >
        <ChevronDown
          size={14}
          className={cn('transition-transform', showAdvanced && 'rotate-180')}
        />
        {t('integrations.create_modal_step3_advanced_toggle')}
      </button>

      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-2">
              {/* Connection name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('integrations.connection_name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={t('integrations.connection_name_autofill_placeholder')}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-brand-mojeeb focus:outline-none focus:ring-1 focus:ring-brand-mojeeb"
                  disabled={disabled}
                />
              </div>

              {/* Column mapping */}
              {targetTab && (
                <ColumnMappingBuilder
                  columns={columnMapping}
                  onChange={onColumnMappingChange}
                />
              )}

              {/* ── Per-op blocks (toggle + prompt) ───────────────────── */}
              {/* Mirrors EditConnectionActionsModal's per-op section UX
                  verbatim: each op has its own switch in the title row, and
                  the prompt textarea is shown iff the op is enabled. Add is
                  locked-on (disabled switch). The top-of-modal toggles card
                  and these per-op switches both write the same `enabledOps`
                  state — toggling either reflects in the other immediately. */}
              {(
                [
                  {
                    id: 'add' as const,
                    labelKey: 'tools.op_add_row',
                    toggleable: false,
                    checked: true,
                    prompt: addPrompt,
                    onPromptChange: onAddPromptChange,
                  },
                  {
                    id: 'update' as const,
                    labelKey: 'tools.op_update_row',
                    toggleable: true,
                    checked: enabledOps.update,
                    prompt: updatePrompt,
                    onPromptChange: onUpdatePromptChange,
                  },
                  {
                    id: 'read' as const,
                    labelKey: 'tools.op_read_row',
                    toggleable: true,
                    checked: enabledOps.read,
                    prompt: readPrompt,
                    onPromptChange: onReadPromptChange,
                  },
                ] as const
              ).map((op, idx) => (
                <section
                  key={op.id}
                  className={idx > 0 ? 'border-t border-neutral-100 pt-4' : ''}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-800">
                      {t(op.labelKey)}
                    </label>
                    <Switch
                      checked={op.checked}
                      onChange={(next) =>
                        op.toggleable &&
                        handleOpToggle(op.id as 'update' | 'read', next)
                      }
                      disabled={!op.toggleable || disabled}
                      size="sm"
                      aria-label={
                        op.toggleable ? undefined : t('tools.edit_modal_base_op_badge')
                      }
                      title={
                        op.toggleable ? undefined : t('tools.edit_modal_base_op_badge')
                      }
                    />
                  </div>
                  {op.checked && (
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-1">
                        {t('tools.edit_modal_prompt_label')}
                      </label>
                      <textarea
                        value={op.prompt}
                        onChange={(e) => op.onPromptChange(e.target.value)}
                        disabled={disabled}
                        rows={5}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-mojeeb focus:outline-none focus:ring-1 focus:ring-brand-mojeeb resize-y min-h-[8rem] disabled:opacity-50"
                        placeholder={t('tools.edit_modal_prompt_placeholder')}
                      />
                    </div>
                  )}
                </section>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Step 3 skeleton — shown while connection metadata (tabs + headers) is loading.
 *
 * Mirrors the eventual layout's footprint to minimize layout shift when content
 * lands: a table-shaped card on top (matches the mini spreadsheet preview's
 * shadow recipe), a toggles-shaped card with three rows below, then a single
 * skeleton bar where the Advanced disclosure would be. Pulse animation is
 * Tailwind's `animate-pulse` — same recipe SetupChecklist uses.
 *
 * We don't render the tab dropdown skeleton because it only appears for multi-
 * tab spreadsheets and we don't know yet whether this one is multi or single.
 */
function Step3Skeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 animate-pulse">
      {/* Table-card skeleton — same shadow + radius as the loaded preview so
          the modal doesn't visually re-paint when content arrives. Three rows
          of bars approximate a header row + body row. */}
      <div
        className="rounded-xl overflow-hidden px-3 py-4 space-y-3"
        style={{
          background: '#FCFEFC',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
        aria-hidden="true"
      >
        {/* Header-row bars — slightly darker to mimic the bold header text */}
        <div className="flex gap-3">
          <div className="h-3 flex-1 rounded bg-neutral-200" />
          <div className="h-3 flex-1 rounded bg-neutral-200" />
          <div className="h-3 flex-1 rounded bg-neutral-200" />
          <div className="h-3 flex-1 rounded bg-neutral-200" />
        </div>
        {/* Body-row placeholder — empty space, just height */}
        <div className="h-7" />
      </div>

      {/* Toggles-card skeleton — three rows with label-area bar + switch-area bar.
          Matches the divide-y hairline-bordered card the real one uses. */}
      <div
        className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100"
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-neutral-200" />
              <div className="h-2.5 w-40 rounded bg-neutral-100" />
            </div>
            {/* Switch placeholder — matches the size-sm Switch's footprint */}
            <div className="h-5 w-9 rounded-full bg-neutral-200 shrink-0" />
          </div>
        ))}
      </div>

      {/* Advanced-disclosure line skeleton */}
      <div className="h-4 w-32 rounded bg-neutral-200" aria-hidden="true" />

      {/* Visually-hidden live region — announces "loading" to screen readers
          without cluttering the visual skeleton. */}
      <span className="sr-only" role="status" aria-live="polite">
        {t('integrations.loading_tabs')}
      </span>
    </div>
  );
}

