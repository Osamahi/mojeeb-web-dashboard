/**
 * Common API response types used across the application
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
