/**
 * Team Table Component
 * Responsive view: Desktop table / Mobile cards
 * Switches layout based on screen size
 */

import { useMemo } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { TeamMobileCardView } from './TeamMobileCardView';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { TeamMember, TeamRole } from '../types';

interface TeamTableProps {
  members: TeamMember[];
  isLoading?: boolean;
}

const ROLE_COLORS: Record<TeamRole, 'success' | 'warning' | 'danger'> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  HumanAgent: 'success',
};

export default function TeamTable({ members, isLoading }: TeamTableProps) {
  const isMobile = useIsMobile();

  // Define columns for desktop table view (useMemo must ALWAYS be called on every render)
  const columns = useMemo<ColumnDef<TeamMember>[]>(() => [
    {
      key: 'name',
      label: 'Team Member',
      sortable: false,
      render: (_, member) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={member.avatar_url || undefined}
            name={member.name || 'Team Member'}
            size="md"
          />
          <div>
            <div className="font-medium text-neutral-900">
              {member.name || 'Team Member'}
            </div>
            {member.is_online && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (email) => (
        <div className="text-sm text-neutral-900">{email || '-'}</div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (phone) => (
        <div className="text-sm text-neutral-900">{phone || '-'}</div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role) => (
        <Badge variant={ROLE_COLORS[role as TeamRole]} size="sm">
          {role === 'HumanAgent' ? 'Agent' : role}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (created_at) => (
        <div className="text-sm text-neutral-600">
          {created_at
            ? format(new Date(created_at as string), 'MMM dd, yyyy')
            : '-'}
        </div>
      ),
    },
  ], []);

  // Show skeleton only on initial load
  if (isLoading) {
    return (
      <div>
        {/* Mobile card skeleton (< 768px) */}
        <div className="block md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200 rounded-lg p-4 animate-pulse"
            >
              {/* Header: Avatar + Name + Badge */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-neutral-200 rounded w-16"></div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                <div className="h-3 bg-neutral-200 rounded w-40"></div>
                <div className="h-3 bg-neutral-200 rounded w-32"></div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-neutral-100">
                <div className="h-3 bg-neutral-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table skeleton (≥ 768px) */}
        <div className="hidden md:block bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="animate-pulse">
            {/* Table Header */}
            <div className="border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center px-6 py-3">
                <div className="flex-1 h-4 bg-neutral-200 rounded w-32"></div>
                <div className="flex-1 h-4 bg-neutral-200 rounded w-24 mx-4"></div>
                <div className="flex-1 h-4 bg-neutral-200 rounded w-24 mx-4"></div>
                <div className="flex-1 h-4 bg-neutral-200 rounded w-20 mx-4"></div>
                <div className="flex-1 h-4 bg-neutral-200 rounded w-24"></div>
              </div>
            </div>
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-neutral-200 last:border-b-0">
                <div className="flex items-center px-6 py-4">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                    <div className="h-4 bg-neutral-200 rounded w-32"></div>
                  </div>
                  <div className="flex-1 h-4 bg-neutral-200 rounded w-40 mx-4"></div>
                  <div className="flex-1 h-4 bg-neutral-200 rounded w-32 mx-4"></div>
                  <div className="flex-1 h-6 bg-neutral-200 rounded w-20 mx-4"></div>
                  <div className="flex-1 h-4 bg-neutral-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render mobile card view
  if (isMobile) {
    return <TeamMobileCardView members={members} />;
  }

  // Render desktop table view
  return (
    <DataTable
      data={members}
      columns={columns}
      rowKey="id"
      initialSortField="created_at"
      initialSortDirection="desc"
      itemName="members"
      rowsPerPageOptions={[10, 25, 50, 100]}
      emptyState={{
        icon: <Search className="w-12 h-12 text-neutral-400" />,
        title: 'No team members yet',
        description: 'Invite team members to collaborate on conversations',
      }}
      actionsColumn={(member) => (
        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-neutral-600" />
        </button>
      )}
    />
  );
}
