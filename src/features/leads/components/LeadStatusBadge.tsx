/**
 * LeadStatusBadge Component
 * Displays lead status with color-coded minimal badge.
 * Colors and labels are driven by custom_field_schemas (field_key='status').
 */

import { useLeadStatusSchema } from '../hooks/useLeadStatusSchema';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Convert a hex color to a light background + dark text color pair.
 * E.g. #00bd6f → { bg: 'rgba(0,208,132,0.1)', text: '#00bd6f', border: 'rgba(0,208,132,0.25)' }
 */
function hexToColorSet(hex: string): { bg: string; text: string; border: string } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    bg: `rgba(${r},${g},${b},0.1)`,
    text: hex,
    border: `rgba(${r},${g},${b},0.25)`,
  };
}

export default function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
  const { getStatusLabel, getStatusColor } = useLeadStatusSchema();

  const label = getStatusLabel(status);
  const color = getStatusColor(status);
  const colors = hexToColorSet(color);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2.5 py-0.5
        text-xs font-medium
        rounded-md
        border
        ${className}
      `.trim()}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {label}
    </span>
  );
}
