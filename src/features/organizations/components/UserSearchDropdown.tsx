/**
 * User Search Dropdown Component
 * Allows searching and selecting a user
 * Shows current organization for validation
 * PATTERN: Follows EditOrganizationModal approach - fetch all users, filter client-side
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { userService } from '@/features/users/services/userService';
import { organizationService } from '../services/organizationService';
import { Input } from '@/components/ui/Input';
import type { UserSearchResult } from '../types';
import type { User } from '@/features/users/types';

interface UserSearchDropdownProps {
  selectedUser: UserSearchResult | null;
  onUserSelect: (user: UserSearchResult) => void;
  placeholder?: string;
  excludeOrganizationId?: string; // Highlight users from different orgs
}

export default function UserSearchDropdown({
  selectedUser,
  onUserSelect,
  placeholder = 'Search by email...',
  excludeOrganizationId
}: UserSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all users upfront (following EditOrganizationModal pattern)
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Client-side filtering with organization enrichment
  const searchResults = useMemo<UserSearchResult[]>(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return allUsers
      .filter((user: User) => {
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesName = user.name?.toLowerCase().includes(query);
        return matchesEmail || matchesName;
      })
      .slice(0, 20) // Limit to 20 results
      .map((user: User) => ({
        id: user.id,
        email: user.email || '',
        name: user.name,
        currentOrganization: null, // Will be enriched on demand if needed
      }));
  }, [allUsers, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleUserSelect = (user: UserSearchResult) => {
    onUserSelect(user);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10"
        />
        {selectedUser && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
        )}
      </div>

      {/* User Dropdown */}
      {showDropdown && searchQuery.length >= 2 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => {
                const hasOtherOrg = user.currentOrganization && user.currentOrganization.id !== excludeOrganizationId;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 hover:bg-neutral-50 transition-colors flex items-start gap-3 text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <UserIcon className="h-4 w-4 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-sm text-neutral-500 truncate">
                        {user.email}
                      </div>
                      {hasOtherOrg && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-xs text-amber-600 truncate">
                            Currently in: {user.currentOrganization.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-500">
              {searchQuery.length < 2
                ? 'Type at least 2 characters to search'
                : `No users found matching "${searchQuery}"`
              }
            </div>
          )}
        </div>
      )}

      {/* Selected User Info */}
      {selectedUser && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-900">
                {selectedUser.name || selectedUser.email}
              </div>
              <div className="text-sm text-neutral-500">{selectedUser.email}</div>
              {selectedUser.currentOrganization && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-600">
                    Currently in: {selectedUser.currentOrganization.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
