/**
 * useTableSort Hook
 * Reusable table sorting logic with TypeScript generics
 */

import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

interface UseTableSortOptions<T> {
  /** Initial field to sort by */
  initialSortField?: keyof T;
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
}

interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export function useTableSort<T>(
  data: T[],
  options: UseTableSortOptions<T> = {}
) {
  const {
    initialSortField,
    initialSortDirection = 'desc',
  } = options;

  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    initialSortField
      ? { field: initialSortField, direction: initialSortDirection }
      : null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const { field, direction } = sortConfig;
    const result = [...data];

    result.sort((a, b) => {
      let aValue: any = a[field];
      let bValue: any = b[field];

      // Handle nulls and undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle dates
      if (aValue instanceof Date || (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))) {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();

        // Handle invalid dates
        if (isNaN(aDate)) return 1;
        if (isNaN(bDate)) return -1;

        aValue = aDate;
        bValue = bDate;
      } else {
        // String comparison (case-insensitive)
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [data, sortConfig]);

  const handleSort = (field: keyof T) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        // Toggle direction if same field
        return {
          field,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      } else {
        // New field, default to ascending
        return { field, direction: 'asc' };
      }
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}
