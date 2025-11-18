/**
 * Mojeeb Agent Studio Page
 * 2/3 + 1/3 split layout with sticky test chat
 * Left: Main Instruction + Knowledge sections
 * Right: Embedded test chat
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { agentService } from '../services/agentService';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditableTitle } from '@/components/ui/EditableTitle';
import NoAgentEmptyState from '../components/NoAgentEmptyState';
import MainInstructionCard from '../components/MainInstructionCard';
import KnowledgeBaseItem from '../components/KnowledgeBaseItem';
import AddKnowledgeBaseModal from '../components/AddKnowledgeBaseModal';
import TestChat from '../components/TestChat';
import { logger } from '@/lib/logger';

export default function StudioPage() {
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const [isAddKBModalOpen, setIsAddKBModalOpen] = useState(false);

  // Fetch agent data
  const {
    data: agent,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: () => agentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  // Fetch knowledge bases
  const {
    data: knowledgeBases,
    isLoading: isLoadingKBs,
    refetch: refetchKBs,
  } = useQuery({
    queryKey: queryKeys.knowledgeBases(agentId),
    queryFn: () => agentService.getKnowledgeBases(agentId!),
    enabled: !!agentId,
  });

  // Update agent name mutation
  const updateAgentNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      return agentService.updateAgent(agentId!, { name: newName });
    },
    onSuccess: (updatedAgent) => {
      queryClient.setQueryData(queryKeys.agent(agentId), updatedAgent);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      toast.success('Agent name updated');
    },
    onError: (error) => {
      logger.error('Error updating agent name', error);
      toast.error('Failed to update agent name');
      throw error; // Re-throw to let EditableTitle handle it
    },
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

  return (
    <>
      {/* 2/3 + 1/3 Split Layout */}
      <div className="h-full grid grid-cols-[2fr_1fr] bg-neutral-50">
        {/* Left Column - 2/3 Width - Knowledge Sections */}
        <div className="flex flex-col overflow-hidden border-r border-neutral-200">
          {/* Header Section - Matches other pages */}
          <div className="px-6 py-6">
            <div className="flex items-start justify-between">
              <div>
                <EditableTitle
                  value={agent.name}
                  suffix=" Knowledge"
                  onSave={(newName) => updateAgentNameMutation.mutateAsync(newName)}
                  className="text-2xl font-semibold text-neutral-950"
                />
                <p className="text-sm text-neutral-600 mt-1">
                  Configure your agent's instructions and knowledge base
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAddKBModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Knowledge
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-4">
              {/* Main Instruction Card - Matches KB card UI, but undeletable */}
              <MainInstructionCard agent={agent} />

              {/* Knowledge Base Cards */}
              {isLoadingKBs ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : knowledgeBases && knowledgeBases.length > 0 ? (
                <>
                  {knowledgeBases.map((kb) => (
                    <KnowledgeBaseItem
                      key={kb.id}
                      knowledgeBase={kb}
                      onUpdate={() => refetchKBs()}
                    />
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-sm text-neutral-600">
                  No knowledge bases yet. Click "Add Knowledge" above to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 Width - Sticky Test Chat */}
        <div className="flex flex-col bg-white overflow-hidden">
          <TestChat agentId={agent.id} />
        </div>
      </div>

      {/* Add Knowledge Base Modal */}
      <AddKnowledgeBaseModal
        isOpen={isAddKBModalOpen}
        onClose={() => setIsAddKBModalOpen(false)}
        agentId={agent.id}
        onSuccess={() => {
          refetchKBs();
          setIsAddKBModalOpen(false);
        }}
      />
    </>
  );
}
