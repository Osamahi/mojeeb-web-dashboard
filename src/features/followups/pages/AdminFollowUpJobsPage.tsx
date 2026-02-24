import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, Loader2, ChevronDown, ChevronRight, MessageSquare, Play } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { followUpAdminService } from '../services/followupAdminService';
import { useDateLocale } from '@/lib/dateConfig';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import type { FollowUpJob, FollowUpJobFilters, FollowUpJobStatus } from '../types/followup.types';

const STATUS_COLORS: Record<FollowUpJobStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-800',
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  test: 'Test',
};

const PAGE_SIZE = 50;

export default function AdminFollowUpJobsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_followup_jobs');
  const { formatSmartTimestamp } = useDateLocale();

  const [jobs, setJobs] = useState<FollowUpJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FollowUpJobFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);

  // Cursor-based pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadJobs = useCallback(async (cursor: string | null, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await followUpAdminService.getJobs(filters, PAGE_SIZE, cursor);

      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newItems = result.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        setJobs(result.items);
      }

      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load follow-up jobs:', error);
      toast.error(t('followup_jobs.load_failed'));
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
    setJobs([]);
    loadJobs(null, false);
  }, [filters, loadJobs]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && nextCursor) {
          loadJobs(nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [nextCursor, hasMore, loading, loadingMore, loadJobs]);

  const handleRefresh = useCallback(() => {
    setNextCursor(null);
    setJobs([]);
    setHasMore(true);
    loadJobs(null, false);
  }, [loadJobs]);

  const handleViewConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleTriggerJob = useCallback(async (jobId: string) => {
    setTriggeringJobId(jobId);
    try {
      await followUpAdminService.triggerJob(jobId);
      toast.success(t('followup_jobs.trigger_success'));
      // Update the local job status to 'processing' immediately for UI feedback
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing' as const } : j));
    } catch (error) {
      console.error('Failed to trigger follow-up job:', error);
      toast.error(t('followup_jobs.trigger_failed'));
    } finally {
      setTriggeringJobId(null);
    }
  }, [t]);

  const getResultText = (job: FollowUpJob): string => {
    if (job.status === 'sent' && job.sentAt)
      return t('followup_jobs.result_sent', { time: formatSmartTimestamp(job.sentAt) });
    if (job.status === 'cancelled' && job.cancelReason)
      return t('followup_jobs.result_cancelled', { reason: job.cancelReason });
    if (job.status === 'skipped' && job.skippedReason)
      return t('followup_jobs.result_skipped', { reason: job.skippedReason });
    if (job.status === 'failed' && job.lastError)
      return t('followup_jobs.result_error', { message: job.lastError.substring(0, 80) });
    if (job.status === 'scheduled')
      return t('followup_jobs.result_scheduled', { time: formatSmartTimestamp(job.scheduledFor) });
    if (job.status === 'processing')
      return t('followup_jobs.result_processing');
    return '-';
  };

  return (
    <div className="space-y-6 p-6">
      <BaseHeader
        title={t('followup_jobs.title')}
        subtitle={t('followup_jobs.subtitle')}
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
            placeholder={t('followup_jobs.search_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 ps-10 pe-3 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: (e.target.value as FollowUpJobStatus) || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">{t('followup_jobs.all_statuses')}</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent</option>
            <option value="skipped">Skipped</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>

          {/* Platform Filter */}
          <select
            value={filters.platform || ''}
            onChange={(e) =>
              setFilters({ ...filters, platform: e.target.value || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">{t('followup_jobs.all_platforms')}</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="test">Test</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            title={t('followup_jobs.date_from')}
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              setFilters({ ...filters, dateTo: e.target.value || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            title={t('followup_jobs.date_to')}
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('followup_jobs.refresh')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg font-medium">{t('followup_jobs.no_jobs_title')}</p>
            <p className="text-sm mt-1">{t('followup_jobs.no_jobs_subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_agent')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_customer')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_platform')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_step')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_status')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_scheduled')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('followup_jobs.col_result')}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedJobId === job.id ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {job.agentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {job.customerName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {PLATFORM_LABELS[job.source] || job.source}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {t('followup_jobs.step_label', { order: job.stepOrder })}
                        <span className="text-gray-400 ms-1">
                          {t('followup_jobs.step_delay', { minutes: job.stepDelayMinutes })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatSmartTimestamp(job.scheduledFor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {getResultText(job)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {job.status === 'scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerJob(job.id);
                              }}
                              disabled={triggeringJobId === job.id}
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                              title={t('followup_jobs.trigger_now')}
                            >
                              {triggeringJobId === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewConversation(job.conversationId);
                            }}
                            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                            title={t('followup_jobs.view_conversation')}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedJobId === job.id && (
                      <tr key={`${job.id}-details`} className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">{t('followup_jobs.detail_job_id')}</span>
                              <span className="font-mono text-xs text-gray-700 break-all">{job.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_jobs.detail_conversation_id')}</span>
                              <span className="font-mono text-xs text-gray-700 break-all">{job.conversationId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_jobs.detail_created')}</span>
                              <span className="text-gray-700">{formatSmartTimestamp(job.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">{t('followup_jobs.detail_attempts')}</span>
                              <span className="text-gray-700">{job.attemptCount}</span>
                            </div>

                            {job.generatedMessage && (
                              <div className="col-span-full">
                                <span className="text-gray-500 block mb-1">{t('followup_jobs.detail_generated_message')}</span>
                                <div className="bg-white rounded border border-gray-200 p-3 text-gray-700 text-sm whitespace-pre-wrap">
                                  {job.generatedMessage}
                                </div>
                              </div>
                            )}

                            {job.lastError && (
                              <div className="col-span-full">
                                <span className="text-red-500 block mb-1">{t('followup_jobs.detail_error')}</span>
                                <div className="bg-red-50 rounded border border-red-200 p-3 text-red-700 text-sm whitespace-pre-wrap">
                                  {job.lastError}
                                </div>
                              </div>
                            )}

                            {job.cancelReason && (
                              <div className="col-span-2">
                                <span className="text-gray-500 block">{t('followup_jobs.detail_cancel_reason')}</span>
                                <span className="text-gray-700">{job.cancelReason}</span>
                              </div>
                            )}

                            {job.skippedReason && (
                              <div className="col-span-2">
                                <span className="text-gray-500 block">{t('followup_jobs.detail_skip_reason')}</span>
                                <span className="text-gray-700">{job.skippedReason}</span>
                              </div>
                            )}

                            {job.sentAt && (
                              <div>
                                <span className="text-gray-500 block">{t('followup_jobs.detail_sent_at')}</span>
                                <span className="text-gray-700">{formatSmartTimestamp(job.sentAt)}</span>
                              </div>
                            )}

                            {job.cancelledAt && (
                              <div>
                                <span className="text-gray-500 block">{t('followup_jobs.detail_cancelled_at')}</span>
                                <span className="text-gray-700">{formatSmartTimestamp(job.cancelledAt)}</span>
                              </div>
                            )}
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

      {/* Conversation Side Drawer */}
      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={() => setSelectedConversationId(null)}
      />
    </div>
  );
}
