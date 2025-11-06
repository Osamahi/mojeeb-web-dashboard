/**
 * useTablePagination Hook
 * Reusable table pagination logic
 */

import { useState, useMemo } from 'react';

interface UseTablePaginationOptions {
  /** Initial rows per page */
  initialRowsPerPage?: number;
  /** Available rows per page options */
  rowsPerPageOptions?: number[];
}

export function useTablePagination<T>(
  data: T[],
  options: UseTablePaginationOptions = {}
) {
  const {
    initialRowsPerPage = 10,
    rowsPerPageOptions = [10, 25, 50],
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, rowsPerPage]);

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, data.length);

  return {
    paginatedData,
    currentPage,
    rowsPerPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems: data.length,
    rowsPerPageOptions,
    handleRowsPerPageChange,
    handlePageChange,
    goToNextPage,
    goToPreviousPage,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
  };
}
