/**
 * Connected Integration Card
 *
 * Visual treatment intentionally matches `features/connections/components/cards/ConnectedPlatformCard.tsx`
 * so the Tools page and Connections page feel like a single family of surfaces.
 *
 * Layout: single horizontal row (icon + name + meta strip + menu), with an
 * optional second row of operation chips dragged under the main row. The chip
 * row is unique to the integrations surface (connections don't have per-op state)
 * but visually subordinate so the card still reads "one row, like /connections".
 *
 * Actions surface:
 *  - Whole card is clickable (placeholder no-op for now — TODO: open management
 *    view per connector). Matches /connections's `handleCardClick` pattern.
 *  - Three-dot menu on the right hosts everything else: Test, Reconnect, Delete.
 *    "Test" moved here per UX request (out of inline) so the row stays clean.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Trash2, RefreshCw, FlaskConical, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/Button';
import { IntegrationIcon } from '../IntegrationIcon';
import ReconnectConnectionModal from '../ReconnectConnectionModal';
import { useTestConnection } from '../../hooks/useIntegrations';
import { getIntegrationById, type IntegrationOperationMeta } from '../../constants/integrations';
import type { IntegrationConnection } from '../../types';

export interface ConnectedIntegrationCardProps {
  connection: IntegrationConnection;
  /** Set of operation ids enabled on THIS connection (derived from agent's actions). */
  enabledOps: Set<string>;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  className?: string;
}

export function ConnectedIntegrationCard({
  connection,
  enabledOps,
  onDelete,
  isDeleting,
  className,
}: ConnectedIntegrationCardProps) {
  const { t } = useTranslation();
  const meta = getIntegrationById(connection.connectorType);

  const [isReconnectOpen, setIsReconnectOpen] = useState(false);
  const handleOpenReconnect = useCallback(() => setIsReconnectOpen(true), []);
  const handleCloseReconnect = useCallback(() => setIsReconnectOpen(false), []);

  // Inline test state — when user clicks "Test" inside the dropdown, we briefly
  // show success/error icons on the menu item itself. Keeps the affordance discoverable
  // without adding a second inline button to the row.
  const testMutation = useTestConnection();
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  const handleTest = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLastTestResult(null);
    try {
      const result = await testMutation.mutateAsync(connection.id);
      setLastTestResult(result.success ? 'success' : 'error');
    } catch {
      setLastTestResult('error');
    }
  }, [connection.id, testMutation]);

  // "Active" is encoded by the corner dot (green) — no extra pill required, matches
  // /connections's pattern of "presence = healthy". Token-expired or non-active connections
  // hide the dot; the user will see them via the row's reduced opacity instead.
  const isHealthy = connection.status === 'active' && !connection.isTokenExpired;

  // Subtitle text — short, low-noise, mirrors the /connections card's metadata strip.
  // The connector name + a chip-style "spreadsheet id" anchor are the only crumbs the
  // user actually needs at a glance.
  const subtitleChunks: string[] = [];
  if (meta?.name) subtitleChunks.push(meta.name);
  if (connection.config?.spreadsheet_id) {
    subtitleChunks.push(`${(connection.config.spreadsheet_id as string).substring(0, 14)}…`);
  }

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3 transition-all hover:border-neutral-300 hover:shadow-sm',
          !isHealthy && 'opacity-90',
          className
        )}
      >
        {/* Top row — mirrors /connections exactly: icon (with status dot) + name +
            metadata strip + dropdown menu. Tight horizontal layout. */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Icon with corner status dot. The dot IS the active signal — no need
              for a separate "Active" pill, per /connections's pattern. */}
          <div className="flex-shrink-0 relative">
            <IntegrationIcon
              connectorId={connection.connectorType}
              brandBgColor={meta?.brandBgColor}
              size="md"
            />
            {isHealthy && (
              <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white bg-green-500" />
            )}
          </div>

          {/* Account info — name + meta strip, same shape as /connections. */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-sm font-semibold text-neutral-900 truncate">
                {connection.name}
              </h3>
            </div>

            {/* Metadata strip — bullet-separated, low contrast. dir="ltr" on the
                whole strip because spreadsheet ids are ASCII and bidi reflow can
                push the trailing ellipsis to the wrong side in Arabic. */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-neutral-500 flex-wrap"
              dir="ltr"
            >
              {subtitleChunks.map((chunk, i) => (
                <span key={i} className="whitespace-nowrap flex items-center gap-1.5 sm:gap-2">
                  {i > 0 && <span>•</span>}
                  <span>{chunk}</span>
                </span>
              ))}

              {!isHealthy && (
                <>
                  <span>•</span>
                  <span className="whitespace-nowrap text-amber-600 font-medium">
                    {t('tools.status_needs_reconnect')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Dropdown menu — Test moved here per UX request. Order: Test → Reconnect → Delete.
              Test shows transient success/error state on the menu item itself. */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem onClick={handleTest} disabled={testMutation.isPending}>
                  {testMutation.isPending ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : lastTestResult === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 me-2 text-green-600" />
                  ) : lastTestResult === 'error' ? (
                    <XCircle className="h-4 w-4 me-2 text-red-600" />
                  ) : (
                    <FlaskConical className="h-4 w-4 me-2" />
                  )}
                  {testMutation.isPending ? t('tools.testing') : t('tools.test')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleOpenReconnect}>
                  <RefreshCw className="h-4 w-4 me-2" />
                  {t('tools.reconnect')}
                </DropdownMenuItem>

                <div className="my-1 border-t border-neutral-200" />

                <DropdownMenuItem
                  onClick={() => onDelete(connection.id)}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t('tools.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Operation chips — second row, tucked under the main row. Visually
            subordinate (small pills, tight gap) so the card still reads as a
            single-row /connections-style item. Only renders if the connector
            declares operations. */}
        {meta && meta.operations.length > 0 && (
          <div className="flex flex-wrap gap-1 ps-12 sm:ps-13">
            {meta.operations.map((op) => (
              <OperationChip key={op.id} op={op} enabled={enabledOps.has(op.id)} />
            ))}
          </div>
        )}
      </div>

      <ReconnectConnectionModal
        isOpen={isReconnectOpen}
        onClose={handleCloseReconnect}
        connection={connection}
      />
    </>
  );
}

/**
 * Capability chip — specialized inline because it's only used here.
 * Filled = at least one action wires up this op on this connection.
 * Outlined = op is supported by the connector but no action uses it yet.
 */
function OperationChip({
  op,
  enabled,
}: {
  op: IntegrationOperationMeta;
  enabled: boolean;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none',
        enabled
          ? 'bg-brand-mojeeb-light text-brand-mojeeb border border-brand-mojeeb/20'
          : 'bg-white text-neutral-400 border border-neutral-200'
      )}
      title={enabled ? t('tools.op_chip_enabled_tooltip') : t('tools.op_chip_available_tooltip')}
    >
      {t(op.i18nKey)}
    </span>
  );
}
