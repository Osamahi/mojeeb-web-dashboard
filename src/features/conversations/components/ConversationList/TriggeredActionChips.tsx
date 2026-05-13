/**
 * Triggered Action Chips
 *
 * Renders, inline on the conversation card, a compact summary of which actions
 * successfully ran during the conversation. Reads from
 * `Conversation.triggered_actions` (denormalized on the conversation row by the
 * backend's ActionQueueProcessor; capped at 10 most-recent entries server-side).
 *
 * Display rules:
 * - 0 entries → renders nothing (empty UI for the 80% of conversations with no actions).
 * - 1-3 entries → all visible inline.
 * - 4+ entries → first 2 entries + "+N" overflow chip.
 *
 * Icon resolution mirrors `IntegrationConnectionCard.connectorIcons` so the same
 * connector renders with the same icon everywhere. Non-integration action types
 * (api_call, webhook) fall back to a per-type glyph; anything else uses Zap.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Webhook, Globe, Zap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { TriggeredAction } from '../../types';

// Closed set of operation_id keys we have translations for. Keys outside this
// set render as icon-only (no label) so we never display the raw machine key
// (e.g. "add_row") to end users by mistake.
const TRANSLATABLE_OPERATIONS = new Set([
  'add_row',
  'update_row',
  'read_row',
  'lead_capture',
]);

// Subset of operations that ship a tooltip-hover description explaining what
// the action did (e.g. "Lead captured" → "The client's data has been sent to
// your CRM on Mojeeb."). Add a key here AND in the locale's
// triggered_actions.descriptions block to enable a description for a new op.
const OPERATIONS_WITH_DESCRIPTION = new Set([
  'lead_capture',
  'add_row',
  'update_row',
  'read_row',
]);

interface TriggeredActionChipsProps {
  actions: TriggeredAction[] | null | undefined;
}

const MAX_INLINE = 2;

// Brand-mark SVGs served from /public for providers that have one. Used in
// preference to lucide glyphs so the chip carries actual brand identity
// (Mojeeb gradient mark, Google "G", etc.). Match is exact on `provider`
// for first-party, prefix-based for vendor families (google_sheets,
// google_calendar, google_drive — all map to the same "G").
function getBrandMarkSrc(provider: string | null): string | null {
  if (!provider) return null;
  if (provider === 'mojeeb') return '/mojeeb-mark.svg';
  if (provider.startsWith('google_')) return '/google-g.svg';
  return null;
}

// Fallback icon per action_type when no brand mark applies (raw HTTP escape
// hatches without persisted provider identity — customer-defined api_call /
// webhook). Returns a lucide icon component, not a JSX element.
const actionTypeIcons: Record<string, typeof Webhook> = {
  webhook: Webhook,
  api_call: Globe,
};

/**
 * Renders the chip icon. Brand-mark providers (Mojeeb, Google family, future
 * HubSpot/Slack/etc.) get their real logo as an <img>; everything else falls
 * back to a lucide glyph mapped from action_type, or a generic Zap. Centralized
 * here so the render path stays clean and adding a new brand is a one-liner
 * in getBrandMarkSrc.
 */
function ChipIcon({ action }: { action: TriggeredAction }) {
  const brandSrc = getBrandMarkSrc(action.provider);
  if (brandSrc) {
    return (
      <img
        src={brandSrc}
        alt=""
        aria-hidden="true"
        className="w-3 h-3 flex-shrink-0"
      />
    );
  }

  const Icon = actionTypeIcons[action.action_type] || Zap;
  return <Icon className="w-3 h-3 flex-shrink-0" />;
}

const TriggeredActionChips = memo(function TriggeredActionChips({ actions }: TriggeredActionChipsProps) {
  const { t } = useTranslation();

  if (!actions || actions.length === 0) return null;

  const visible = actions.slice(0, MAX_INLINE);
  const overflow = actions.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {visible.map((action) => {
        // Translate the label by operation_id when we have a mapping for it.
        // Anything outside the closed set renders as icon-only — we never
        // display the raw key (e.g. "add_row") to end users.
        const hasLabel =
          action.operation_id != null && TRANSLATABLE_OPERATIONS.has(action.operation_id);
        const label = hasLabel
          ? t(`triggered_actions.operations.${action.operation_id}`)
          : null;

        // Per product call: only operations with a description show a hover
        // tooltip; chips for operations without one are non-interactive (no
        // dimmed empty popover, no boilerplate). Today only lead_capture has
        // a description; add an operation to OPERATIONS_WITH_DESCRIPTION + its
        // locale entry to surface a tooltip for it.
        const hasDescription =
          action.operation_id != null && OPERATIONS_WITH_DESCRIPTION.has(action.operation_id);

        const chipClass = hasLabel
          ? 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white border border-neutral-200 text-neutral-700'
          : 'inline-flex items-center justify-center w-5 h-5 rounded-md bg-white border border-neutral-200';

        const chip = (
          <span
            className={chipClass}
            aria-label={`Action triggered: ${action.action_name}`}
          >
            <ChipIcon action={action} />
            {hasLabel && <span>{label}</span>}
          </span>
        );

        if (!hasDescription) {
          // Plain chip — no tooltip wrapper.
          return <span key={action.execution_id}>{chip}</span>;
        }

        return (
          <Tooltip key={action.execution_id} delayDuration={150}>
            <TooltipTrigger asChild>{chip}</TooltipTrigger>
            <TooltipContent side="top" align="center" className="text-xs max-w-[260px] leading-snug">
              {t(`triggered_actions.descriptions.${action.operation_id}`)}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {overflow > 0 && (
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white border border-neutral-200 text-neutral-600">
              +{overflow}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {overflow} more action{overflow > 1 ? 's' : ''} — open conversation to view
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});

export default TriggeredActionChips;
