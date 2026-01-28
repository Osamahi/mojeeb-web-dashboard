import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, Search, X } from 'lucide-react';
import { userService } from '../services/userService';
import { organizationService } from '@/features/organizations/services/organizationService';
import type { User } from '../types';
import UsersTable from '../components/UsersTable';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function UsersPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_users');

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch all users (when no search)
  const {
    data: allUsers,
    isLoading: isLoadingAllUsers,
    error: allUsersError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: !debouncedQuery || debouncedQuery.length < 2,
  });

  // Fetch search results (when searching)
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => organizationService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Transform search results to User type format
  const transformedSearchResults = useMemo((): User[] | undefined => {
    if (!searchResults) return undefined;
    return searchResults.map(result => ({
      id: result.id,
      email: result.email,
      name: result.name,
      phone: null,
      avatar_url: null,
      role: 'Customer' as const, // Search doesn't return role, default to Customer
      role_value: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      o_auth_provider: null,
    }));
  }, [searchResults]);

  // Determine which data to display
  const isSearchMode = debouncedQuery.length >= 2;
  const displayUsers = isSearchMode ? transformedSearchResults : allUsers;
  const isLoading = isSearchMode ? isSearching : isLoadingAllUsers;
  const error = isSearchMode ? searchError : allUsersError;

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedQuery('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      />

      {/* Loading State */}
      {isLoading && !isSearchMode ? (
        <div className="flex items-center justify-center min-h-[400px] bg-white border border-neutral-200 rounded-lg">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-neutral-600">{t('users.loading')}</p>
          </div>
        </div>
      ) : error && !isSearchMode ? (
        <EmptyState
          icon={<UsersIcon className="w-12 h-12 text-neutral-400" />}
          title={t('users.error_title')}
          description={
            error instanceof Error
              ? error.message
              : t('users.error_description')
          }
        />
      ) : (displayUsers && displayUsers.length > 0) || isSearchMode ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder={t('users.search_placeholder') || 'Search by email...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 ps-10 pe-10 py-2.5 text-sm
                       placeholder:text-neutral-400 focus:outline-none focus:ring-2
                       focus:ring-brand-cyan/20 focus:border-brand-cyan
                       disabled:bg-neutral-50 disabled:text-neutral-500"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                         transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && searchInput && (
              <div className="absolute end-10 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* Results Count */}
          {isSearchMode && displayUsers && (
            <div className="text-sm text-neutral-600">
              {t('users.search_results_count', { count: displayUsers.length })}
            </div>
          )}

          {/* Table or Empty State */}
          {displayUsers && displayUsers.length > 0 ? (
            <UsersTable users={displayUsers} />
          ) : isSearchMode ? (
            <EmptyState
              icon={<Search className="w-12 h-12 text-neutral-400" />}
              title={t('users.no_search_results_title')}
              description={t('users.no_search_results_description', { query: debouncedQuery })}
            />
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<UsersIcon className="w-12 h-12 text-neutral-400" />}
          title={t('users.no_users_title')}
          description={t('users.no_users_description')}
        />
      )}
    </div>
  );
}
