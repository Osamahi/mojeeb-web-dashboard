/**
 * Mojeeb Global Agent Selector Component
 * Modal-based selector for switching between agents globally
 * Displays in top navigation bar and persists selection to localStorage
 */

import { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../stores/agentStore';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export default function GlobalAgentSelector() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    agents,
    globalSelectedAgent,
    isAgentSwitching,
    switchAgent
  } = useAgentStore();

  const handleAgentSelect = async (agentId: string) => {
    setIsModalOpen(false);
    if (globalSelectedAgent?.id === agentId) return;

    // No callback needed - React Query will auto-refetch queries with agentId in keys
    await switchAgent(agentId);
  };

  const handleCreateAgent = () => {
    setIsModalOpen(false);
    navigate('/onboarding');
  };

  // Show loading spinner during agent switching
  if (isAgentSwitching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-50">
        <Spinner size="sm" />
        <span className="text-sm text-neutral-600">Switching...</span>
      </div>
    );
  }

  // Show empty state if no agents exist
  if (agents.length === 0) {
    return (
      <button
        onClick={handleCreateAgent}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-50 transition-colors"
      >
        <Plus className="w-4 h-4 text-brand-cyan" />
        <span className="text-sm font-medium text-brand-cyan">Create Agent</span>
      </button>
    );
  }

  // Show agent selector
  return (
    <>
      {/* Trigger Button - Minimal Style */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors max-w-[180px] hover:bg-neutral-50"
        title={globalSelectedAgent?.name}
      >
        {globalSelectedAgent ? (
          <>
            <span className="text-sm font-medium text-neutral-950 truncate">
              {globalSelectedAgent.name}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />
          </>
        ) : (
          <>
            <span className="text-sm text-neutral-500">Select an agent</span>
            <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />
          </>
        )}
      </button>

      {/* Agent Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Agent"
        size="sm"
      >
        <div className="flex flex-col">
          {/* Agent List - Scrollable */}
          <div className="max-h-[400px] overflow-y-auto space-y-1 mb-3">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors',
                  globalSelectedAgent?.id === agent.id && 'bg-brand-cyan text-white hover:bg-brand-cyan'
                )}
              >
                <span className={cn(
                  'text-sm font-medium truncate',
                  globalSelectedAgent?.id === agent.id ? 'text-white' : 'text-neutral-950'
                )}>
                  {agent.name}
                </span>
                {globalSelectedAgent?.id === agent.id && (
                  <Check className="w-4 h-4 text-white flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 mb-3" />

          {/* Create New Agent Button */}
          <button
            onClick={handleCreateAgent}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-cyan" />
            <span className="text-sm font-medium text-brand-cyan">Create New Agent</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
