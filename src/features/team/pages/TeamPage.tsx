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
import { useAgentStore } from '@/features/agents/stores/agentStore';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';

export default function TeamPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);

  const {
    data: teamMembers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team-members', globalSelectedAgent?.id],
    queryFn: () => teamService.getTeamMembers(globalSelectedAgent!.id),
    enabled: !!globalSelectedAgent?.id,
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Team</h1>
          <p className="text-neutral-600 mt-1">
            Manage team members for {globalSelectedAgent.name}
          </p>
        </div>

        <Button
          onClick={() => setIsInviteModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </motion.div>

      {/* Team Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-white border border-neutral-200 rounded-lg">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-neutral-600">Loading team members...</p>
            </div>
          </div>
        ) : error ? (
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
        ) : teamMembers ? (
          <TeamTable members={teamMembers} />
        ) : null}
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
