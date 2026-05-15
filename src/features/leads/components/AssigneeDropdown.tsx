/**
 * AssigneeDropdown
 *
 * The single source of truth for the assignee picker UX across the Clients
 * page — inline in the row, in the detail drawer, and in the filter toolbar.
 *
 * Mirrors the shape of `LeadStatusDropdown` so the two pickers feel
 * identical: trigger uses the same DropdownMenu primitive, RTL-safe,
 * `stopPropagation` baked in for clickable parents.
 *
 * Two modes via the `mode` prop:
 *   - "cell"   → assign / unassign a single lead. Value is `string | null`.
 *                Order: "Assign to me" pinned, then "Unassigned", then alpha members.
 *   - "filter" → toolbar filter. Value is the same plus the special "all"
 *                token meaning "no filter." Order: "All clients",
 *                "Assigned to me", "Unassigned", then alpha members.
 *
 * The dropdown opens with members already in memory (preloaded on page mount
 * via `useOrgMembers` shared cache), so there's no spinner on first click.
 */

import { Check, ChevronDown, UserCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgMembers } from '@/features/organizations/hooks/useOrgMembers';
import type { OrganizationMember } from '@/features/organizations/types';
import type { AssigneeFilter } from '../types/lead.types';

export type AssigneeDropdownMode = 'cell' | 'filter';

interface BaseProps {
  disabled?: boolean;
  className?: string;
  /**
   * Bordered trigger style — matches sibling filter controls on the Leads
   * page filter strip. Default (false) is borderless used inline in rows.
   */
  bordered?: boolean;
}

interface CellModeProps extends BaseProps {
  mode: 'cell';
  /** UUID of the current assignee, or null if unassigned. */
  value: string | null;
  onChange: (next: string | null) => void;
}

interface FilterModeProps extends BaseProps {
  mode: 'filter';
  /** `null` | 'all' = no filter. 'me' / 'unassigned' / UUID = filter tokens. */
  value: AssigneeFilter | 'all';
  onChange: (next: AssigneeFilter | 'all') => void;
}

export type AssigneeDropdownProps = CellModeProps | FilterModeProps;

function memberDisplayName(m: OrganizationMember): string {
  return m.user?.name?.trim() || m.user?.email?.trim() || m.userId.slice(0, 6);
}

