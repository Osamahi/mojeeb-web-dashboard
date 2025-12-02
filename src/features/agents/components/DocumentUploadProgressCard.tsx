/**
 * Document Upload Progress Card
 * Shows inline progress tracking for document processing jobs
 * Appears below knowledge base items during upload/processing
 */

import { useEffect } from 'react';
import { FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useDocumentJob } from '../hooks/useDocumentJobs';

interface DocumentUploadProgressCardProps {
  jobId: string;
  onComplete: () => void;
  onError: () => void;
}

// Duration to display success state before removing the card
const SUCCESS_DISPLAY_DURATION_MS = 1500;

export default function DocumentUploadProgressCard({
  jobId,
  onComplete,
  onError,
}: DocumentUploadProgressCardProps) {
  const { data: job } = useDocumentJob(jobId);

  // Auto-handle completion/failure
  useEffect(() => {
    if (job?.status === 'completed') {
      // Wait a moment to show success state before removing
      const timer = setTimeout(() => {
        onComplete();
      }, SUCCESS_DISPLAY_DURATION_MS);
      return () => clearTimeout(timer);
    } else if (job?.status === 'failed') {
      onError();
    }
  }, [job?.status, onComplete, onError]);

  if (!job) {
    return null;
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-neutral-600 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'completed':
        return 'Processing complete';
      case 'failed':
        return 'Processing failed';
      case 'processing':
        return job.currentStep || 'Processing document...';
      default:
        return 'Queued for processing';
    }
  };

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white transition-all duration-200"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {getStatusIcon()}

          <div className="flex-1 min-w-0">
            {/* File name */}
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-neutral-600 flex-shrink-0" />
              <span className="text-sm font-medium text-neutral-900 truncate">
                {job.fileName}
              </span>
            </div>

            {/* Status text */}
            <p className="text-xs text-neutral-600 mb-2">
              {getStatusText()}
            </p>

            {/* Progress bar */}
            {job.status !== 'completed' && job.status !== 'failed' && (
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div
                  className="bg-black h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            )}

            {/* Error message */}
            {job.status === 'failed' && job.errorMessage && (
              <p className="text-xs text-red-600 mt-2">
                {job.errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
