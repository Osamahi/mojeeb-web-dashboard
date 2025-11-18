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
  /** Preview text to show when collapsed */
  preview?: string;
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
  preview,
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
    <div className={`space-y-4 ${className}`}>
      {/* Header - Clickable to expand/collapse */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity group flex-1 text-left"
          aria-expanded={isExpanded}
          aria-controls={`collapsible-content-${id}`}
        >
          {/* Chevron Icon - Rotates on expand/collapse */}
          <ChevronDown
            className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ease-in-out flex-shrink-0 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />

          {/* Optional Icon */}
          {icon && <div className="text-neutral-600 flex-shrink-0">{icon}</div>}

          {/* Title and Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
              {/* Optional Count Badge */}
              {count !== undefined && (
                <span className="text-sm text-neutral-500">({count})</span>
              )}
            </div>
            {/* Preview text when collapsed */}
            {!isExpanded && preview && (
              <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                {preview}
              </p>
            )}
          </div>
        </button>

        {/* Optional Actions (e.g., "+ Add KB") */}
        {actions && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* Content - Expandable */}
      {isExpanded && (
        <div
          id={`collapsible-content-${id}`}
          className="animate-in slide-in-from-top-2 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  );
}
