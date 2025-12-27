/**
 * Mojeeb Minimal Agent Card Component
 * Clean, professional agent card with Mojeeb brand colors
 * NO animations, NO gradients - just clean borders and minimal hover states
 */

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Crown, Wrench, Building2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import type { Agent } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/hooks/useConfirm';
import AgentFormModal from './AgentFormModal';
import ReassignOrganizationModal from './ReassignOrganizationModal';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard = memo(function AgentCard({ agent }: AgentCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Check if user is SuperAdmin
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;

  const deleteMutation = useMutation({
    mutationFn: () => agentService.deleteAgent(agent.id),
    onSuccess: () => {
      toast.success(t('agents.deleted_success', { name: agent.name }));
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || t('agents.delete_failed'));
      } else {
        toast.error(t('agents.delete_failed'));
      }
    },
  });

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return t('common.no_date');
    }

    // Check for default .NET DateTime ("0001-01-01")
    if (dateString.startsWith('0001-01-01')) {
      return t('common.no_date');
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('common.invalid_date');
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return t('common.invalid_date');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteMutation.isPending) return;

    const confirmed = await confirm({
      title: t('agents.delete_confirm_title'),
      message: t('agents.delete_confirm_message', { name: agent.name }),
      confirmText: t('common.delete'),
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
    setIsEditModalOpen(true);
  };

  const handleReassignOrgClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReassignModalOpen(true);
  };

  return (
    <>
      {ConfirmDialogComponent}
      <AgentFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        agent={agent}
      />
      {isSuperAdmin && (
        <ReassignOrganizationModal
          isOpen={isReassignModalOpen}
          onClose={() => setIsReassignModalOpen(false)}
          agent={agent}
        />
      )}
      <div
        onClick={() => setIsEditModalOpen(true)}
        className="bg-white rounded-lg border border-neutral-200 p-3 sm:p-4 transition-colors duration-200 hover:border-neutral-300 cursor-pointer"
      >
          {/* Header - Responsive Layout */}
          <div className="flex gap-3">
            {/* Content Area - Full width */}
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-950 text-sm sm:text-base truncate">
                    {agent.name}
                  </h3>
                  {agent.isOwner && (
                    <span title={t('agents.owner_title')}>
                      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
                    </span>
                  )}
                </div>

                {/* Action Buttons - Wrench and Delete only */}
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <button
                    onClick={handleStudioClick}
                    className="p-1.5 sm:p-2 hover:bg-neutral-100 rounded-md transition-colors"
                    title={t('agents.open_studio_title')}
                  >
                    <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600" />
                  </button>
                  {agent.canDelete && (
                    <button
                      onClick={handleDelete}
                      className="p-1.5 sm:p-2 hover:bg-neutral-100 rounded-md transition-colors disabled:opacity-50"
                      title={t('agents.delete_agent_title')}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 ${deleteMutation.isPending ? 'animate-pulse' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata - Stacked on mobile, inline on desktop */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-neutral-500 flex-wrap">
                <span className="whitespace-nowrap">Created: {formatDate(agent.createdAt)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">Updated: {formatDate(agent.updatedAt)}</span>
              </div>

              {/* Organization Display - SuperAdmin only */}
              {isSuperAdmin && agent.organizationName && (
                <button
                  onClick={handleReassignOrgClick}
                  className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5 hover:text-neutral-700 transition-colors group"
                  title={t('agents.reassign_tooltip')}
                >
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{agent.organizationName}</span>
                  <Pencil className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                </button>
              )}
            </div>
          </div>
      </div>
    </>
  );
});

export default AgentCard;
