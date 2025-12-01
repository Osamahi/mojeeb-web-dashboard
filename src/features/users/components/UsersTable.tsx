/**
 * Users Table Component
 * Displays system users with sorting and pagination
 */

import { useMemo } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import type { User, Role } from '../types';

interface UsersTableProps {
  users: User[];
}

const ROLE_COLORS: Record<Role, 'success' | 'warning' | 'danger' | any> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  Customer: 'success',
  AiAgent: 'default',
  HumanAgent: 'default',
  System: 'default',
};

export default function UsersTable({ users }: UsersTableProps) {

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      key: 'name',
      label: 'User',
      sortable: false,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatar_url || undefined}
            name={user.name || 'Anonymous User'}
            size="md"
          />
          <div>
            <div className="font-medium text-neutral-900">
              {user.name || 'Anonymous User'}
            </div>
            {user.o_auth_provider && (
              <div className="text-xs text-neutral-500">
                OAuth: {user.o_auth_provider}
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
      label: 'Phone Number',
      sortable: false,
      render: (phone) => (
        <div className="text-sm text-neutral-900">{phone || '-'}</div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role) => (
        <Badge variant={ROLE_COLORS[role as Role]} size="sm">
          {role}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (created_at) => {
        if (!created_at) return <div className="text-sm text-neutral-600">-</div>;

        // Backend returns UTC time without 'Z', so we append it to ensure proper parsing
        const dateString = (created_at as string).endsWith('Z')
          ? created_at as string
          : `${created_at}Z`;

        return (
          <div className="text-sm text-neutral-600">
            {format(new Date(dateString), 'MMM dd, yyyy h:mm a')}
          </div>
        );
      },
    },
  ], []);

  return (
    <DataTable
      data={users}
      columns={columns}
      rowKey="id"
      initialSortField="created_at"
      initialSortDirection="desc"
      itemName="users"
      emptyState={{
        icon: <UsersIcon className="w-12 h-12 text-neutral-400" />,
        title: 'No users found',
        description: 'No users available in the system',
      }}
    />
  );
}
