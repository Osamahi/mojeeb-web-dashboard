/**
 * File Validation Constants
 * Defines allowed file types, sizes, and error messages for document uploads
 */

/**
 * Maximum file size in megabytes
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/vnd.ms-excel',                                                // .xls
] as const;

/**
 * Allowed file extensions for document uploads
 */
export const ALLOWED_FILE_EXTENSIONS = ['.txt', '.pdf', '.docx', '.csv', '.xlsx', '.xls'] as const;

/**
 * User-friendly error messages for file validation failures
 */
export const FILE_VALIDATION_ERRORS = {
  SIZE: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`,
  TYPE: 'Invalid file type. Please upload a TXT, PDF, DOCX, CSV, or Excel file.',
} as const;
