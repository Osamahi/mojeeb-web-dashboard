/**
 * Minimal Error Alert Component
 * Used across all auth pages for consistent error display
 */

import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
  return (
    <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
      <p className="text-sm text-error">{message}</p>
    </div>
  );
};
