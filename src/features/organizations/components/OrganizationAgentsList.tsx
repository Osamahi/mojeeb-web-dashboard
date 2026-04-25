import { useQuery } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { agentService } from '@/features/agents/services/agentService';

interface OrganizationAgentsListProps {
  organizationId: string;
  enabled?: boolean;
  showHeader?: boolean;
}

export function OrganizationAgentsList({
  organizationId,
  enabled = true,
  showHeader = true,
}: OrganizationAgentsListProps) {
  const { t } = useTranslation();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents', 'organization', organizationId],
    queryFn: () => agentService.getAgentsByOrganization(organizationId),
    enabled: enabled && !!organizationId,
  });

  return (
    <div className="space-y-2">
      {showHeader && (
        <label className="block text-sm font-medium text-neutral-700">
          {t('organizations.agents_count')} ({agents.length})
        </label>
      )}
      {isLoading ? (
        <div className="p-4 bg-neutral-50 rounded-lg animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      ) : agents.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900 truncate">
                    {agent.name}
                  </div>
                  {agent.description && (
                    <div className="text-xs text-neutral-500 truncate">
                      {agent.description}
                    </div>
                  )}
                </div>
                <div className="text-xs text-neutral-400">{agent.status}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-500 text-center">
          {t('organizations.no_agents')}
        </div>
      )}
    </div>
  );
}
