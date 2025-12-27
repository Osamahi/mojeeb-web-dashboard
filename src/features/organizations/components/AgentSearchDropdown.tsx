/**
 * Agent Search Dropdown Component
 * Allows searching and selecting an agent
 * Used in team management for assigning users to organizations
 */

import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { Input } from '@/components/ui/Input';
import type { Agent } from '@/features/agents/types/agent.types';

interface AgentSearchDropdownProps {
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  placeholder?: string;
}

export default function AgentSearchDropdown({
  selectedAgent,
  onAgentSelect,
  placeholder
}: AgentSearchDropdownProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { agents, isLoading } = useAgentStore();
  const placeholderText = placeholder || t('agent_search_dropdown.placeholder');

  // Filter agents by search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;

    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.id.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect(agent);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleBlur}
          placeholder={placeholderText}
          className="pl-10"
        />
        {selectedAgent && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
        )}
      </div>

      {/* Agent Dropdown */}
      {showDropdown && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              {t('agent_search_dropdown.loading')}
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="py-2">
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleAgentSelect(agent)}
                  className="w-full px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {agent.name}
                    </div>
                    <div className="text-xs text-neutral-400 truncate font-mono">
                      {agent.id}
                    </div>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-500">
              {t('agent_search_dropdown.no_results', { query: searchQuery })}
            </div>
          )}
        </div>
      )}

      {/* Selected Agent Info */}
      {selectedAgent && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-medium text-neutral-900 text-sm">
                {selectedAgent.name}
              </div>
              <div className="text-xs text-neutral-500 font-mono truncate">
                {selectedAgent.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
