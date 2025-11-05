/**
 * Team Table Component
 * Displays team members with search, filter, and sort functionality
 */

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TeamMember, TeamRole } from '../types';
import { cn } from '@/lib/utils';

interface TeamTableProps {
  members: TeamMember[];
}

type SortField = 'name' | 'email' | 'role' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ROLE_COLORS: Record<TeamRole, 'success' | 'warning' | 'danger'> = {
  SuperAdmin: 'danger',
  Admin: 'warning',
  HumanAgent: 'success',
};

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function TeamTable({ members }: TeamTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number | null = a[sortField];
      let bValue: string | number | null = b[sortField];

      // Handle nulls and undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (sortField === 'created_at') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();

        // Handle invalid dates
        if (isNaN(aDate)) return 1;
        if (isNaN(bDate)) return -1;

        aValue = aDate;
        bValue = bDate;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [members, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMembers.length / rowsPerPage);
  const paginatedMembers = filteredAndSortedMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-neutral-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-neutral-700" />
    ) : (
      <ChevronDown className="w-4 h-4 text-neutral-700" />
    );
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  if (filteredAndSortedMembers.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-12 h-12 text-neutral-400" />}
        title="No team members yet"
        description="Invite team members to collaborate on conversations"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Team Member
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-2">
                    Role
                    {getSortIcon('role')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Joined
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{member.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={ROLE_COLORS[member.role]} size="sm">
                        {member.role === 'HumanAgent' ? 'Agent' : member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {member.created_at
                          ? format(new Date(member.created_at), 'MMM dd, yyyy')
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-neutral-600" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAndSortedMembers.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="ml-4">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredAndSortedMembers.length)} of{' '}
                {filteredAndSortedMembers.length} members
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'px-3 py-1 rounded border transition-colors',
                  currentPage === 1
                    ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                )}
              >
                Previous
              </button>
              <span className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'px-3 py-1 rounded border transition-colors',
                  currentPage === totalPages
                    ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
