/**
 * Mojeeb Agents Page
 * Cursor-paginated agents list with server-side filters.
 *
 * Sort is fixed at created_at DESC (the cursor's keyset). Filters
 * (search, status, model, platform, plan) are pushed to SQL so they apply
 * across all pages, not just the loaded subset.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AgentCard from '../components/AgentCard';
import AgentFormModal from '../components/AgentFormModal';
import { BaseHeader } from '@/components/ui/BaseHeader';
import AgentsFilterDrawer, { type AgentFilters } from '../components/AgentsFilterDrawer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { AgentListSkeleton } from '../components/AgentCardSkeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useInfiniteAgents } from '../hooks/useInfiniteAgents';

const DEFAULT_FILTERS: AgentFilters = {
  search: '',
  status: 'all',
  modelProvider: 'all',
  platformTarget: 'all',
  planCode: 'all',
};

// Convert "all" sentinel to undefined so the hook drops the param.
const cleanFilter = (value: string) => (value === 'all' ? undefined : value);

export default function AgentsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_agents');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;

  const [filters, setFilters] = useState<AgentFilters>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce the search filter so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const { agents, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteAgents({
    searchTerm: debouncedSearch || undefined,
    status: cleanFilter(filters.status),
    modelProvider: cleanFilter(filters.modelProvider),
    platformTarget: cleanFilter(filters.platformTarget),
    planCode: cleanFilter(filters.planCode),
  });

  // Active filter count for the header badge (excludes 'all' defaults).
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.modelProvider !== 'all') count++;
    if (filters.platformTarget !== 'all') count++;
    if (filters.planCode !== 'all') count++;
    return count;
  }, [filters]);

  // Auto-load more when the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleApplyFilters = (newFilters: AgentFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <BaseHeader
        title={t('agents.title')}
        subtitle={t('agents.subtitle')}
        showFilterButton={isSuperAdmin}
        activeFilterCount={activeFilterCount}
        onFilterClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
        primaryAction={{
          label: t('common.create'),
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      {isLoading ? (
        <AgentListSkeleton count={5} />
      ) : agents.length > 0 ? (
        <>
          <div className="space-y-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Sentinel + load-more affordance */}
          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center pt-4">
              {isFetchingNextPage ? (
                <AgentListSkeleton count={2} />
              ) : (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  {t('common.load_more')}
                </Button>
              )}
            </div>
          )}
        </>
      ) : activeFilterCount > 0 ? (
        // Filters active but no matches.
        <EmptyState
          icon={<Search className="w-12 h-12 text-neutral-400" />}
          title={t('agents.no_match_title')}
          description={t('agents.no_match_description')}
          action={
            <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
              {t('common.clear_filters')}
            </Button>
          }
        />
      ) : (
        // No agents at all.
        <EmptyState
          icon={<Search className="w-12 h-12 text-neutral-400" />}
          title={t('agents.no_agents_title')}
          description={t('agents.no_agents_description')}
          action={
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('agents.create_agent')}
            </Button>
          }
        />
      )}

      <AgentsFilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      <AgentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
}
