/**
 * TeamMobileCardView Component
 * Mobile card-based view for team members list
 * Includes simple list rendering with loading states
 */

import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { TeamMemberCard } from './TeamMemberCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TeamMember } from '../types';

interface TeamMobileCardViewProps {
  members: TeamMember[];
}

export function TeamMobileCardView({ members }: TeamMobileCardViewProps) {
  // Empty state
  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="No team members"
          description="Invite team members to collaborate"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <TeamMemberCard member={member} />
        </motion.div>
      ))}
    </div>
  );
}
