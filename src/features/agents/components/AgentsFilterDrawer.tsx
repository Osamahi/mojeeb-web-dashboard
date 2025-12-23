/**
 * Agents Filter Drawer
 * Slide-in drawer for filtering and sorting agents list
 * Follows LeadsFilterDrawer pattern with minimal design
 */

import { useState, useEffect } from 'react';
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
          <h2 className="text-lg font-semibold text-neutral-950">Filter Agents</h2>
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
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, description, organization..."
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
              Status
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
                    {status === 'all' ? 'All Statuses' : status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Model Provider Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Model Provider
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
                    {provider === 'all' ? 'All Providers' : provider}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Target Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Platform Target
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
                    {platform === 'all' ? 'All Platforms' : platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sort By
            </label>
            <div className="space-y-2">
              {[
                { value: 'createdAt', label: 'Created Date (Newest First)' },
                { value: 'updatedAt', label: 'Updated Date (Newest First)' },
                { value: 'name', label: 'Name (A-Z)' },
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
            Clear All
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
