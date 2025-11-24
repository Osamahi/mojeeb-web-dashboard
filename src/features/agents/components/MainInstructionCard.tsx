/**
 * Main Instructions Card Component
 * GitHub-style accordion matching KnowledgeBaseItem
 * Contains agent prompt - NOT deletable (only editable)
 * Auto-detects selected agent using useAgentContext
 * View/Edit mode pattern matching Knowledge Base cards
 * Expands by default if no knowledge bases exist
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import PromptEditor from './PromptEditor';
import { cn } from '@/lib/utils';
import { plainTextToHtml } from '@/lib/textUtils';

export default function MainInstructionCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get current agent from context
  const { agentId } = useAgentContext();

  // Fetch agent data
  const { data: agent, isLoading } = useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: () => agentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  // Fetch knowledge bases to check if any exist
  const { data: knowledgeBases } = useQuery({
    queryKey: queryKeys.knowledgeBases(agentId),
    queryFn: () => agentService.getKnowledgeBases(agentId!),
    enabled: !!agentId,
  });

  // Expand by default if no knowledge bases exist
  useEffect(() => {
    if (knowledgeBases !== undefined && knowledgeBases.length === 0) {
      setIsExpanded(true);
    }
  }, [knowledgeBases]);

  // Loading skeleton
  if (isLoading || !agent) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
        <div className="flex items-center gap-3 p-4">
          <div className="w-5 h-5 bg-neutral-200 rounded" />
          <div className="flex-1 h-5 bg-neutral-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
      {/* Accordion Header - GitHub Style */}
      <div
        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Chevron indicator */}
        <ChevronRight
          className={cn(
            'w-5 h-5 text-neutral-400 transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-90'
          )}
        />

        {/* Title */}
        <h3 className="flex-1 text-base font-semibold text-neutral-950">
          Main Instructions
        </h3>

        {/* Hover Actions - GitHub Style (visible on hover or when expanded) */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              setIsEditing(true);
            }}
            className="p-2 sm:p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-600 hover:text-neutral-950 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="Edit"
            aria-label="Edit main instructions"
          >
            <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <button
            disabled
            className="p-2 sm:p-1.5 rounded text-neutral-400 cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="Main Instructions cannot be deleted"
            aria-label="Delete disabled"
          >
            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-neutral-100">
          <div className="pt-3 sm:pt-4">
            {isEditing ? (
              <PromptEditor
                agent={agent}
                onSave={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Agent Name Section */}
                <div>
                  <h4 className="text-xs font-normal text-neutral-400 mb-1">
                    Agent Name
                  </h4>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {agent.name || 'Untitled Agent'}
                  </p>
                </div>

                {/* Instructions Section */}
                <div>
                  <h4 className="text-xs font-normal text-neutral-400 mb-1">
                    Instructions
                  </h4>
                  <div
                    className="text-sm text-neutral-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: plainTextToHtml(agent.personaPrompt || '') }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
