/**
 * Mojeeb Minimal Agents Page
 * Clean agents list with search and vertical cards
 * NO animations, NO glass effects - just professional simplicity
 *
 * NOTE: This page reads agents from Zustand store - DashboardLayout handles fetching
 */

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAgentStore } from '../stores/agentStore';
import AgentCard from '../components/AgentCard';
import AgentFormModal from '../components/AgentFormModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AgentsPage() {
  // Read agents from store - DashboardLayout handles fetching and syncing
  const agents = useAgentStore((state) => state.agents);
  const isLoading = useAgentStore((state) => state.isLoading);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Show loading state
  if (isLoading || !agents) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Clean & Minimal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-950">AI Agents</h1>
          <p className="text-neutral-600 mt-1">
            Manage your intelligent AI assistants
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Agents List - Vertical Cards */}
      {agents && agents.length > 0 ? (
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-12 h-12 text-neutral-400" />}
          title="No agents yet"
          description="Create your first AI agent to get started"
          action={
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          }
        />
      )}

      {/* Create Agent Modal */}
      <AgentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
}
