/**
 * Mojeeb Minimal Conversations Page
 * Displays conversations filtered by the globally selected agent
 * Clean minimal design with agent-scoped data
 */

import { MessageSquare } from 'lucide-react';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export const ConversationsPage = () => {
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-950 mb-2">Conversations</h1>
          <p className="text-neutral-600">View and manage conversations with your AI agents</p>
        </div>
        <NoAgentEmptyState
          title="No Agent Selected"
          message="Please select an agent from the dropdown above to view its conversations."
          showCreateButton={false}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Selected Agent Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-950 mb-2">Conversations</h1>
        <p className="text-neutral-600 mb-4">
          View and manage conversations with your AI agents
        </p>

        {/* Selected Agent Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 inline-flex items-center gap-3">
          <Avatar
            src={globalSelectedAgent.avatarUrl || undefined}
            name={globalSelectedAgent.name}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-950">
                Showing conversations for:
              </span>
              <span className="text-sm font-medium text-brand-cyan">
                {globalSelectedAgent.name}
              </span>
              <Badge variant="success" className="text-xs">
                {globalSelectedAgent.status}
              </Badge>
            </div>
            {globalSelectedAgent.description && (
              <p className="text-xs text-neutral-600 mt-1">
                {globalSelectedAgent.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder - Ready for React Query integration */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-950 mb-2">
            Conversations Coming Soon
          </h2>
          <p className="text-neutral-600">
            This feature is under development. Conversations for <span className="font-medium text-brand-cyan">{globalSelectedAgent.name}</span> will appear here.
          </p>
          <p className="text-sm text-neutral-500 mt-4">
            💡 Tip: Switch agents using the dropdown in the top navigation to view different agent conversations.
          </p>
        </div>
      </div>
    </div>
  );
};
