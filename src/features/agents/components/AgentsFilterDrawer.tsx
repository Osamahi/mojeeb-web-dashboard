/**
 * Agents Filter Drawer
 * Slide-in drawer for filtering and sorting agents list
 * Follows LeadsFilterDrawer pattern with minimal design
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AgentStatus, ModelProvider, PlatformTarget } from '../types/agent.types';

export interface AgentFilters {
  search: string;
  status: AgentStatus | 'all';
  modelProvider: ModelProvider | 'all';
  platformTarget: PlatformTarget | 'all';
  sortBy: 'name' | 'createdAt' | 'updatedAt';
}

interface AgentsFilterDrawerProps {
  isOpen: boolean;
  filters: AgentFilters;
  onClose: () => void;
  onApplyFilters: (filters: AgentFilters) => void;
}

export default function AgentsFilterDrawer({
  isOpen,
  filters,
  onClose,
  onApplyFilters,
}: AgentsFilterDrawerProps) {
  const { t } = useTranslation();
  // Draft state - changes only apply when user clicks "Apply"
  const [draftFilters, setDraftFilters] = useState<AgentFilters>(filters);

  // Sync draft state when filters change externally
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleClearAll = () => {
    const defaultFilters: AgentFilters = {
      search: '',
      status: 'all',
      modelProvider: 'all',
      platformTarget: 'all',
      sortBy: 'createdAt',
    };
    setDraftFilters(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-950">{t('agents_filter.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Filter Sections */}
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('common.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('agents_filter.search_placeholder')}
                value={draftFilters.search}
                onChange={(e) =>
                  setDraftFilters({ ...draftFilters, search: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('common.status')}
            </label>
            <div className="space-y-2">
              {(['all', 'draft', 'active'] as const).map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={draftFilters.status === status}
                    onChange={(e) =>
                      setDraftFilters({
                        ...draftFilters,
                        status: e.target.value as AgentStatus | 'all',
                      })
                    }
                    className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan"
                  />
                  <span className="text-sm text-neutral-950 capitalize">
                    {status === 'all' ? t('agents_filter.status_all') : t(`agents_filter.status_${status}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Model Provider Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('agents_filter.model_provider_label')}
            </label>
            <div className="space-y-2">
              {(['all', 'gemini', 'openai', 'claude'] as const).map((provider) => (
                <label
                  key={provider}
                  className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="modelProvider"
                    value={provider}
                    checked={draftFilters.modelProvider === provider}
                    onChange={(e) =>
                      setDraftFilters({
                        ...draftFilters,
                        modelProvider: e.target.value as ModelProvider | 'all',
                      })
                    }
                    className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan"
                  />
                  <span className="text-sm text-neutral-950 capitalize">
                    {provider === 'all' ? t('agents_filter.provider_all') : provider}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Target Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('agents_filter.platform_target_label')}
            </label>
            <div className="space-y-2">
              {(['all', 'mobile', 'web', 'both'] as const).map((platform) => (
                <label
                  key={platform}
                  className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="platformTarget"
                    value={platform}
                    checked={draftFilters.platformTarget === platform}
                    onChange={(e) =>
                      setDraftFilters({
                        ...draftFilters,
                        platformTarget: e.target.value as PlatformTarget | 'all',
                      })
                    }
                    className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan"
                  />
                  <span className="text-sm text-neutral-950 capitalize">
                    {platform === 'all' ? t('agents_filter.platform_all') : t(`agents_filter.platform_${platform}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('agents_filter.sort_by_label')}
            </label>
            <div className="space-y-2">
              {[
                { value: 'createdAt', label: t('agents_filter.sort_created') },
                { value: 'updatedAt', label: t('agents_filter.sort_updated') },
                { value: 'name', label: t('agents_filter.sort_name') },
              ].map((sort) => (
                <label
                  key={sort.value}
                  className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={sort.value}
                    checked={draftFilters.sortBy === sort.value}
                    onChange={(e) =>
                      setDraftFilters({
                        ...draftFilters,
                        sortBy: e.target.value as 'name' | 'createdAt' | 'updatedAt',
                      })
                    }
                    className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan"
                  />
                  <span className="text-sm text-neutral-950">{sort.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            className="flex-1"
          >
            {t('agents_filter.clear_all')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            className="flex-1"
          >
            {t('agents_filter.apply_filters')}
          </Button>
        </div>
      </div>
    </>
  );
}
