/**
 * Formatting utilities for displaying action data
 */

import type { ActionType } from '../types';

/**
 * Format action type for display
 */
export function formatActionType(type: ActionType): string {
  const labels: Record<ActionType, string> = {
    api_call: 'API Call',
    webhook: 'Webhook',
    database: 'Database',
    email: 'Email',
    sms: 'SMS',
  };
  return labels[type] || type;
}

/**
 * Get color class for action type badge
 */
export function getActionTypeColor(type: ActionType): string {
  const colors: Record<ActionType, string> = {
    api_call: 'bg-blue-100 text-blue-700 border-blue-200',
    webhook: 'bg-purple-100 text-purple-700 border-purple-200',
    database: 'bg-green-100 text-green-700 border-green-200',
    email: 'bg-orange-100 text-orange-700 border-orange-200',
    sms: 'bg-pink-100 text-pink-700 border-pink-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Format execution status for display
 */
export function formatExecutionStatus(status: 'success' | 'failed' | 'pending'): string {
  const labels: Record<string, string> = {
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending',
  };
  return labels[status] || status;
}

/**
 * Get color class for execution status badge
 */
export function getExecutionStatusColor(status: 'success' | 'failed' | 'pending'): string {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Format execution time in milliseconds to human-readable format
 */
export function formatExecutionTime(ms: number | null): string {
  if (ms === null || ms === undefined) return 'N/A';

  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format JSON for display (pretty print)
 */
export function formatJson(obj: Record<string, any> | null): string {
  if (!obj) return 'N/A';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return 'Invalid JSON';
  }
}

/**
 * Format priority for display
 */
export function formatPriority(priority: number): string {
  if (priority >= 900) return 'Critical';
  if (priority >= 700) return 'High';
  if (priority >= 400) return 'Medium';
  if (priority >= 100) return 'Low';
  return 'Very Low';
}

/**
 * Get color class for priority badge
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 900) return 'bg-red-100 text-red-700 border-red-200';
  if (priority >= 700) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (priority >= 400) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (priority >= 100) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}
