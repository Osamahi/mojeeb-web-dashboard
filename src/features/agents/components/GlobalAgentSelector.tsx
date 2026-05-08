/**
 * Mojeeb Global Agent Selector Component
 * Modal-based selector for switching between agents globally.
 *
 * Architecture: cursor-paginated. The selector loads page 1 on open and
 * reveals "load more" for additional pages. Search is server-side and works
 * for all roles uniformly (the SuperAdmin / regular-user distinction is
 * handled by the backend RPC routing).
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgentStore } from '../stores/agentStore';
import { Spinner } from '@/components/ui/Spinner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useInfiniteAgents } from '../hooks/useInfiniteAgents';

export default function GlobalAgentSelector() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { globalSelectedAgent, isAgentSwitching, switchAgent, setGlobalSelectedAgent } =
    useAgentStore();

  // Debounce search input — 300ms matches other dashboard search fields.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Page 1 fetched eagerly on mount so the trigger button can render the
  // "select an agent" empty state. Additional pages load on demand inside
  // the modal via fetchNextPage().
  const {
    agents,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteAgents({
    searchTerm: debouncedSearch || undefined,
    enabled: true,
  });

  // Bootstrap `globalSelectedAgent` from the first cursor page if the store
  // has none yet. Replaces the eager initializeAgentSelection() that used to
  // run from DashboardLayout. Fires unconditionally on the unfiltered first
  // page so re-running it after a search doesn't override the user's choice.
  useEffect(() => {
    if (globalSelectedAgent || debouncedSearch || agents.length === 0) return;
    setGlobalSelectedAgent(agents[0]);
  }, [globalSelectedAgent, debouncedSearch, agents, setGlobalSelectedAgent]);

  // Auto-load more on scroll inside the modal list.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isModalOpen || !hasNextPage) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: '50px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isModalOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAgentSelect = async (agentId: string) => {
    setIsModalOpen(false);
    setSearchQuery('');
    if (globalSelectedAgent?.id === agentId) return;
    await switchAgent(agentId);
  };

  const handleCreateAgent = () => {
    setIsModalOpen(false);
    setSearchQuery('');
    navigate('/onboarding');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSearchQuery('');
  };

  // Initial load skeleton (no agents and no selected agent).
  if (isLoading && agents.length === 0 && !globalSelectedAgent) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md">
        <div className="h-3.5 w-20 bg-neutral-200 rounded animate-pulse" />
        <div className="h-3.5 w-3.5 bg-neutral-200 rounded animate-pulse" />
      </div>
    );
  }

  if (isAgentSwitching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-50">
        <Spinner size="sm" />
        <span className="text-sm text-neutral-600">{t('agent_selector.switching')}</span>
      </div>
    );
  }

  // Empty state — no agents at all (and none selected).
  if (!isLoading && agents.length === 0 && !globalSelectedAgent) {
    return (
      <button
        onClick={handleCreateAgent}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-50 transition-colors"
      >
        <Plus className="w-4 h-4 text-brand-mojeeb" />
        <span className="text-sm font-medium text-brand-mojeeb">
          {t('agent_selector.create_agent')}
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors max-w-[180px] hover:bg-neutral-50"
        title={globalSelectedAgent?.name}
      >
        {globalSelectedAgent ? (
          <>
            <span className="text-sm font-medium text-neutral-950 truncate">
              {globalSelectedAgent.name}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />
          </>
        ) : (
          <>
            <span className="text-sm text-neutral-500">
              {t('agent_selector.select_placeholder')}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />
          </>
        )}
      </button>

      {/* Selection modal */}
      <BaseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={t('agent_selector.modal_title')}
        maxWidth="sm"
      >
        <div className="flex flex-col">
          {/* Search input — server-side, available to all roles. */}
          <div className="relative mb-4">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('agent_selector.search_placeholder')}
              className="w-full ps-10 pe-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-mojeeb focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Agent list (scrollable, infinite) */}
          <div className="max-h-[400px] overflow-y-auto space-y-1 mb-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : agents.length === 0 && debouncedSearch ? (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">
                  {t('agent_selector.no_results', { query: debouncedSearch })}
                </p>
              </div>
            ) : (
              <>
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors',
                      globalSelectedAgent?.id === agent.id &&
                        'bg-brand-mojeeb text-white hover:bg-brand-mojeeb',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        globalSelectedAgent?.id === agent.id
                          ? 'text-white'
                          : 'text-neutral-950',
                      )}
                    >
                      {agent.name}
                    </span>
                    {globalSelectedAgent?.id === agent.id && (
                      <Check className="w-4 h-4 text-white flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Load-more sentinel + button */}
                {hasNextPage && (
                  <div ref={sentinelRef} className="py-2 flex justify-center">
                    {isFetchingNextPage ? (
                      <Spinner size="sm" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNextPage()}
                      >
                        {t('common.load_more')}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-neutral-200 mb-3" />

          <button
            onClick={handleCreateAgent}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-mojeeb" />
            <span className="text-sm font-medium text-brand-mojeeb">
              {t('agent_selector.create_new')}
            </span>
          </button>
        </div>
      </BaseModal>
    </>
  );
}
