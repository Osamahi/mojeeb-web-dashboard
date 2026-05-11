/**
 * Edit Connection Actions Modal
 *
 * Lets a user manage the operations wired to one integration connection without
 * leaving the Tools page. Two surfaces in one form:
 *  - Read-only metadata strip (sheet name, tab, columns) — dimmed; user changes
 *    these via Reconnect or the /actions technical view.
 *  - Per-operation blocks: toggle (enable/disable) + trigger-prompt textarea.
 *    Only mutable concerns live here. add_row's toggle is hidden (it's the base
 *    op; disabling it would leave the connection functionally dead).
 *
 * Save semantics — connector-agnostic, zero backend changes:
 *  - Diff modal state against initial state on submit.
 *  - For each op that changed: fire ONE request via the appropriate existing
 *    endpoint (PUT for is_active flips + prompt edits, POST for first-time
 *    enable). Promise.allSettled so a partial failure doesn't abort the others.
 *  - When toggling ON an op that's never existed, clone any sibling action's
 *    action_config wholesale and swap the operation discriminator. The frontend
 *    never names a connector-specific field (target_tab, calendar_id, etc.) —
 *    works identically for Calendar / Notion / Shopify when those ship.
 *
 * Tradeoff: not atomic across all three requests. If one fails, the others may
 * have committed. Acceptable because operations are independent and retry is
 * idempotent — user clicks Save again and the diff narrows to the failed op.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAgentContext } from '@/hooks/useAgentContext';
import { actionService } from '@/features/actions/services/actionService';
import { buildPairedActionRequest, type ActionLike } from '@/features/actions/utils/integrationUtils';
import { useConnectionMetadata } from '../hooks/useIntegrations';
import { getIntegrationById } from '../constants/integrations';
import type { IntegrationConnection } from '../types';
import type { Action } from '@/features/actions/types';

/** Operations the edit modal exposes. Order = render order top-to-bottom. */
const EDITABLE_OPERATIONS: ReadonlyArray<{
  id: string;
  labelKey: string;
  /** Whether the user can toggle this op off. `add_row` is the base op — always on
   *  when actions exist; toggling it off would leave the connection useless. */
  toggleable: boolean;
}> = [
  { id: 'add_row',    labelKey: 'tools.op_add_row',    toggleable: false },
  { id: 'update_row', labelKey: 'tools.op_update_row', toggleable: true  },
  { id: 'read_row',   labelKey: 'tools.op_read_row',   toggleable: true  },
];

/** One row of editable state, one per operation. */
interface OperationFormState {
  /** Existing action for this op on this connection, if any. */
  existing: Action | undefined;
  /** User-toggled state. For non-toggleable ops, mirrors !!existing on init. */
  enabled: boolean;
  /** User-typed prompt. Pre-filled from existing action's trigger_prompt. */
  triggerPrompt: string;
}

export interface EditConnectionActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: IntegrationConnection | null;
  /** Actions tied to this connection (already filtered by the page). */
  connectionActions: Action[];
  /** Most-used target tab — same crumb shown in the card subtitle. */
  mostUsedTab?: string;
}

