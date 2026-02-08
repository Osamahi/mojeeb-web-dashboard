/**
 * Shared error types for addon feature
 */

export interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}