export function AssigneeDropdown(props: AssigneeDropdownProps) {
  const { mode, disabled = false, className, bordered = false } = props;
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id) ?? null;
  const { data: members = [], isLoading } = useOrgMembers();

  // Resolve currently-shown label + avatar for the trigger.
  const triggerContent = useMemo(() => {
    // FILTER MODE
    if (mode === 'filter') {
      const v = (props as FilterModeProps).value;
      if (v == null || v === 'all') {
        return { label: t('leads.assignee_filter_all'), avatar: null as JSX.Element | null };
      }
      if (v === 'me') {
        return {
          label: t('leads.assigned_to_me'),
          avatar: <Avatar size="sm" name="Me" className="!w-5 !h-5 !text-[10px]" />,
        };
      }
      if (v === 'unassigned') {
        return {
          label: t('leads.unassigned'),
          avatar: <UnassignedCircle />,
        };
      }
      const m = members.find((x) => x.userId === v);
      return {
        label: m ? memberDisplayName(m) : t('leads.unknown_assignee'),
        avatar: <Avatar size="sm" name={m ? memberDisplayName(m) : '?'} className="!w-5 !h-5 !text-[10px]" />,
      };
    }

    // CELL MODE
    const v = (props as CellModeProps).value;
    if (v == null) {
      return { label: t('leads.unassigned'), avatar: <UnassignedCircle /> };
    }
    const m = members.find((x) => x.userId === v);
    return {
      label: m ? memberDisplayName(m) : t('leads.unknown_assignee'),
      avatar: <Avatar size="sm" name={m ? memberDisplayName(m) : '?'} className="!w-5 !h-5 !text-[10px]" />,
    };
  }, [mode, members, t, props]);

  // Sort members alphabetically by displayed name (stable across re-renders).
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) =>
      memberDisplayName(a).localeCompare(memberDisplayName(b)),
    );
  }, [members]);

  const triggerClasses = bordered
    ? 'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium text-neutral-900 bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={disabled || isLoading} className={triggerClasses}>
            {triggerContent.avatar}
            <span className="truncate max-w-[140px]">{triggerContent.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[16rem] max-h-[20rem] overflow-y-auto">
          {/* ── Filter-mode header rows ──────────────────────────────────── */}
          {mode === 'filter' && (
            <>
              <AssigneeRow
                label={t('leads.assignee_filter_all')}
                icon={null}
                selected={
                  (props as FilterModeProps).value == null ||
                  (props as FilterModeProps).value === 'all'
                }
                onClick={() => (props as FilterModeProps).onChange('all')}
              />
              <AssigneeRow
                label={t('leads.assigned_to_me')}
                icon={<Avatar size="sm" name="Me" className="!w-6 !h-6 !text-[10px]" />}
                selected={(props as FilterModeProps).value === 'me'}
                onClick={() => (props as FilterModeProps).onChange('me')}
                disabled={!currentUserId}
              />
              <AssigneeRow
                label={t('leads.unassigned')}
                icon={<UnassignedCircle size={6} />}
                selected={(props as FilterModeProps).value === 'unassigned'}
                onClick={() => (props as FilterModeProps).onChange('unassigned')}
              />
              <div role="separator" className="my-1 h-px bg-neutral-200" />
            </>
          )}

          {/* ── Cell-mode header rows ────────────────────────────────────── */}
          {mode === 'cell' && (
            <>
              {currentUserId && (
                <AssigneeRow
                  label={t('leads.assign_to_me')}
                  icon={<Avatar size="sm" name="Me" className="!w-6 !h-6 !text-[10px]" />}
                  selected={(props as CellModeProps).value === currentUserId}
                  onClick={() => (props as CellModeProps).onChange(currentUserId)}
                />
              )}
              <AssigneeRow
                label={t('leads.unassign')}
                icon={<UnassignedCircle size={6} />}
                selected={(props as CellModeProps).value == null}
                onClick={() => (props as CellModeProps).onChange(null)}
              />
              <div role="separator" className="my-1 h-px bg-neutral-200" />
            </>
          )}

          {/* ── Member list ───────────────────────────────────────────────── */}
          {sortedMembers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              {isLoading ? t('common.loading') : t('leads.no_team_members')}
            </div>
          ) : (
            sortedMembers.map((m) => {
              const name = memberDisplayName(m);
              const isSelected =
                mode === 'cell'
                  ? (props as CellModeProps).value === m.userId
                  : (props as FilterModeProps).value === m.userId;
              return (
                <AssigneeRow
                  key={m.userId}
                  label={name}
                  subLabel={m.user?.email ?? undefined}
                  icon={<Avatar size="sm" name={name} className="!w-6 !h-6 !text-[10px]" />}
                  selected={isSelected}
                  onClick={() =>
                    mode === 'cell'
                      ? (props as CellModeProps).onChange(m.userId)
                      : (props as FilterModeProps).onChange(m.userId)
                  }
                />
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Internal building blocks
// ───────────────────────────────────────────────────────────────────────────

interface AssigneeRowProps {
  label: string;
  subLabel?: string;
  icon: JSX.Element | null;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function AssigneeRow({ label, subLabel, icon, selected, onClick, disabled }: AssigneeRowProps) {
  return (
    <DropdownMenuItem
      onClick={() => {
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className="gap-2 items-center"
    >
      {icon ?? <div className="w-6 h-6 flex items-center justify-center"><UserCircle2 className="w-5 h-5 text-neutral-300" /></div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-neutral-900 truncate">{label}</div>
        {subLabel && (
          <div className="text-xs text-neutral-500 truncate">{subLabel}</div>
        )}
      </div>
      {selected && <Check className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />}
    </DropdownMenuItem>
  );
}

function UnassignedCircle({ size = 5 }: { size?: number }) {
  // Dashed grey circle = first-class "Unassigned" affordance, never blank.
  return (
    <div
      className="rounded-full border border-dashed border-neutral-300 bg-neutral-50 flex-shrink-0"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      aria-hidden
    />
  );
}
