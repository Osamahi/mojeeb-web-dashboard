import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { followUpAdminService } from '../services/followupAdminService';
import { useDateLocale } from '@/lib/dateConfig';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { FollowUpStepAdmin, FollowUpStepFilters } from '../types/followup.types';

const PAGE_SIZE = 50;

/**
 * Formats delay in minutes to a human-readable string.
 * Examples: 30 → "30m", 90 → "1h 30m", 1440 → "1d", 2880 → "2d"
 */
function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

export default function AdminFollowUpStepsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_followup_steps');
  const { formatSmartTimestamp } = useDateLocale();

  const [steps, setSteps] = useState<FollowUpStepAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FollowUpStepFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Cursor-based pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadSteps = useCallback(async (cursor: string | null, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await followUpAdminService.getSteps(filters, PAGE_SIZE, cursor);

      if (append) {
        setSteps(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newItems = result.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        setSteps(result.items);
      }

      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load follow-up steps:', error);
      toast.error(t('followup_steps.load_failed'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, t]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        const currentSearch = prev.searchTerm || '';
        if (searchInput === currentSearch) return prev;
        return { ...prev, searchTerm: searchInput || undefined };
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load on filter changes (reset cursor)
  useEffect(() => {
    setNextCursor(null);
    setSteps([]);
    loadSteps(null, false);
  }, [filters, loadSteps]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && nextCursor) {
          loadSteps(nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [nextCursor, hasMore, loading, loadingMore, loadSteps]);

  const handleRefresh = useCallback(() => {
    setNextCursor(null);
    setSteps([]);
    setHasMore(true);
    loadSteps(null, false);
  }, [loadSteps]);

  return (
    <div className="space-y-6 p-6">
      <BaseHeader
        title={t('followup_steps.title')}
        subtitle={t('followup_steps.subtitle')}
      />

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('followup_steps.search_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 ps-10 pe-3 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Enabled Filter */}
          <select
            value={filters.isEnabled || ''}
            onChange={(e) =>
              setFilters({ ...filters, isEnabled: e.target.value || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">{t('followup_steps.all_statuses')}</option>
            <option value="true">{t('followup_steps.enabled')}</option>
            <option value="false">{t('followup_steps.disabled')}</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('followup_steps.refresh')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg font-medium">{t('followup_steps.no_steps_title')}</p>
            <p className="text-sm mt-1">{t('followup_steps.no_steps_subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_agent')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_step')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_delay')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_status')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_created')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_steps.col_updated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {steps.map((step) => (
                  <Fragment key={step.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedStepId === step.id ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {step.agentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {t('followup_steps.step_label', { order: step.stepOrder })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <span className="font-mono">{formatDelay(step.delayMinutes)}</span>
                        <span className="text-gray-400 ms-1">
                          ({step.delayMinutes}{t('followup_steps.minutes_short')})
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          step.isEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {step.isEnabled ? t('followup_steps.enabled') : t('followup_steps.disabled')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatSmartTimestamp(step.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatSmartTimestamp(step.updatedAt)}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedStepId === step.id && (
                      <tr key={`${step.id}-details`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_step_id')}</span>
                              <span className="font-mono text-xs text-gray-700 break-all">{step.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_agent_id')}</span>
                              <span className="font-mono text-xs text-gray-700 break-all">{step.agentId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_delay')}</span>
                              <span className="text-gray-700">
                                {step.delayMinutes} {t('followup_steps.minutes_label')} ({formatDelay(step.delayMinutes)})
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_step_order')}</span>
                              <span className="text-gray-700">{step.stepOrder}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_created')}</span>
                              <span className="text-gray-700">{formatSmartTimestamp(step.createdAt, { showTimezone: true })}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_steps.detail_updated')}</span>
                              <span className="text-gray-700">{formatSmartTimestamp(step.updatedAt, { showTimezone: true })}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Infinite scroll observer target */}
        {!loading && hasMore && (
          <div ref={observerTarget} className="flex items-center justify-center py-4">
            {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          </div>
        )}
      </div>
    </div>
  );
}
