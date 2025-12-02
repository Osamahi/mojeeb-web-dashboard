/**
 * Document Job Notification Utilities
 * Centralized toast notifications for document processing job status changes
 */

import { toast } from 'sonner';
import type { DocumentJobStatus } from '../types/agent.types';

/**
 * Show toast notification based on document job status change
 * @param status - The new job status
 * @param fileName - The document file name
 */
export const notifyJobStatusChange = (status: DocumentJobStatus, fileName: string): void => {
  if (status === 'completed') {
    toast.success(`Document "${fileName}" processed successfully!`);
  } else if (status === 'failed') {
    toast.error(`Document "${fileName}" processing failed`);
  }
};
