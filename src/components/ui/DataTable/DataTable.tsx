/**
 * DataTable Component
 * Generic reusable table with sorting, pagination, and filtering
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableSort } from '@/hooks/useTableSort';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableFilter } from '@/hooks/useTableFilter';
import { TableHeader } from './TableHeader';
import { TablePagination } from './TablePagination';
import { EmptyState } from '../EmptyState';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  /** Column key */
  key: keyof T;
  /** Column header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T) => ReactNode;
  /** Custom header render function (overrides default TableHeader) */
  headerRender?: () => ReactNode;
  /** Custom CSS classes for header */
  headerClassName?: string;
  /** Custom CSS classes for cell */
  cellClassName?: string;
  /** Column width (CSS width value) */
  width?: string;
  /** Display order for schema-driven column sorting (lower = earlier) */
  displayOrder?: number;
  /**
   * Pin this column to the end edge of the viewport (right in LTR, left in
   * RTL). Useful for an actions/menu column that should stay visible while
   * the rest of the table scrolls horizontally. Only honored when the
   * `DataTable`'s `scrollMode` is `'horizontal'`.
   */
  stickyEnd?: boolean;
}

interface DataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Unique row key field */
  rowKey: keyof T;
  /** Enable sorting */
  sortable?: boolean;
  /** Initial sort field */
  initialSortField?: keyof T;
  /** Initial sort direction */
  initialSortDirection?: 'asc' | 'desc';
  /** Enable pagination */
  paginated?: boolean;
  /** Initial rows per page */
  initialRowsPerPage?: number;
  /** Rows per page options */
  rowsPerPageOptions?: number[];
  /** Enable filtering/search */
  filterable?: boolean;
  /** Fields to search within */
  searchFields?: (keyof T)[];
  /** Empty state configuration */
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
  };
  /** Item name for pagination (e.g., "members", "users") */
  itemName?: string;
  /** Custom row className */
  rowClassName?: string;
  /** Actions column render */
  actionsColumn?: (row: T) => ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /**
   * Layout mode for the table.
   *
   *   - `'fit'` (default) — `tableLayout: fixed`, `w-full`. Columns share the
   *     viewport width and shrink/wrap to fit. Existing behavior.
   *   - `'horizontal'` — `tableLayout: auto`, `min-w-max`, single-line cells.
   *     Table sizes to its natural content width and the inner `overflow-x-auto`
   *     wrapper provides horizontal scroll on narrow viewports. Stripe-style.
   */
  scrollMode?: 'fit' | 'horizontal';
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  sortable = true,
  initialSortField,
  initialSortDirection = 'desc',
  paginated = true,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  filterable = false,
  searchFields = [],
  emptyState,
  itemName = 'items',
  rowClassName = '',
  actionsColumn,
  onRowClick,
  scrollMode = 'fit',
}: DataTableProps<T>) {
  const isHorizontal = scrollMode === 'horizontal';
  const { t } = useTranslation();
  // Filtering
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
  } = useTableFilter(data, { searchFields });

  // Sorting
  const {
    sortedData,
    sortConfig,
    handleSort,
  } = useTableSort(filteredData, {
    initialSortField,
    initialSortDirection,
  });

  // Pagination
  const {
    paginatedData,
    currentPage,
    rowsPerPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    handleRowsPerPageChange,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
  } = useTablePagination(sortedData, {
    initialRowsPerPage,
    rowsPerPageOptions,
  });

  const displayData = paginated ? paginatedData : sortedData;

  // Empty state
  if (filteredData.length === 0) {
    return (
      <EmptyState
        icon={emptyState?.icon || <Search className="w-12 h-12 text-neutral-400" />}
        title={emptyState?.title || t('data_table.no_items_found', { itemName })}
        description={emptyState?.description}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search (if filterable) */}
      {filterable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('data_table.search_placeholder', { itemName })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb w-full max-w-md"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table
            // In horizontal mode the table sizes to the larger of its natural
            // content width and the container width — `min-w-max` lets it
            // scroll horizontally on narrow viewports, `w-full` makes it fill
            // the container when content is narrower (so the sticky-end
            // actions column pins to the page's right edge without leaving a
            // gap). The two together resolve to: shrink to container width,
            // but never below natural content width.
            className={cn(isHorizontal ? 'w-full min-w-max' : 'w-full')}
            style={{ tableLayout: isHorizontal ? 'auto' : 'fixed' }}
          >
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="group/header">
                {columns.map((column) => {
                  // In horizontal-scroll mode, a column can opt to "stick" to
                  // the end edge so it stays visible while the rest scrolls.
                  // We attach the sticky positioning + a left-edge box-shadow
                  // so the pinned column reads as overlaying scrolling content.
                  const stickyHeader =
                    isHorizontal && column.stickyEnd
                      ? 'sticky end-0 z-20 bg-neutral-50 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)]'
                      : '';
                  return column.headerRender ? (
                    <th
                      key={String(column.key)}
                      className={cn(
                        isHorizontal
                          ? 'px-4 py-3 text-start text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis'
                          : 'px-6 py-3 text-start text-xs font-semibold text-neutral-700 uppercase tracking-wider',
                        stickyHeader,
                        column.headerClassName,
                      )}
                      style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                    >
                      {column.headerRender()}
                    </th>
                  ) : (
                    <TableHeader
                      key={String(column.key)}
                      field={column.key}
                      label={column.label}
                      sortable={sortable && column.sortable !== false}
                      sortField={sortConfig?.field}
                      sortDirection={sortConfig?.direction}
                      onSort={handleSort}
                      className={cn(
                        isHorizontal && 'px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis',
                        stickyHeader,
                        column.headerClassName,
                      )}
                      style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                    />
                  );
                })}
                {actionsColumn && (
                  <TableHeader
                    label={t('data_table.actions')}
                    sortable={false}
                    style={{ width: '120px' }}
                  />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {displayData.map((row) => (
                <tr
                  key={String(row[rowKey])}
                  className={cn(
                    'group/row hover:bg-neutral-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    rowClassName,
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => {
                    // Sticky body cells need a solid bg so scrolling content
                    // doesn't show through them. Hover background is preserved
                    // by lifting it onto the <tr>'s `group` hover (handled via
                    // the row hover class) — to keep this simple here, the
                    // cell's own bg-white wins until the row matches.
                    const stickyCell =
                      isHorizontal && column.stickyEnd
                        ? 'sticky end-0 z-10 bg-white group-hover/row:bg-neutral-50 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)]'
                        : '';
                    return (
                      <td
                        key={String(column.key)}
                        className={cn(
                          // Tighter Stripe-style padding in horizontal mode,
                          // generous default elsewhere.
                          isHorizontal ? 'px-4 py-3 align-top' : 'px-6 py-4',
                          stickyCell,
                          column.cellClassName,
                        )}
                        style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '-')}
                      </td>
                    );
                  })}
                  {actionsColumn && (
                    <td className="px-6 py-4 whitespace-nowrap" style={{ width: '120px' }}>
                      {actionsColumn(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginated && filteredData.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            itemName={itemName}
            onRowsPerPageChange={handleRowsPerPageChange}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
          />
        )}
      </div>
    </div>
  );
}
