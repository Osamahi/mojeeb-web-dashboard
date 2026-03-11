/**
 * Action Executions page (SuperAdmin only)
 * Displays all action executions across all actions with cursor pagination.
 * Allows opening conversations via ConversationViewDrawer.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useInfiniteAllExecutions } from '../hooks/useActions';
import { useDateLocale } from '@/lib/dateConfig';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import type { ExecutionFilters, ActionExecution } from '../types';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function ExecutionRow({
  execution,
  formatSmartTimestamp,
  onOpenConversation,
  t,
}: {
  execution: ActionExecution;
  formatSmartTimestamp: (date: string) => string;
  onOpenConversation: (conversationId: string) => void;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {execution.actionName || t('action_executions.unknown_action')}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {execution.agentName || '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {execution.actionType || '-'}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={execution.status} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {execution.executionTimeMs != null ? `${execution.executionTimeMs}ms` : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {formatSmartTimestamp(execution.executedAt)}
        </td>
        <td className="px-4 py-3">
          {execution.conversationId ? (
            <button
              onClick={() => onOpenConversation(execution.conversationId!)}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
              title={t('action_executions.view_conversation')}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="space-y-3 text-sm">
              {execution.errorMessage && (
                <div>
                  <span className="font-medium text-red-600">{t('action_executions.error_label')}: </span>
                  <span className="text-red-700">{execution.errorMessage}</span>
                </div>
              )}
              {execution.requestData && (
                <div>
                  <span className="font-medium text-gray-700">{t('action_executions.input_data')}:</span>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(execution.requestData, null, 2)}
                  </pre>
                </div>
              )}
              {execution.responseData && (
                <div>
                  <span className="font-medium text-gray-700">{t('action_executions.output_data')}:</span>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(execution.responseData, null, 2)}
                  </pre>
                </div>
              )}
              <div className="text-xs text-gray-400 flex gap-4">
                <span>{t('action_executions.execution_id')}: {execution.id}</span>
                <span>{t('action_executions.action_id')}: {execution.actionId}</span>
                {execution.conversationId && <span>{t('action_executions.conversation_id')}: {execution.conversationId}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ActionExecutionsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_action_executions');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { formatSmartTimestamp } = useDateLocale();

  // Debounce search input (400ms)
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(debounceTimerRef.current);
  }, [search]);

  const filters: ExecutionFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      actionType: actionTypeFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [statusFilter, actionTypeFilter, debouncedSearch]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAllExecutions(filters);

  const executions = data?.executions ?? [];

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpenConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const statusOptions = useMemo(() => [
    { value: '', label: t('action_executions.all_statuses') },
    { value: 'success', label: t('action_executions.status_success') },
    { value: 'failed', label: t('action_executions.status_failed') },
    { value: 'pending', label: t('action_executions.status_pending') },
  ], [t]);

  const actionTypeOptions = useMemo(() => [
    { value: '', label: t('action_executions.all_types') },
    { value: 'api_call', label: t('action_executions.type_api_call') },
    { value: 'webhook', label: t('action_executions.type_webhook') },
    { value: 'lead_generation', label: t('action_executions.type_lead_generation') },
    { value: 'integration', label: t('action_executions.type_integration') },
  ], [t]);

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('action_executions.title')}
        subtitle={t('action_executions.subtitle')}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('action_executions.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={actionTypeFilter}
          onChange={(e) => setActionTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {actionTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_action')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_agent')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_duration')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_executed_at')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action_executions.col_conversation')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-red-500">
                    {t('action_executions.load_error', { error: (error as Error)?.message || t('action_executions.unknown_error') })}
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    {t('action_executions.no_results')}
                  </td>
                </tr>
              ) : (
                executions.map((execution) => (
                  <ExecutionRow
                    key={execution.id}
                    execution={execution}
                    formatSmartTimestamp={formatSmartTimestamp}
                    onOpenConversation={handleOpenConversation}
                    t={t}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="px-4 py-3 text-center text-sm text-gray-400">
            {t('action_executions.loading_more')}
          </div>
        )}
      </div>

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
