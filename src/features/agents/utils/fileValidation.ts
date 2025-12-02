/**
 * File Validation Utilities
 * Reusable validation logic for document file uploads
 */

import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  FILE_VALIDATION_ERRORS,
} from '../constants/fileValidation';

/**
 * Result of file validation
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a document file for size and type restrictions
 * @param file - The File object to validate
 * @returns Validation result with error message if invalid
 */
export const validateDocumentFile = (file: File): FileValidationResult => {
  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: FILE_VALIDATION_ERRORS.SIZE,
    };
  }

  // Validate file type by MIME type and extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const isValidType = ALLOWED_FILE_TYPES.includes(file.type as any);
  const isValidExtension = ALLOWED_FILE_EXTENSIONS.includes(fileExtension as any);

  if (!isValidType && !isValidExtension) {
    return {
      isValid: false,
      error: FILE_VALIDATION_ERRORS.TYPE,
    };
  }

  return { isValid: true };
};
