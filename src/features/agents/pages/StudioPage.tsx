/**
 * Mojeeb Agent Studio Page
 * Edit agent prompts, manage knowledge bases, and test chat
 * Split-panel layout with minimal design
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { agentService } from '../services/agentService';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useIsMobile } from '@/hooks/useMediaQuery';
import NoAgentEmptyState from '../components/NoAgentEmptyState';
import PromptEditor from '../components/PromptEditor';
import KnowledgeBaseEditor from '../components/KnowledgeBaseEditor';
import { logger } from '@/lib/logger';

export default function StudioPage() {
  const isMobile = useIsMobile();
  const { agent: globalSelectedAgent, agentId } = useAgentContext();

  // Fetch agent data - automatically refetches when agentId changes
  const {
    data: agent,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: () => agentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  // Fetch knowledge bases for this agent - automatically refetches when agentId changes
  const {
    data: knowledgeBases,
    isLoading: isLoadingKBs,
    refetch: refetchKBs,
  } = useQuery({
    queryKey: queryKeys.knowledgeBases(agentId),
    queryFn: () => agentService.getKnowledgeBases(agentId!),
    enabled: !!agentId,
  });

  // Log errors
  useEffect(() => {
    if (error) {
      logger.error('Error loading agent', error);
    }
  }, [error]);

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title="No Agent Selected"
          message="Please select an agent from the dropdown above to open its studio."
          showCreateButton={false}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="p-6">
        <EmptyState
          title="Agent Not Found"
          description="The agent you're looking for doesn't exist or you don't have access to it."
          action={
            <Link to="/agents">
              <Button variant="primary">Back to Agents</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Mobile layout (stacked)
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Content - Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt Editor */}
          <PromptEditor agent={agent} />

          {/* Knowledge Bases */}
          <KnowledgeBaseEditor
            agentId={agent.id}
            knowledgeBases={knowledgeBases || []}
            isLoading={isLoadingKBs}
            onRefetch={() => refetchKBs()}
          />
        </div>
      </div>
    );
  }

  // Desktop layout (split-panel)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Split-panel content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Configuration */}
          <Panel defaultSize={40} minSize={30} maxSize={60}>
            <div className="h-full overflow-y-auto bg-neutral-50 p-6 space-y-6">
              {/* Prompt Editor */}
              <PromptEditor agent={agent} />

              {/* Knowledge Bases */}
              <KnowledgeBaseEditor
                agentId={agent.id}
                knowledgeBases={knowledgeBases || []}
                isLoading={isLoadingKBs}
                onRefetch={() => refetchKBs()}
              />
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-px bg-neutral-200 hover:bg-brand-cyan transition-colors" />

          {/* Right Panel: Test Chat */}
          <Panel defaultSize={60}>
            <div className="h-full bg-white flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-neutral-950 mb-2">
                  Test Chat
                </h2>
                <p className="text-neutral-600 text-sm">
                  Test chat functionality will be available here once the
                  backend endpoint is ready.
                </p>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
