/**
 * Conversation Filters Component
 * Search input + toggle filters + platform multiselect dropdown
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Globe, ChevronDown, Check, FlaskConical } from 'lucide-react';
import { PlatformIcon } from '@/features/connections/components/PlatformIcon';
import type { PlatformType } from '@/features/connections/types';
import { cn } from '@/lib/utils';

const KNOWN_PLATFORMS: Set<string> = new Set([
  'web', 'widget', 'facebook', 'instagram', 'whatsapp', 'tiktok', 'twitter', 'linkedin',
]);

// Fixed list of platforms always shown in the dropdown
const FIXED_PLATFORMS = ['facebook', 'instagram', 'whatsapp', 'widget', 'test'] as const;

export interface ConversationFiltersState {
  searchTerm: string;
  showUnreadOnly: boolean;
  selectedSources: string[];
  showUrgentOnly: boolean;
}

interface ConversationFiltersProps {
  filters: ConversationFiltersState;
  onFiltersChange: (filters: ConversationFiltersState) => void;
}

const DEBOUNCE_MS = 300;

export function ConversationFilters({
  filters,
  onFiltersChange,
}: ConversationFiltersProps) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (localSearch !== filters.searchTerm) {
        onFiltersChange({ ...filters, searchTerm: localSearch });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showPlatformDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPlatformDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlatformDropdown]);

  const clearSearch = useCallback(() => {
    setLocalSearch('');
    onFiltersChange({ ...filters, searchTerm: '' });
  }, [filters, onFiltersChange]);

  const toggleUnread = useCallback(() => {
    onFiltersChange({ ...filters, showUnreadOnly: !filters.showUnreadOnly });
  }, [filters, onFiltersChange]);

  const toggleUrgent = useCallback(() => {
    onFiltersChange({ ...filters, showUrgentOnly: !filters.showUrgentOnly });
  }, [filters, onFiltersChange]);

  const toggleSource = useCallback((source: string) => {
    const newSources = filters.selectedSources.includes(source)
      ? filters.selectedSources.filter(s => s !== source)
      : [...filters.selectedSources, source];
    onFiltersChange({ ...filters, selectedSources: newSources });
  }, [filters, onFiltersChange]);

  const clearSources = useCallback(() => {
    onFiltersChange({ ...filters, selectedSources: [] });
    setShowPlatformDropdown(false);
  }, [filters, onFiltersChange]);

  // Platform dropdown label
  const platformLabel = filters.selectedSources.length === 0
    ? t('conversations.filters.all_platforms', 'All Platforms')
    : filters.selectedSources.length === 1
      ? t(`conversations.filters.platform_${filters.selectedSources[0]}`, formatSourceLabel(filters.selectedSources[0]))
      : t('conversations.filters.platforms_count', '{{count}} platforms', { count: filters.selectedSources.length });

  return (
    <div className="px-2 pb-2 space-y-2">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t('conversations.filters.search_placeholder', 'Search conversations...')}
          className="w-full ps-8 pe-8 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb placeholder:text-neutral-400"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Filter row (always visible) */}
      <div className="flex items-center gap-1.5">
        {/* Unread toggle */}
        <FilterToggle
          active={filters.showUnreadOnly}
          onClick={toggleUnread}
          label={t('conversations.filters.unread', 'Unread')}
        />

        {/* Urgent toggle */}
        <FilterToggle
          active={filters.showUrgentOnly}
          onClick={toggleUrgent}
          label={t('conversations.filters.urgent', 'Needs Attention')}
        />

        {/* Platform multiselect dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filters.selectedSources.length > 0
                ? 'bg-brand-mojeeb/10 border-brand-mojeeb text-brand-mojeeb'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <span className="max-w-[100px] truncate">{platformLabel}</span>
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform',
              showPlatformDropdown && 'rotate-180'
            )} />
          </button>

          {/* Dropdown menu */}
          {showPlatformDropdown && (
            <div className="absolute top-full start-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1">
              {FIXED_PLATFORMS.map((source) => {
                  const isSelected = filters.selectedSources.includes(source);
                  return (
                    <button
                      key={source}
                      onClick={() => toggleSource(source)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                        isSelected
                          ? 'bg-brand-mojeeb/5 text-brand-mojeeb'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      {/* Checkbox indicator */}
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected
                          ? 'bg-brand-mojeeb border-brand-mojeeb'
                          : 'border-neutral-300'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Platform icon */}
                      {source === 'test' ? (
                        <FlaskConical className="w-4 h-4 text-orange-500" />
                      ) : KNOWN_PLATFORMS.has(source) ? (
                        <PlatformIcon
                          platform={source as PlatformType}
                          size="sm"
                          showBackground={false}
                          className="[&_svg]:w-4 [&_svg]:h-4"
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-neutral-400" />
                      )}

                      {/* Label */}
                      <span className="flex-1 text-start">{t(`conversations.filters.platform_${source}`, formatSourceLabel(source))}</span>
                    </button>
                  );
                })}

                {/* Clear selection */}
                {filters.selectedSources.length > 0 && (
                  <>
                    <div className="border-t border-neutral-100 my-1" />
                    <button
                      onClick={clearSources}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('conversations.filters.clear_platforms', 'Clear selection')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

interface FilterToggleProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterToggle({ active, onClick, label }: FilterToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
        active
          ? 'bg-brand-mojeeb/10 border-brand-mojeeb text-brand-mojeeb'
          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
      )}
    >
      {label}
    </button>
  );
}

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    web: 'Web',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    widget: 'Website',
    tiktok: 'TikTok',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
  };
  return labels[source] || source.charAt(0).toUpperCase() + source.slice(1);
}
