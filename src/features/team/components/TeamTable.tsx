/**
 * Team Table Component
 * Displays team members using the reusable DataTable component
 */

import { useMemo } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import type { TeamMember, TeamRole } from '../types';

interface TeamTableProps {
  members: TeamMember[];
}

const ROLE_COLORS: Record<TeamRole, 'success' | 'warning' | 'danger'> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  HumanAgent: 'success',
};

export default function TeamTable({ members }: TeamTableProps) {
  // Define columns
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
