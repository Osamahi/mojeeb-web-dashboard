/**
 * TableHeader Component
 * Reusable sortable table header cell
 */

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from '@/hooks/useTableSort';
import { cn } from '@/lib/utils';

interface TableHeaderProps<T> {
  /** Column field key */
  field?: keyof T;
  /** Column label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Current sort field */
  sortField?: keyof T | null;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort handler */
  onSort?: (field: keyof T) => void;
  /** Additional CSS classes */
  className?: string;
}

export function TableHeader<T>({
  field,
  label,
  sortable = false,
  sortField,
  sortDirection,
  onSort,
  className,
}: TableHeaderProps<T>) {
  const isSorted = field && sortField === field;

  const handleClick = () => {
    if (sortable && field && onSort) {
      onSort(field);
    }
  };

  const getSortIcon = () => {
    if (!sortable) return null;

    if (!isSorted) {
      return <ChevronsUpDown className="w-4 h-4 text-neutral-400" />;
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-neutral-700" />
    ) : (
      <ChevronDown className="w-4 h-4 text-neutral-700" />
    );
  };

  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-neutral-100',
        className
      )}
      onClick={handleClick}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {label}
          {getSortIcon()}
        </div>
      ) : (
        label
      )}
    </th>
  );
}
