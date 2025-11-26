/**
 * Mojeeb Global Agent Selector Component
 * Dropdown selector for switching between agents globally
 * Displays in top navigation bar and persists selection to localStorage
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../stores/agentStore';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

export default function GlobalAgentSelector() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    agents,
    globalSelectedAgent,
    isAgentSwitching,
    switchAgent
  } = useAgentStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAgentSelect = async (agentId: string) => {
    setIsOpen(false);
    if (globalSelectedAgent?.id === agentId) return;

    // No callback needed - React Query will auto-refetch queries with agentId in keys
    await switchAgent(agentId);
  };

  const handleCreateAgent = () => {
    setIsOpen(false);
    navigate('/agents/new');
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

  // Show agent selector dropdown
  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button - Minimal Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
          isOpen ? 'bg-neutral-100' : 'hover:bg-neutral-50'
        )}
      >
        {globalSelectedAgent ? (
          <>
            <span className="text-sm font-medium text-neutral-950">
              {globalSelectedAgent.name}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-neutral-600 transition-transform flex-shrink-0',
                isOpen && 'rotate-180'
              )}
            />
          </>
        ) : (
          <>
            <span className="text-sm text-neutral-500">Select an agent</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-neutral-600 transition-transform flex-shrink-0',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[90vw] max-w-xs md:w-64 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {/* Agent List */}
          <div className="py-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-colors',
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
          <div className="border-t border-neutral-200" />

          {/* Create New Agent Button */}
          <button
            onClick={handleCreateAgent}
            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-cyan" />
            <span className="text-sm font-medium text-brand-cyan">Create New Agent</span>
          </button>
        </div>
      )}
    </div>
  );
}
