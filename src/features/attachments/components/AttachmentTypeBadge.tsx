/**
 * Color-coded badge for attachment types
 */

import { memo } from 'react';
import type { AttachmentType } from '../types/attachment.types';
import { formatAttachmentType, getAttachmentTypeColor } from '../utils/formatting';

interface AttachmentTypeBadgeProps {
  type: AttachmentType;
}

export const AttachmentTypeBadge = memo(function AttachmentTypeBadge({ type }: AttachmentTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAttachmentTypeColor(type)}`}
    >
      {formatAttachmentType(type)}
    </span>
  );
});
