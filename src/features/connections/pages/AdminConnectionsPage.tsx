import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { AdminConnectionsTable } from '../components/AdminConnectionsTable';
import { ConnectionDetailsModal } from '../components/ConnectionDetailsModal';
import { adminConnectionService, type AdminConnectionFilters, type AdminConnectionListItem } from '../services/adminConnectionService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
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
  useDocumentTitle('pages.title_admin_connections');

  const [filters, setFilters] = useState<AdminConnectionFilters>({
    page: 1,
    pageSize: 50,
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<AdminConnectionListItem | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch connections
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-connections', filters],
    queryFn: () => adminConnectionService.getAllConnections(filters),
  });

  const handlePlatformChange = useCallback((platform: PlatformType | '') => {
    setFilters((prev) => ({ ...prev, platform: platform || undefined, page: 1 }));
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
    setFilters((prev) => ({ ...prev, isActive, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleViewDetails = useCallback((connection: AdminConnectionListItem) => {
    setSelectedConnection(connection);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedConnection(null);
  }, []);

  const activeFilterCount = [
    filters.platform,
    filters.isActive !== undefined,
    filters.search,
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
      />

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('connections.filters.platform')}
              </label>
              <select
                value={filters.platform || ''}
                onChange={(e) => handlePlatformChange(e.target.value as PlatformType | '')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('connections.filters.search')}
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('connections.filters.search_placeholder')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilters({ page: 1, pageSize: 50 });
                setSearchInput('');
              }}
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
          error={error}
          onViewDetails={handleViewDetails}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
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
