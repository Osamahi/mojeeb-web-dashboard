/**
 * Team Page
 * Manage team members (agents and admins)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users as UsersIcon, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { teamService } from '../services/teamService';
import TeamTable from '../components/TeamTable';
import InviteTeamMemberModal from '../components/InviteTeamMemberModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';

export default function TeamPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { agent: globalSelectedAgent, agentId } = useAgentContext();

  // Fetch team members - automatically refetches when agentId changes
  const {
    data: teamMembers,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.teamMembers(agentId),
    queryFn: () => teamService.getTeamMembers(agentId!),
    enabled: !!agentId,
  });

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title="No Agent Selected"
          message="Please select an agent from the dropdown above to manage its team members."
          showCreateButton={false}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-neutral-900">Team</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage your team
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
            title="Invite Member"
          >
            <UserPlus className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-medium text-neutral-900">Invite</span>
          </button>
        </div>
      </div>

      {/* Team Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {error ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-12">
            <EmptyState
              icon={<UsersIcon className="w-12 h-12 text-neutral-400" />}
              title="Error Loading Team"
              description={
                error instanceof Error
                  ? error.message
                  : 'Failed to load team members. Please try again.'
              }
            />
          </div>
        ) : (
          <TeamTable members={teamMembers || []} isLoading={isLoading} />
        )}
      </motion.div>

      {/* Invite Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        agentId={globalSelectedAgent.id}
      />
    </div>
  );
}
