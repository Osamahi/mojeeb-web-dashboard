/**
 * TablePagination Component
 * Reusable table pagination controls
 */

import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemName?: string;
  onRowsPerPageChange: (value: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  rowsPerPageOptions,
  startIndex,
  endIndex,
  totalItems,
  itemName = 'items',
  onRowsPerPageChange,
  onPreviousPage,
  onNextPage,
  canGoPrevious,
  canGoNext,
}: TablePaginationProps) {
  return (
    <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
          className={cn(
            'px-3 py-1 rounded border transition-colors',
            !canGoPrevious
              ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          )}
        >
          Previous
        </button>
        <span className="text-sm text-neutral-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={!canGoNext}
          className={cn(
            'px-3 py-1 rounded border transition-colors',
            !canGoNext
              ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
