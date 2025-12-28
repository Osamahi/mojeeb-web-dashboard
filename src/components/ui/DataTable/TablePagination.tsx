/**
 * TablePagination Component
 * Reusable table pagination controls
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <span>{t('table.rows_per_page')}</span>
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
          {t('table.previous')}
        </button>
        <span className="text-sm text-neutral-600">
          {t('table.showing_entries', { from: startIndex, to: endIndex, total: totalItems })}
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
          {t('table.next')}
        </button>
      </div>
    </div>
  );
}
