/**
 * Mojeeb Minimal Agent Card Component
 * Clean, professional agent card with Mojeeb brand colors
 * NO animations, NO gradients - just clean borders and minimal hover states
 */

import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Crown, Sliders } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import type { Agent, AgentStatus } from '../types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/hooks/useConfirm';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard = memo(function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: () => agentService.deleteAgent(agent.id),
    onSuccess: () => {
      toast.success(`Agent "${agent.name}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to delete agent');
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteMutation.isPending) return;

    const confirmed = await confirm({
      title: 'Delete Agent',
      message: `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  const handleStudioClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/studio');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/agents/${agent.id}/edit`);
  };

  return (
    <>
      {ConfirmDialogComponent}
      <Link to={`/agents/${agent.id}`} className="block">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 transition-colors duration-200 hover:border-neutral-300">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar
              src={agent.avatarUrl ?? undefined}
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
              <button
                onClick={handleStudioClick}
                className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
                title="Open Studio"
              >
                <Sliders className="w-4 h-4 text-neutral-600" />
              </button>
              {agent.canEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
                  title="Edit agent"
                >
                  <Edit2 className="w-4 h-4 text-neutral-600" />
                </button>
              )}
              {agent.canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-error/10 rounded-md transition-colors disabled:opacity-50"
                  title="Delete agent"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className={`w-4 h-4 text-error ${deleteMutation.isPending ? 'animate-pulse' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
});

export default AgentCard;
