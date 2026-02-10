/**
 * Table/List view for actions with infinite scroll
 * Responsive design: card layout on mobile, table-like on desktop
 */

import { useCallback, useRef, useEffect } from 'react';
import { Eye, Pencil, Trash2, Play, MoreVertical } from 'lucide-react';
import type { Action } from '../types';
import { ActionTypeBadge } from './ActionTypeBadge';
import { formatPriority, getPriorityColor, truncateText } from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';

interface ActionsTableViewProps {
  actions: Action[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onView: (action: Action) => void;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
  onViewExecutions: (action: Action) => void;
}

export function ActionsTableView({
  actions,
  hasMore,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  onView,
  onEdit,
  onDelete,
  onViewExecutions,
}: ActionsTableViewProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetchingNextPage, onLoadMore]);

  if (actions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-500 text-sm">
          No actions found. Create your first action to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewExecutions={onViewExecutions}
          formatSmartTimestamp={formatSmartTimestamp}
          showAgentId={isSuperAdmin}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="text-neutral-500 text-sm">Loading more...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Separate card component for better performance
interface ActionCardProps {
  action: Action;
  onView: (action: Action) => void;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
  onViewExecutions: (action: Action) => void;
  formatSmartTimestamp: (date: string) => string;
  showAgentId?: boolean;
}

function ActionCard({
  action,
  onView,
  onEdit,
  onDelete,
  onViewExecutions,
  formatSmartTimestamp,
  showAgentId = false,
}: ActionCardProps) {
  const handleView = useCallback(() => onView(action), [action, onView]);
  const handleEdit = useCallback(() => onEdit(action), [action, onEdit]);
  const handleDelete = useCallback(() => onDelete(action), [action, onDelete]);
  const handleViewExecutions = useCallback(
    () => onViewExecutions(action),
    [action, onViewExecutions]
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Main info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name + Type Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-neutral-900 truncate">
              {action.name}
            </h3>
            <ActionTypeBadge type={action.actionType} />
            {!action.isActive && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                Inactive
              </span>
            )}
          </div>

          {/* Description */}
          {action.description && (
            <p className="text-sm text-neutral-600">
              {truncateText(action.description, 150)}
            </p>
          )}

          {/* Agent ID (SuperAdmin only) */}
          {showAgentId && (
            <div className="text-xs text-neutral-500">
              <span className="font-medium">Agent ID:</span>{' '}
              <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">
                {action.agentId}
              </code>
            </div>
          )}

          {/* Trigger Prompt */}
          <div className="text-xs text-neutral-500">
            <span className="font-medium">Trigger:</span>{' '}
            {truncateText(action.triggerPrompt, 100)}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getPriorityColor(
                action.priority
              )}`}
            >
              Priority: {action.priority} ({formatPriority(action.priority)})
            </span>
            <span>Created {formatSmartTimestamp(action.createdAt)}</span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleViewExecutions}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Executions"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={handleView}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
