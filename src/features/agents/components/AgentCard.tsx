/**
 * Mojeeb Minimal Agent Card Component
 * Clean, professional agent card with Mojeeb brand colors
 * NO animations, NO gradients - just clean borders and minimal hover states
 */

import { Link } from 'react-router-dom';
import { Edit2, Trash2, Crown, ArrowRight } from 'lucide-react';
import type { Agent, AgentStatus } from '../types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const statusVariants: Record<AgentStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    draft: 'warning',
    active: 'success',
    deleted: 'danger',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement delete confirmation modal
    console.log('Delete agent:', agent.id);
  };

  return (
    <Link to={`/agents/${agent.id}`} className="block">
      <div className="bg-white rounded-lg border border-neutral-200 p-5 transition-colors duration-200 hover:border-neutral-300">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src={agent.avatarUrl}
            name={agent.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-neutral-950 text-base truncate">
                {agent.name}
              </h3>
              {agent.isOwner && (
                <Crown className="w-4 h-4 text-warning flex-shrink-0" title="Owner" />
              )}
            </div>
            <Badge variant={statusVariants[agent.status]} className="text-xs">
              {agent.status}
            </Badge>
          </div>

          {/* Inline Action Buttons */}
          <div className="flex items-center gap-1">
            {agent.canEdit && (
              <Link
                to={`/agents/${agent.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
                title="Edit agent"
              >
                <Edit2 className="w-4 h-4 text-neutral-600" />
              </Link>
            )}
            {agent.canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-error/10 rounded-md transition-colors"
                title="Delete agent"
              >
                <Trash2 className="w-4 h-4 text-error" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-neutral-600 text-sm line-clamp-2 min-h-[40px] mb-4">
          {agent.description || 'No description provided'}
        </p>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {agent.knowledgeBaseCount !== undefined && (
              <div>
                <span className="font-medium text-neutral-950">
                  {agent.knowledgeBaseCount}
                </span>
                {' '}Knowledge Bases
              </div>
            )}
            {agent.conversationCount !== undefined && (
              <div>
                <span className="font-medium text-neutral-950">
                  {agent.conversationCount}
                </span>
                {' '}Conversations
              </div>
            )}
          </div>

          {/* View Details Link */}
          <div className="flex items-center gap-1 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors">
            <span>View</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