export function EditConnectionActionsModal({
  isOpen,
  onClose,
  connection,
  connectionActions,
  mostUsedTab,
}: EditConnectionActionsModalProps) {
  const { t } = useTranslation();
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const meta = connection ? getIntegrationById(connection.connectorType) : undefined;

  // Fetch live metadata so we can show the spreadsheet title + column list in
  // the dimmed read-only strip. Same hook used elsewhere — query is cached
  // (2-min staleTime) so this is usually free.
  const { data: connectionMetadata } = useConnectionMetadata(connection?.id ?? null);

  // Initial state derived from existing actions, keyed by operation id.
  const initialState = useMemo<Record<string, OperationFormState>>(() => {
    const state: Record<string, OperationFormState> = {};
    for (const op of EDITABLE_OPERATIONS) {
      const existing = connectionActions.find(
        (a) => (a.actionConfig?.operation as string | undefined) === op.id
      );
      state[op.id] = {
        existing,
        enabled: !!existing && existing.isActive,
        triggerPrompt: existing?.triggerPrompt ?? '',
      };
    }
    return state;
  }, [connectionActions]);

  // Mutable form state — reset when initialState changes (modal reopens for
  // different connection, actions list refetches mid-edit, etc.).
  const [formState, setFormState] = useState<Record<string, OperationFormState>>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (isOpen) setFormState(initialState);
  }, [isOpen, initialState]);

  const handleToggle = (opId: string, enabled: boolean) => {
    setFormState((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], enabled },
    }));
  };

  const handlePromptChange = (opId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], triggerPrompt: value },
    }));
  };

  // ─── Diff + dispatch on save ────────────────────────────────────────────
  // For each op, compare current form state to initial state. Fire the right
  // request iff something changed. No request for no-op cases (toggle off→on→off
  // before save = zero requests).
  const handleSave = async () => {
    if (!connection || !agentId) return;
    setIsSaving(true);

    type DispatchPromise = Promise<{ opId: string; ok: boolean; error?: unknown }>;
    const dispatches: DispatchPromise[] = [];

    // Pick any existing action to clone from when creating a first-time enable.
    // Falls back to undefined if the connection has zero actions; the clone
    // branch handles that case explicitly.
    const cloneSource: ActionLike | undefined = connectionActions[0];

    for (const op of EDITABLE_OPERATIONS) {
      const before = initialState[op.id];
      const after = formState[op.id];
      if (!before || !after) continue;

      const wasEnabled = before.enabled;
      const isEnabled = after.enabled;
      const promptChanged = before.triggerPrompt !== after.triggerPrompt;
      const enableChanged = wasEnabled !== isEnabled;

      // 1. Action exists + only prompt changed + still enabled
      if (before.existing && !enableChanged && promptChanged && isEnabled) {
        dispatches.push(
          actionService
            .updateAction(before.existing.id, agentId, { triggerPrompt: after.triggerPrompt })
            .then(() => ({ opId: op.id, ok: true }))
            .catch((error) => ({ opId: op.id, ok: false, error }))
        );
        continue;
      }

      // 2. Action exists + toggle flipped (with or without prompt change)
      if (before.existing && enableChanged) {
        const patch: { isActive: boolean; triggerPrompt?: string } = { isActive: isEnabled };
        // If user typed a new prompt at the same time as toggling, persist it.
        // If they only toggled (no prompt edit), leave triggerPrompt alone so the
        // last good prompt survives toggle cycles (re-enable resurrects it).
        if (promptChanged) patch.triggerPrompt = after.triggerPrompt;
        dispatches.push(
          actionService
            .updateAction(before.existing.id, agentId, patch)
            .then(() => ({ opId: op.id, ok: true }))
            .catch((error) => ({ opId: op.id, ok: false, error }))
        );
        continue;
      }

      // 3. Action doesn't exist + user enabled it (first-time create)
      if (!before.existing && isEnabled) {
        if (!cloneSource) {
          // No sibling to clone config from. Surface a clear error rather than
          // sending a half-baked POST that the backend's per-op validators will
          // reject. User has to create the first action via the create flow.
          dispatches.push(
            Promise.resolve({
              opId: op.id,
              ok: false,
              error: new Error(t('tools.edit_modal_no_clone_source')),
            })
          );
          continue;
        }
        const cloneable: ActionLike = {
          id: cloneSource.id,
          agentId: cloneSource.agentId,
          name: cloneSource.name,
          description: cloneSource.description,
          triggerPrompt: cloneSource.triggerPrompt,
          actionType: cloneSource.actionType,
          actionConfig: cloneSource.actionConfig,
          integrationConnectionId: cloneSource.integrationConnectionId,
          isActive: cloneSource.isActive,
          priority: cloneSource.priority,
        };
        const createReq = buildPairedActionRequest(cloneable, op.id, after.triggerPrompt);
        dispatches.push(
          actionService
            .createAction(createReq)
            .then(() => ({ opId: op.id, ok: true }))
            .catch((error) => ({ opId: op.id, ok: false, error }))
        );
        continue;
      }

      // 4. All no-op cases (no diff, or "disabled and never existed") — skip.
    }

    if (dispatches.length === 0) {
      // Nothing to save — close cleanly.
      setIsSaving(false);
      onClose();
      return;
    }

    const results = await Promise.all(dispatches);
    const failures = results.filter((r) => !r.ok);

    // Refresh the cached action list so the page reflects new state, regardless
    // of whether everything succeeded — partial state is still real state.
    queryClient.invalidateQueries({ queryKey: ['actions', agentId] });

    if (failures.length === 0) {
      toast.success(t('tools.edit_modal_saved'));
      setIsSaving(false);
      onClose();
    } else {
      toast.error(
        t('tools.edit_modal_partial_failure', { count: failures.length, total: results.length })
      );
      setIsSaving(false);
      // Stay open so user can see what didn't take and retry.
    }
  };

  // ─── Read-only metadata strip ─────────────────────────────────────────────
  // Same crumbs the connection card shows in its subtitle. Plus the column list,
  // which we have from the existing /metadata fetch — surfaces what the LLM
  // sees without making it editable here (column edits live in /actions).
  // (No subtitle crumbs — file/sheet identity is conveyed by the modal title
  // and the column-header table preview below.)

  // Column headers from the most-used tab if we can find it; otherwise the first
  // tab's headers as a soft fallback. The list is purely informational here.
  const columnHeaders = useMemo(() => {
    if (!connectionMetadata?.tabs) return [];
    const targetTab =
      connectionMetadata.tabs.find((t) => t.name === mostUsedTab) ?? connectionMetadata.tabs[0];
    return targetTab?.headers ?? [];
  }, [connectionMetadata, mostUsedTab]);

  // Track scroll state of the table preview to drive the edge-fade visibility.
  // Each fade ONLY renders when there's actually overflow in that direction:
  //   - Start fade: visible when user has scrolled away from the start
  //   - End fade:   visible when there's more content past the visible area
  // The forced `dir="ltr"` on the scroll container means "start" = left edge,
  // "end" = right edge in pixel terms regardless of UI direction.
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<{ canStart: boolean; canEnd: boolean }>({
    canStart: false,
    canEnd: false,
  });

  const recalcScrollState = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    // `scrollLeft + clientWidth >= scrollWidth - 1` covers sub-pixel rounding
    // (Chrome reports fractional scroll positions). The -1 tolerance avoids the
    // fade flickering when "at end" but off by 0.5px.
    const canEnd = el.scrollWidth - el.clientWidth - el.scrollLeft > 1;
    const canStart = el.scrollLeft > 1;
    setScrollState((prev) => {
      if (prev.canStart === canStart && prev.canEnd === canEnd) return prev;
      return { canStart, canEnd };
    });
  }, []);

  // Run once on mount + when headers change, and listen for resize. The
  // ResizeObserver catches modal resize, font load, headers list change —
  // anything that affects whether the table actually overflows.
  useLayoutEffect(() => {
    recalcScrollState();
    const el = tableScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(recalcScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalcScrollState, columnHeaders, isOpen]);

  if (!connection) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={t('tools.edit_modal_title', { name: connection.name })}
      maxWidth="lg"
      isLoading={isSaving}
      closable={!isSaving}
    >
      <div className="space-y-5">
        {/* Connection summary — table preview only. No labeled subtitle row;
            the file/sheet identity is conveyed by the modal title (the user's
            connection name) plus the column-header preview below. */}
        <section className="space-y-1.5">

          {/* Header preview — mini spreadsheet view of the column names. Looks
              like the top row of an actual sheet. Always rendered LTR regardless
              of UI direction, because:
                1. Column headers are a tabular preview, not a translatable label
                2. Google Sheets in both AR and EN has column A at the trailing
                   edge depending on locale — we're not faithfully rendering the
                   user's sheet, just showing what columns exist
                3. Consistent visual identity between EN/AR users prevents the
                   "is this my sheet?" confusion that mirroring would create
              The forced `dir="ltr"` inverts inside-table directionality so
              text-start = left, border-inline-end = right. Logical properties
              continue to work correctly inside this container.

              Layout choices:
                - Header row (bold) + one empty body row → sells the "this is a
                  spreadsheet" framing without inventing fake data.
                - No `min-w-full` on the table → it can be narrower than the
                  container when there are few headers, AND wider when there are
                  many (horizontal scroll kicks in naturally).
                - Trailing-edge horizontal fade hints at off-screen columns.
                - Bottom edge fade hints "more rows live below" — completes the
                  preview metaphor without showing fake data. */}
          {/* Mini spreadsheet preview — visual recipe matches the SetupChecklist
              "card" treatment in features/agents (rounded-xl, soft Mint-White
              background, deep elevation shadow, hairline border). Same visual
              language used for "elevated content cards" across the dashboard.

              Native scrollbar is hidden via .scrollbar-hide; users still get
              touch/trackpad scroll. Edge fades take the role of "there's more
              this way" — both fades are conditionally rendered based on actual
              scroll position so:
                - At rest with no overflow: neither fade visible
                - At rest with overflow: only the end-side fade visible
                - Mid-scroll: both fades visible
                - Scrolled all the way: only the start-side fade visible

              `dir="ltr"` is forced on the scroll container — see comment further
              above for why (preview, not faithful rendering of the user's sheet). */}
          {columnHeaders.length > 0 && (
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
                    {/* Single empty body row — communicates "rows go here" without
                        fabricating data. Min-height keeps cells tangible. */}
                    <tr>
                      {columnHeaders.map((_, i) => (
                        <td
                          key={i}
                          className={cn(
                            'px-3 py-2 h-7 border-t border-neutral-200',
                            i < columnHeaders.length - 1 && 'border-e border-neutral-200'
                          )}
                          aria-hidden="true"
                        >
                          {/* deliberately empty — visual placeholder only */}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Start-edge fade — only renders when user has scrolled away from
                  the start. Disappears when scroll position is 0. */}
              {scrollState.canStart && (
                <div
                  className="pointer-events-none absolute inset-y-0 start-0 w-8 rounded-s-xl"
                  style={{
                    background: 'linear-gradient(to right, #FCFEFC, rgba(252,254,252,0))',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* End-edge fade — only renders when there's content past the
                  visible area. Disappears when scrolled to the end. */}
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
          )}
        </section>

        {/* Spacer — separates the read-only connection preview from the
            editable operation blocks below. Pure vertical margin (no divider,
            no heading) — keeps the modal feeling like a clean continuous form
            rather than a multi-section page. */}
        <div className="h-6" aria-hidden="true" />

        {/* Per-operation blocks */}
        {EDITABLE_OPERATIONS.map((op, idx) => {
          const state = formState[op.id];
          if (!state) return null;
          const isToggleable = op.toggleable;
          // Render rules:
          //  - add_row (not toggleable): show textarea iff it exists, else hide entire block
          //  - update/read (toggleable): always show toggle; show textarea iff enabled
          if (!isToggleable && !state.existing) return null;

          return (
            <section key={op.id} className={idx > 0 ? 'border-t border-neutral-100 pt-4' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-800">
                  {t(op.labelKey)}
                </label>
                {/* Same Switch component in both branches — for non-toggleable ops
                    (e.g. add_row, the base op) we render it as a permanently-on,
                    disabled switch. The dim state communicates "this is locked"
                    while keeping visual language consistent with the other rows;
                    a separate pill component (e.g. "Always on") would break that
                    consistency. The tooltip carries the why. */}
                <Switch
                  checked={isToggleable ? state.enabled : true}
                  onChange={(checked) => isToggleable && handleToggle(op.id, checked)}
                  disabled={!isToggleable || isSaving}
                  size="sm"
                  aria-label={
                    isToggleable
                      ? undefined
                      : t('tools.edit_modal_base_op_badge')
                  }
                  title={
                    isToggleable
                      ? undefined
                      : t('tools.edit_modal_base_op_badge')
                  }
                />
              </div>

              {state.enabled && (
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t('tools.edit_modal_prompt_label')}
                  </label>
                  {/* `resize-y` lets users drag the bottom edge to give long
                      prompts room; `min-h-[8rem]` keeps the box from collapsing
                      smaller than the default 5-row visible height (≈128px). */}
                  <textarea
                    value={state.triggerPrompt}
                    onChange={(e) => handlePromptChange(op.id, e.target.value)}
                    disabled={isSaving}
                    rows={5}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-mojeeb focus:outline-none focus:ring-1 focus:ring-brand-mojeeb resize-y min-h-[8rem] disabled:opacity-50"
                    placeholder={t('tools.edit_modal_prompt_placeholder')}
                  />
                </div>
              )}
            </section>
          );
        })}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-mojeeb hover:bg-brand-mojeeb-hover text-white"
          >
            {isSaving ? t('common.saving') : t('common.save_changes')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
