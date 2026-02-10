/**
 * Modal for viewing action execution history
 */

import { BaseModal } from '@/components/ui/BaseModal';
import { useActionExecutions } from '../hooks/useActions';
import type { Action } from '../types';
import {
  formatExecutionStatus,
  getExecutionStatusColor,
  formatExecutionTime,
  formatJson,
} from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';
import { Check, X, Clock } from 'lucide-react';

interface ActionExecutionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
}

export function ActionExecutionsModal({
  isOpen,
  onClose,
  action,
}: ActionExecutionsModalProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const { data, isLoading } = useActionExecutions(action?.id);

  if (!action) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Execution History: ${action.name}`}
      subtitle="View recent executions and performance statistics"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Statistics */}
        {data?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total"
              value={data.stats.total.toString()}
              icon={<Clock className="w-4 h-4 text-blue-600" />}
            />
            <StatCard
              label="Successful"
              value={data.stats.successful.toString()}
              icon={<Check className="w-4 h-4 text-green-600" />}
            />
            <StatCard
              label="Failed"
              value={data.stats.failed.toString()}
              icon={<X className="w-4 h-4 text-red-600" />}
            />
            <StatCard
              label="Avg Time"
              value={formatExecutionTime(data.stats.avgExecutionTime)}
              icon={<Clock className="w-4 h-4 text-orange-600" />}
            />
          </div>
        )}

        {/* Executions List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-neutral-50 rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : data?.executions && data.executions.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {data.executions.map((execution) => (
              <div
                key={execution.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getExecutionStatusColor(
                          execution.status
                        )}`}
                      >
                        {formatExecutionStatus(execution.status)}
                      </span>
                      {execution.executionTimeMs !== null && (
                        <span className="text-xs text-neutral-500">
                          {formatExecutionTime(execution.executionTimeMs)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatSmartTimestamp(execution.executedAt)}
                    </p>
                  </div>
                </div>

                {/* Conversation ID */}
                <div className="text-xs">
                  <span className="text-neutral-600">Conversation:</span>{' '}
                  <code className="bg-neutral-100 px-2 py-0.5 rounded">
                    {execution.conversationId}
                  </code>
                </div>

                {/* Error Message (if failed) */}
                {execution.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-900 font-mono">
                      {execution.errorMessage}
                    </p>
                  </div>
                )}

                {/* Request Data */}
                {execution.requestData && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-neutral-700 font-medium hover:text-neutral-900">
                      Request Data
                    </summary>
                    <div className="mt-2 bg-neutral-900 text-neutral-100 rounded p-2 overflow-x-auto">
                      <pre className="font-mono text-xs">
                        {formatJson(execution.requestData)}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Response Data */}
                {execution.responseData && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-neutral-700 font-medium hover:text-neutral-900">
                      Response Data
                    </summary>
                    <div className="mt-2 bg-neutral-900 text-neutral-100 rounded p-2 overflow-x-auto">
                      <pre className="font-mono text-xs">
                        {formatJson(execution.responseData)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No execution history found
          </div>
        )}
      </div>
    </BaseModal>
  );
}

// Stat card component
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-neutral-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}
