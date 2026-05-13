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
import { FileSpreadsheet, Webhook, Globe, Zap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { TriggeredAction } from '../../types';

interface TriggeredActionChipsProps {
  actions: TriggeredAction[] | null | undefined;
}

const MAX_INLINE = 2;

// Icon per `provider` when present. Add new providers (third-party connectors
// or first-party Mojeeb capabilities) here as they ship. Lucide icons render
// as React components; the Mojeeb brand mark is special-cased as an <img>
// because we want the actual gradient logomark, not a generic glyph.
const providerIcons: Record<string, typeof FileSpreadsheet> = {
  google_sheets: FileSpreadsheet,
};

// Fallback icon per action_type when provider is null or unmapped (raw HTTP
// escape hatches without persisted provider identity — customer-defined
// api_call/webhook).
const actionTypeIcons: Record<string, typeof FileSpreadsheet> = {
  webhook: Webhook,
  api_call: Globe,
};

/**
 * Renders the chip icon. Mojeeb gets the actual brand mark; everything else
 * routes through the lucide icon map. Centralized here so chip rendering
 * picks the right element without conditionals at every call site.
 */
function ChipIcon({ action }: { action: TriggeredAction }) {
  if (action.provider === 'mojeeb') {
    return (
      <img
        src="/mojeeb-mark.svg"
        alt=""
        aria-hidden="true"
        className="w-3 h-3 flex-shrink-0"
      />
    );
  }

  const Icon = (action.provider && providerIcons[action.provider])
    || actionTypeIcons[action.action_type]
    || Zap;
  return <Icon className="w-3 h-3 flex-shrink-0" />;
}

const TriggeredActionChips = memo(function TriggeredActionChips({ actions }: TriggeredActionChipsProps) {
  if (!actions || actions.length === 0) return null;

  const visible = actions.slice(0, MAX_INLINE);
  const overflow = actions.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {visible.map((action) => (
        <Tooltip key={action.execution_id} delayDuration={150}>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white border border-neutral-200 text-neutral-700 max-w-[140px]"
              aria-label={`Action triggered: ${action.action_name}`}
            >
              <ChipIcon action={action} />
              <span className="truncate">{action.action_name}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="font-medium">{action.action_name}</div>
            {action.provider && action.operation_id && (
              <div className="text-neutral-300">
                {action.provider}: {action.operation_id}
              </div>
            )}
            <div className="text-neutral-400 font-mono text-[10px] mt-1">
              exec: {action.execution_id.slice(0, 8)}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}

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
