/**
 * Collapsible Section Component
 * Reusable accordion section with smooth animations
 * Follows minimal design system
 */

import { ReactNode, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  /** Unique ID for localStorage persistence */
  id: string;
  /** Section title */
  title: string;
  /** Optional icon to display before title */
  icon?: ReactNode;
  /** Optional count badge (e.g., "(4)") */
  count?: number;
  /** Optional actions to show on the right side of header */
  actions?: ReactNode;
  /** Content to show when expanded */
  children: ReactNode;
  /** Default expanded state (if no localStorage value exists) */
  defaultExpanded?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

export function CollapsibleSection({
  id,
  title,
  icon,
  count,
  actions,
  children,
  defaultExpanded = true,
  className = '',
}: CollapsibleSectionProps) {
  // Load initial state from localStorage or use default
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(`collapsible-${id}`);
    return stored !== null ? stored === 'true' : defaultExpanded;
  });

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(`collapsible-${id}`, String(isExpanded));
  }, [id, isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Header - Clickable */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${id}`}
      >
        <div className="flex items-center gap-3">
          {/* Chevron Icon - Rotates on expand/collapse */}
          <ChevronDown
            className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ease-in-out ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />

          {/* Optional Icon */}
          {icon && <div className="text-neutral-600">{icon}</div>}

          {/* Title */}
          <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>

          {/* Optional Count Badge */}
          {count !== undefined && (
            <span className="text-sm text-neutral-500">({count})</span>
          )}
        </div>

        {/* Optional Actions (only show when expanded or if critical) */}
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </button>

      {/* Content - Expandable */}
      <div
        id={`collapsible-content-${id}`}
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          overflow: isExpanded ? 'visible' : 'hidden',
        }}
      >
        <div className="p-4 pt-0 border-t border-neutral-100">{children}</div>
      </div>
    </div>
  );
}
