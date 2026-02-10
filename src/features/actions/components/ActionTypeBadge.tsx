/**
 * Badge component for displaying action type
 */

import type { ActionType } from '../types';
import { formatActionType, getActionTypeColor } from '../utils/formatting';

interface ActionTypeBadgeProps {
  type: ActionType;
  className?: string;
}

export function ActionTypeBadge({ type, className = '' }: ActionTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionTypeColor(
        type
      )} ${className}`}
    >
      {formatActionType(type)}
    </span>
  );
}
