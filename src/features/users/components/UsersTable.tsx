/**
 * Users Table Component
 * Displays system users with search, role filtering, sorting, and pagination
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import type { User, Role } from '../types';

interface UsersTableProps {
  users: User[];
}

const ROLES: (Role | 'All')[] = ['All', 'SuperAdmin', 'Admin', 'Customer', 'AiAgent', 'HumanAgent', 'System'];

const ROLE_COLORS: Record<Role, 'success' | 'warning' | 'danger' | any> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  Customer: 'success',
  AiAgent: 'default',
  HumanAgent: 'default',
  System: 'default',
};

export default function UsersTable({ users }: UsersTableProps) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');

  // Apply filters to data
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (roleFilter !== 'All') {
      result = result.filter((user) => user.role === roleFilter);
    }

    return result;
  }, [users, searchQuery, roleFilter]);

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      key: 'name',
      label: 'User',
      sortable: false,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar
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
      render: (created_at) => (
        <div className="text-sm text-neutral-600">
          {created_at
            ? format(new Date(created_at as string), 'MMM dd, yyyy')
            : '-'}
        </div>
      ),
    },
  ], []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleFilterChange = (role: Role | 'All') => {
    setRoleFilter(role);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value as Role | 'All')}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role === 'All' ? 'All Roles' : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        rowKey="id"
        initialSortField="created_at"
        initialSortDirection="desc"
        itemName="users"
        emptyState={{
          icon: <Search className="w-12 h-12 text-neutral-400" />,
          title: 'No users found',
          description: 'Try adjusting your search or filter criteria',
        }}
      />
    </div>
  );
}
