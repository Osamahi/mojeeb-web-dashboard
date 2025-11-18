/**
 * Main Instruction Card Component
 * Matches KnowledgeBaseItem UI exactly
 * Contains agent prompt - NOT deletable (only editable)
 */

import { useState } from 'react';
import { Edit2, FileText, Trash2 } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { Button } from '@/components/ui/Button';
import PromptEditor from './PromptEditor';
import { cn } from '@/lib/utils';

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
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-950 mb-1">
              Main Instruction
            </h3>
            {!isExpanded && (
              <p className="text-sm text-neutral-600 line-clamp-2">
                {contentPreview}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Edit + Disabled Delete for visual consistency */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            {isExpanded ? 'Close' : 'Edit'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled
            className="opacity-30 cursor-not-allowed"
            title="Main Instruction cannot be deleted"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <PromptEditor agent={agent} />
        </div>
      )}

      {/* Metadata - Matches KnowledgeBaseItem */}
      {!isExpanded && (
        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-4 pt-4 border-t border-neutral-100">
          <span>Agent Persona</span>
          <span>•</span>
          <span>
            {agent.personaPrompt
              ? `${agent.personaPrompt.length.toLocaleString()} characters`
              : 'Not configured'}
          </span>
          <span>•</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-700">
            Undeletable
          </span>
        </div>
      )}
    </div>
  );
}
