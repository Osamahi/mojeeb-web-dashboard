/**
 * Mojeeb Minimal Agent Card Component
 * Clean, professional agent card with Mojeeb brand colors
 * NO animations, NO gradients - just clean borders and minimal hover states
 */

import { Link } from 'react-router-dom';
import { Edit2, Trash2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import type { Agent, AgentStatus } from '../types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const statusVariants: Record<AgentStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    draft: 'warning',
    active: 'success',
    deleted: 'danger',
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return 'No date';
    }

    // Check for default .NET DateTime ("0001-01-01")
    if (dateString.startsWith('0001-01-01')) {
      return 'No date';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement delete confirmation modal
    console.log('Delete agent:', agent.id);
  };

  return (
    <Link to={`/agents/${agent.id}`} className="block">
      <div className="bg-white rounded-lg border border-neutral-200 p-4 transition-colors duration-200 hover:border-neutral-300">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar
            src={agent.avatarUrl}
            name={agent.name}
            size="md"
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
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Badge variant={statusVariants[agent.status]} className="text-xs">
                {agent.status}
              </Badge>
              <span>Created: {formatDate(agent.createdAt)}</span>
              <span>•</span>
              <span>Updated: {formatDate(agent.updatedAt)}</span>
            </div>
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
      </div>
    </Link>
  );
}
