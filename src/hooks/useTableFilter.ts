/**
 * useTableFilter Hook
 * Reusable table search/filter logic
 */

import { useState, useMemo } from 'react';

interface UseTableFilterOptions<T> {
  /** Fields to search within */
  searchFields?: (keyof T)[];
}

export function useTableFilter<T>(
  data: T[],
  options: UseTableFilterOptions<T> = {}
) {
  const { searchFields = [] } = options;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || searchFields.length === 0) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, searchFields]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    hasActiveFilter: searchTerm.trim().length > 0,
  };
}
