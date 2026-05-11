/**
 * AgentLink — centralized clickable agent reference.
 *
 * For SuperAdmins: clicking switches the global agent context to the target
 * agent and navigates to /setup (the agent setup page).
 * For non-SuperAdmins: renders the agent name as plain text. The destination
 * page reads agent from context, so cmd-click / new-tab is intentionally
 * suppressed — opening Setup in a new tab loses the in-memory selection.
 *
 * Usage:
 *   <AgentLink agentId={user.first_agent_id} agentName={user.first_agent_name} />
 *
 * Renders an em-dash if either id or name is missing.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAgentStore } from '../stores/agentStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';

interface AgentLinkProps {
  agentId: string | null | undefined;
  agentName: string | null | undefined;
  /** Override the default text styling. */
  className?: string;
  /** Optional fallback when agent is missing (default: em-dash). */
  fallback?: React.ReactNode;
}

const DEFAULT_FALLBACK = <span className="text-neutral-400">—</span>;

export function AgentLink({
  agentId,
  agentName,
  className,
  fallback = DEFAULT_FALLBACK,
}: AgentLinkProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;

  const switchAgent = useAgentStore((state) => state.switchAgent);

  const [isNavigating, setIsNavigating] = useState(false);

  if (!agentId || !agentName) return <>{fallback}</>;

  // Non-SuperAdmin sees plain text — no link, no navigation hint.
  if (!isSuperAdmin) {
    return <span className={className ?? 'text-sm text-neutral-900'}>{agentName}</span>;
  }

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isNavigating) return;

    setIsNavigating(true);
    try {
      // switchAgent fetches the agent by id internally, so it works even
      // when the target isn't in any currently-loaded page.
      await switchAgent(agentId);
      navigate('/setup');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AgentLink] failed to switch to agent', agentId, err);
      toast.error(t('agent_link.switch_failed', 'Could not open agent'));
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isNavigating}
      className={
        className ??
        'inline-flex items-center gap-1 text-sm text-neutral-900 underline underline-offset-2 hover:text-neutral-700 disabled:opacity-60 disabled:cursor-wait text-left'
      }
      title={t('agent_link.open_setup', 'Open agent setup')}
    >
      <span className="truncate">{agentName}</span>
      {isNavigating && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
    </button>
  );
}
