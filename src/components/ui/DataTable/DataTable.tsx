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

export interface ColumnDef<T> {
  /** Column key */
  key: keyof T;
  /** Column header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T) => ReactNode;
  /** Custom CSS classes for header */
  headerClassName?: string;
  /** Custom CSS classes for cell */
  cellClassName?: string;
  /** Column width (CSS width value) */
  width?: string;
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
}: DataTableProps<T>) {
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
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan w-full max-w-md"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map((column) => (
                  <TableHeader
                    key={String(column.key)}
                    field={column.key}
                    label={column.label}
                    sortable={sortable && column.sortable !== false}
                    sortField={sortConfig?.field}
                    sortDirection={sortConfig?.direction}
                    onSort={handleSort}
                    className={column.headerClassName}
                    style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                  />
                ))}
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
                  className={`hover:bg-neutral-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 ${column.cellClassName || ''}`}
                      style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')}
                    </td>
                  ))}
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
