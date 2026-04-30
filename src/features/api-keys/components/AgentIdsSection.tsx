import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bot, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { agentService } from '@/features/agents/services/agentService';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * AgentIdsSection
 *
 * Click-to-copy list of every agent in the org. Sits at the top of the
 * API Keys page so customers can grab the agent_id values they need for
 * curl examples without hunting through agent settings or URLs.
 *
 * Why on the API Keys page (not agent settings):
 *   - Customers come here AFTER copying their API key, looking at docs,
 *     and realizing the curl examples need an agent_id. They're on this
 *     screen at the moment of need.
 *   - Stripe puts API keys + account ID together on the same dashboard
 *     page for the same reason — co-locate identifiers a customer pastes
 *     into code.
 *
 * Cache: shares the ['agents','all'] queryKey with anything else fetching
 * the org's agent list.
 */
export function AgentIdsSection() {
  const { t } = useTranslation();
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents', 'all'],
    queryFn: () => agentService.getAgents(),
    staleTime: 60_000,
  });

  // Hide entirely once we know the org has zero agents — empty list is
  // noise. While loading, render skeleton rows that match the real layout
  // so the page doesn't jump when data lands.
  if (!isLoading && agents.length === 0) {
    return null;
  }

  const copyId = async (agentId: string) => {
    try {
      await navigator.clipboard.writeText(agentId);
      toast.success(t('api_keys.agent_id_copied', 'Agent ID copied'));
    } catch {
      toast.error(t('api_keys.copy_failed', 'Could not copy to clipboard'));
    }
  };

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-medium text-neutral-700">
          {t('api_keys.agent_ids_title', 'Your agent IDs')}
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          {t(
            'api_keys.agent_ids_description',
            'Pass these as the agent_id field in your API requests. Click any ID to copy.'
          )}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        {isLoading
          ? // 3 skeleton rows is enough to fill the section without
            // implying a specific agent count. Layout (icon + name +
            // monospace pill) matches the real row so the page doesn't
            // jump when data lands.
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <Bot className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                <Skeleton height="14px" width="120px" />
                <Skeleton height="22px" width="240px" className="ml-auto rounded" />
              </div>
            ))
          : agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors"
              >
                <Bot className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-900 flex-shrink-0">
                  {agent.name}
                </span>
                <button
                  type="button"
                  onClick={() => copyId(agent.id)}
                  className="ml-auto inline-flex items-center gap-2 font-mono text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded px-2.5 py-1 transition-colors min-w-0 max-w-full"
                  title={t('api_keys.copy_agent_id', 'Copy agent ID') ?? ''}
                >
                  <span className="truncate">{agent.id}</span>
                  <Copy className="w-3 h-3 flex-shrink-0" />
                </button>
              </div>
            ))}
      </div>
    </section>
  );
}

export default AgentIdsSection;
