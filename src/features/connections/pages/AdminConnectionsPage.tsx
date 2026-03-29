import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, TestTube2 } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { AdminConnectionsTable } from '../components/AdminConnectionsTable';
import { ConnectionDetailsModal } from '../components/ConnectionDetailsModal';
import { useInfiniteAdminConnections } from '../hooks/useAdminConnections';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { AdminConnectionListItem, AdminConnectionCursorFilters } from '../services/adminConnectionService';
import type { PlatformType } from '../types/connection.types';

const PLATFORM_OPTIONS: { value: PlatformType; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminConnectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle('pages.title_admin_connections');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Omit<AdminConnectionCursorFilters, 'search'>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<AdminConnectionListItem | null>(null);

  // Combine search with filters
  const combinedFilters = useMemo<AdminConnectionCursorFilters>(
    () => ({
      ...filters,
      search: search.trim() || undefined,
    }),
    [filters, search]
  );

  // Infinite scroll query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteAdminConnections(combinedFilters);

  const handlePlatformChange = useCallback((platform: PlatformType | '') => {
    setFilters((prev) => ({ ...prev, platform: platform || undefined }));
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
    setFilters((prev) => ({ ...prev, isActive }));
  }, []);

  const handleViewDetails = useCallback((connection: AdminConnectionListItem) => {
    setSelectedConnection(connection);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedConnection(null);
  }, []);

  const handleTestToken = useCallback(() => {
    navigate('/meta-token-examiner');
  }, [navigate]);

  const activeFilterCount = [
    filters.platform,
    filters.isActive !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <BaseHeader
        title={t('connections.admin_title')}
        subtitle={t('connections.admin_subtitle')}
        showFilterButton
        activeFilterCount={activeFilterCount}
        onFilterClick={() => setShowFilters(!showFilters)}
        primaryAction={{
          label: 'Test Token',
          icon: TestTube2,
          onClick: handleTestToken,
        }}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder={t('connections.filters.search_placeholder', 'Search by account, agent, or organization...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb bg-white text-sm"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t('common.filters')}
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('connections.filters.platform')}
              </label>
              <select
                value={filters.platform || ''}
                onChange={(e) => handlePlatformChange(e.target.value as PlatformType | '')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
              >
                <option value="">{t('connections.filters.all_platforms')}</option>
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('connections.filters.status')}
              </label>
              <select
                value={
                  filters.isActive === undefined
                    ? 'all'
                    : filters.isActive
                    ? 'active'
                    : 'inactive'
                }
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('common.clear_filters')}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <AdminConnectionsTable
          connections={data?.connections || []}
          isLoading={isLoading}
          error={error as Error | null}
          onViewDetails={handleViewDetails}
          hasMore={hasNextPage || false}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </div>

      {/* Details Modal */}
      {selectedConnection && (
        <ConnectionDetailsModal
          connectionId={selectedConnection.id}
          isOpen={!!selectedConnection}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
