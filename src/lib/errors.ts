/**
 * Centralized Error Types
 * Standardized error handling across the application
 * Replaces 'any' types with proper TypeScript error interfaces
 */

import { AxiosError } from 'axios';

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * API/Network errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message, code, statusCode, details);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const message = error.response?.data?.message || error.message || 'An API error occurred';
    const statusCode = error.response?.status || 500;
    const code = error.code;
    const details = error.response?.data;

    return new ApiError(message, statusCode, code, details);
  }
}

/**
 * Authentication errors
 */
export class AuthError extends AppError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, code, 401, details);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, fields);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network/Connection errors
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network connection error', details?: unknown) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Not Found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Type guard to check if error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe error message extraction
 * Handles any error type and returns a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An API error occurred';
  }

  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Convert unknown error to AppError
 * Useful for consistent error handling in catch blocks
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isAxiosError(error)) {
    return ApiError.fromAxiosError(error);
  }

  if (isError(error)) {
    return new AppError(error.message);
  }

  if (typeof error === 'string') {
    return new AppError(error);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, error);
}

/**
 * Error response type from API
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * Retry error - used in retry logic
 */
export interface RetryError extends Error {
  attemptNumber?: number;
  maxAttempts?: number;
  lastError?: Error;
}

/**
 * Type for catch block errors
 * Use this instead of 'any' in catch blocks
 */
export type CatchError = Error | AxiosError | AppError | unknown;
