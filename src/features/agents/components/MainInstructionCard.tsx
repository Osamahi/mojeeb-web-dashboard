/**
 * Main Instructions Card Component
 * Matches KnowledgeBaseItem UI exactly
 * Contains agent prompt - NOT deletable (only editable)
 */

import { useState } from 'react';
import { Edit2, Lock } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import PromptEditor from './PromptEditor';

interface MainInstructionCardProps {
  agent: Agent;
}

export default function MainInstructionCard({ agent }: MainInstructionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Content preview
  const contentPreview = agent.personaPrompt
    ? agent.personaPrompt.substring(0, 120) + (agent.personaPrompt.length > 120 ? '...' : '')
    : 'Click Edit to configure your agent\'s main instruction';

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
      {/* Header with Name and Actions - Matches KnowledgeBaseItem exactly */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-950 mb-1">
            Main Instructions
          </h3>
          {!isExpanded && (
            <p className="text-sm text-neutral-500 line-clamp-2">
              {contentPreview}
            </p>
          )}
        </div>

        {/* Action Buttons - Icon Only */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600 hover:text-neutral-950"
            title={isExpanded ? 'Close' : 'Edit'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-2 rounded-lg text-neutral-400 cursor-not-allowed"
            title="Main Instructions cannot be deleted"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <PromptEditor agent={agent} />
        </div>
      )}
    </div>
  );
}
