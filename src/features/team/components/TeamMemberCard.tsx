/**
 * TeamMemberCard Component
 * Mobile-friendly card view for individual team member
 * Clean vertical layout following minimal design system
 */

import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { TeamMember, TeamRole } from '../types';

interface TeamMemberCardProps {
  member: TeamMember;
}

const ROLE_COLORS: Record<TeamRole, 'success' | 'warning' | 'danger'> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  HumanAgent: 'success',
};

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      {/* Header: Avatar + Name + Online Status */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar
          src={member.avatar_url || undefined}
          name={member.name || 'Team Member'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate mb-1">
            {member.name || 'Team Member'}
          </h3>
          {member.is_online && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <Badge variant={ROLE_COLORS[member.role]}>
          {member.role === 'HumanAgent' ? 'Agent' : member.role}
        </Badge>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        {member.email && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${member.phone}`}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {member.phone}
            </a>
          </div>
        )}
      </div>

      {/* Footer: Joined Date */}
      <div className="pt-3 border-t border-neutral-100">
        <div className="text-xs text-neutral-500">
          Joined {member.created_at ? format(new Date(member.created_at), 'MMM dd, yyyy') : '-'}
        </div>
      </div>
    </div>
  );
}
