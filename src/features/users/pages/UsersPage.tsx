import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, Search, X } from 'lucide-react';
import UsersTable from '../components/UsersTable';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useInfiniteUsers } from '../hooks/useUsers';

export default function UsersPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_users');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server-side search kicks in at >= 2 chars; otherwise list all.
  const searchTerm = debouncedQuery.length >= 2 ? debouncedQuery : undefined;
  const isSearchMode = !!searchTerm;

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteUsers({ searchTerm });

  const users = data?.users ?? [];

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedQuery('');
  };

  // Initial load (no cached data yet).
  const showFullPageLoader = isLoading && users.length === 0 && !isSearchMode;

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      />

      {showFullPageLoader ? (
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
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder={t('users.search_placeholder') || 'Search by name, email, phone, or agent…'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 ps-10 pe-10 py-2.5 text-sm
                       placeholder:text-neutral-400 focus:outline-none focus:ring-2
                       focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb
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
            {isSearchMode && isFetching && !isFetchingNextPage && (
              <div className="absolute end-10 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* Results Count (search mode only) */}
          {isSearchMode && !isLoading && (
            <div className="text-sm text-neutral-600">
              {t('users.search_results_count', { count: users.length })}
            </div>
          )}

          {/* Table / loader / empty state */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-neutral-600">
                  {isSearchMode ? t('users.searching') : t('users.loading')}
                </p>
              </div>
            </div>
          ) : users.length > 0 ? (
            <UsersTable
              users={users}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          ) : isSearchMode ? (
            <EmptyState
              icon={<Search className="w-12 h-12 text-neutral-400" />}
              title={t('users.no_search_results_title')}
              description={t('users.no_search_results_description', { query: debouncedQuery })}
            />
          ) : (
            <EmptyState
              icon={<UsersIcon className="w-12 h-12 text-neutral-400" />}
              title={t('users.no_users_title')}
              description={t('users.no_users_description')}
            />
          )}
        </div>
      )}
    </div>
  );
}
