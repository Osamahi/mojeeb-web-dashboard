/**
 * Main Instructions Card Component
 * GitHub-style accordion matching KnowledgeBaseItem
 * Contains agent prompt - NOT deletable (only editable)
 */

import { useState } from 'react';
import { ChevronRight, Edit2, Lock } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import PromptEditor from './PromptEditor';
import { cn } from '@/lib/utils';

interface MainInstructionCardProps {
  agent: Agent;
}

export default function MainInstructionCard({ agent }: MainInstructionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
      {/* Accordion Header - GitHub Style */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
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

        {/* Hover Actions - GitHub Style */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-600 hover:text-neutral-950"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1.5 rounded text-neutral-400 cursor-not-allowed"
            title="Main Instructions cannot be deleted"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-neutral-100">
          <div className="pt-4">
            <PromptEditor agent={agent} />
          </div>
        </div>
      )}
    </div>
  );
}
