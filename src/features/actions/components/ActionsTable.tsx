/**
 * Table view for actions (desktop)
 * Shows actions in a structured table format with agent names
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import type { Action } from '../types';
import { ActionTypeBadge } from './ActionTypeBadge';
import {
  formatPriority,
  getPriorityColor,
  truncateText,
} from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';

interface ActionsTableProps {
  actions: Action[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onView: (action: Action) => void;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
  onViewExecutions: (action: Action) => void;
  agentNames: Record<string, string>;
}

export function ActionsTable({
  actions,
  hasMore,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  onView,
  onEdit,
  onDelete,
  onViewExecutions,
  agentNames,
}: ActionsTableProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;
  const observerTarget = useRef<HTMLDivElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = useCallback((actionId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  if (actions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
        <div className="text-neutral-500 text-sm">
          No actions found. Create your first action to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Type
              </th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Agent
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {actions.map((action) => (
              <TableRow
                key={action.id}
                action={action}
                agentName={agentNames[action.agentId] || 'Unknown Agent'}
                isSuperAdmin={isSuperAdmin}
                isExpanded={expandedRows.has(action.id)}
                onToggle={() => toggleRow(action.id)}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewExecutions={onViewExecutions}
                formatSmartTimestamp={formatSmartTimestamp}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-neutral-200">
        {actions.map((action) => (
          <MobileCard
            key={action.id}
            action={action}
            agentName={agentNames[action.agentId] || 'Unknown Agent'}
            isSuperAdmin={isSuperAdmin}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewExecutions={onViewExecutions}
            formatSmartTimestamp={formatSmartTimestamp}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 text-center border-t border-neutral-200">
          {isFetchingNextPage ? (
            <div className="text-neutral-500 text-sm">Loading more...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Table row component
interface TableRowProps {
  action: Action;
  agentName: string;
  isSuperAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onView: (action: Action) => void;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
  onViewExecutions: (action: Action) => void;
  formatSmartTimestamp: (date: string) => string;
}

function TableRow({
  action,
  agentName,
  isSuperAdmin,
  isExpanded,
  onToggle,
  onView,
  onEdit,
  onDelete,
  onViewExecutions,
  formatSmartTimestamp,
}: TableRowProps) {
  const handleView = useCallback(() => onView(action), [action, onView]);
  const handleEdit = useCallback(() => onEdit(action), [action, onEdit]);
  const handleDelete = useCallback(() => onDelete(action), [action, onDelete]);
  const handleViewExecutions = useCallback(
    () => onViewExecutions(action),
    [action, onViewExecutions]
  );

  return (
    <>
      <tr className="hover:bg-neutral-50 transition-colors">
        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-600" />
              )}
            </button>
            <span className="font-medium text-neutral-900 truncate max-w-[200px]">
              {action.name}
            </span>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <ActionTypeBadge type={action.actionType} />
        </td>

        {/* Agent (SuperAdmin only) */}
        {isSuperAdmin && (
          <td className="px-4 py-3">
            <span className="text-sm text-neutral-700">{agentName}</span>
          </td>
        )}

        {/* Description */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-600 line-clamp-2 max-w-[300px]">
            {action.description || '-'}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              action.isActive
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {action.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>

        {/* Priority */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
              action.priority
            )}`}
          >
            {action.priority}
          </span>
        </td>

        {/* Created */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-600">
            {formatSmartTimestamp(action.createdAt)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={handleViewExecutions}
              className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="View Executions"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={handleView}
              className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row - Trigger Prompt */}
      {isExpanded && (
        <tr className="bg-neutral-50">
          <td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-3">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-neutral-700">
                  Trigger Prompt:
                </span>
                <p className="text-sm text-neutral-900 mt-1 whitespace-pre-wrap">
                  {action.triggerPrompt}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Mobile card component
interface MobileCardProps {
  action: Action;
  agentName: string;
  isSuperAdmin: boolean;
  onView: (action: Action) => void;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
  onViewExecutions: (action: Action) => void;
  formatSmartTimestamp: (date: string) => string;
}

function MobileCard({
  action,
  agentName,
  isSuperAdmin,
  onView,
  onEdit,
  onDelete,
  onViewExecutions,
  formatSmartTimestamp,
}: MobileCardProps) {
  const handleView = useCallback(() => onView(action), [action, onView]);
  const handleEdit = useCallback(() => onEdit(action), [action, onEdit]);
  const handleDelete = useCallback(() => onDelete(action), [action, onDelete]);
  const handleViewExecutions = useCallback(
    () => onViewExecutions(action),
    [action, onViewExecutions]
  );

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate">
            {action.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ActionTypeBadge type={action.actionType} />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                action.isActive
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {action.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleViewExecutions}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={handleView}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="text-xs text-neutral-600 mb-2">
          <span className="font-medium">Agent:</span> {agentName}
        </div>
      )}

      {action.description && (
        <p className="text-sm text-neutral-600 mb-2">
          {truncateText(action.description, 100)}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getPriorityColor(
            action.priority
          )}`}
        >
          P{action.priority}
        </span>
        <span>{formatSmartTimestamp(action.createdAt)}</span>
      </div>
    </div>
  );
}
