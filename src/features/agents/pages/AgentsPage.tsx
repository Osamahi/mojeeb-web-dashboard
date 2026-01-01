/**
 * Mojeeb Minimal Agents Page
 * Clean agents list with search, filters, and vertical cards
 * NO animations, NO glass effects - just professional simplicity
 *
 * NOTE: This page reads agents from Zustand store - DashboardLayout handles fetching
 */

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAgentStore } from '../stores/agentStore';
import AgentCard from '../components/AgentCard';
import AgentFormModal from '../components/AgentFormModal';
import { BaseHeader } from '@/components/ui/BaseHeader';
import AgentsFilterDrawer, { type AgentFilters } from '../components/AgentsFilterDrawer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Agent } from '../types/agent.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { AgentListSkeleton } from '../components/AgentCardSkeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AgentsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_agents');
  // Read agents from store - DashboardLayout handles fetching and syncing
  const agents = useAgentStore((state) => state.agents);
  const isLoading = useAgentStore((state) => state.isLoading);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if user is SuperAdmin
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;

  // Filter state
  const [filters, setFilters] = useState<AgentFilters>({
    search: '',
    status: 'all',
    modelProvider: 'all',
    platformTarget: 'all',
    sortBy: 'createdAt',
  });

  // Filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Calculate active filter count (excludes default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.modelProvider !== 'all') count++;
    if (filters.platformTarget !== 'all') count++;
    if (filters.sortBy !== 'createdAt') count++;
    return count;
  }, [filters]);

  // Filter and sort agents (client-side)
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    // Step 1: Filter
    let result = agents.filter((agent) => {
      // Search filter (name, description, organization)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(searchLower);
        const matchesDescription = agent.description?.toLowerCase().includes(searchLower);
        const matchesOrg = agent.organizationName?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesDescription && !matchesOrg) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && agent.status !== filters.status) {
        return false;
      }

      // Model provider filter
      if (filters.modelProvider !== 'all' && agent.modelProvider !== filters.modelProvider) {
        return false;
      }

      // Platform target filter
      if (filters.platformTarget !== 'all' && agent.platformTarget !== filters.platformTarget) {
        return false;
      }

      return true;
    });

    // Step 2: Sort
    result = [...result].sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [agents, filters]);

  // Handlers
  const handleFilterDrawerToggle = () => {
    setIsFilterDrawerOpen(!isFilterDrawerOpen);
  };

  const handleFilterDrawerClose = () => {
    setIsFilterDrawerOpen(false);
  };

  const handleApplyFilters = (newFilters: AgentFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Filter Button (SuperAdmin only) */}
      <BaseHeader
        title={t('agents.title')}
        subtitle={t('agents.subtitle')}
        showFilterButton={isSuperAdmin}
        activeFilterCount={activeFilterCount}
        onFilterClick={handleFilterDrawerToggle}
        primaryAction={{
          label: t('common.create'),
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true)
        }}
      />

      {/* Show loading state with skeleton */}
      {isLoading || !agents ? (
        <AgentListSkeleton count={5} />
      ) : (
        <>
          {/* Agents List - Vertical Cards */}
          {filteredAgents.length > 0 ? (
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : agents && agents.length > 0 ? (
            // Has agents but no matches after filtering
            <EmptyState
              icon={<Search className="w-12 h-12 text-neutral-400" />}
              title={t('agents.no_match_title')}
              description={t('agents.no_match_description')}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: 'all',
                      modelProvider: 'all',
                      platformTarget: 'all',
                      sortBy: 'createdAt',
                    });
                  }}
                >
                  {t('common.clear_filters')}
                </Button>
              }
            />
          ) : (
            // No agents at all
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
        </>
      )}

      {/* Filter Drawer */}
      <AgentsFilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        onClose={handleFilterDrawerClose}
        onApplyFilters={handleApplyFilters}
      />

      {/* Create Agent Modal */}
      <AgentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
}
