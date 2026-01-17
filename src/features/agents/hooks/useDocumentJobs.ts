import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { agentService } from '../services/agentService';
import type { DocumentProcessingJob, DocumentJobStatus } from '../types/agent.types';
import { toast } from 'sonner';
import { notifyJobStatusChange } from '../utils/documentJobNotifications';
import { getApiErrorMessage } from '../utils/errorHandling';
import { createDocumentJobRetryConfig } from '../utils/queryRetryConfig';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

/**
 * Database row type for document_processing_jobs table (snake_case)
 * This represents the raw Supabase Realtime payload structure
 */
interface DocumentProcessingJobRow {
  id: string;
  agent_id: string;
  status: DocumentJobStatus;
  progress: number;
  current_step: string | null;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

/**
 * Hook for uploading a document asynchronously and getting the job ID.
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadDocumentAsync();
 *
 * const handleFileUpload = async (file: File) => {
 *   const job = await uploadMutation.mutateAsync(file);
 *   console.log('Job created:', job.jobId);
 * };
 * ```
 */
export function useUploadDocumentAsync() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      return agentService.uploadDocumentAsync(agentId, file);
    },
    onSuccess: (data) => {
      // Invalidate jobs list to include the new job
      queryClient.invalidateQueries({ queryKey: queryKeys.documentJobs(agentId) });
      toast.success(`Document "${data.jobId}" is being processed...`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to upload document'));
    },
  });
}

/**
 * Hook for fetching a single document processing job with real-time updates.
 * Uses Supabase Realtime to listen for job status changes - NO POLLING!
 *
 * @param jobId - The job ID to fetch
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data: job, isLoading } = useDocumentJob(jobId);
 *
 * if (job?.status === 'completed') {
 *   console.log('Processing complete!', job.result);
 * }
 * ```
 */
export function useDocumentJob(jobId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: queryKeys.documentJob(jobId),
    queryFn: async () => {
      if (!jobId) {
        throw new Error('No job ID provided');
      }
      return agentService.getDocumentJob(jobId);
    },
    enabled: enabled && !!jobId,
    ...createDocumentJobRetryConfig([404, 401, 403]),
  });

  // Real-time subscription for job updates
  useEffect(() => {
    if (!jobId || !enabled) return;

    const channel = supabase
      .channel(`document-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_processing_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          // Invalidate query to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.documentJob(jobId) });

          const newJob = payload.new as DocumentProcessingJobRow;
          if (newJob?.status === 'completed' || newJob?.status === 'failed') {
            notifyJobStatusChange(newJob.status, newJob.file_name);
            // Invalidate all job queries when job completes or fails
            queryClient.invalidateQueries({ queryKey: queryKeys.documentJobs(newJob.agent_id) });

            // Invalidate knowledge bases when job completes (new KB may have been created)
            if (newJob?.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases(newJob.agent_id) });
            }
          }
        }
      )
      .subscribe();

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `document-job-${jobId}`);

    return () => {
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [jobId, enabled, queryClient]);

  return query;
}

/**
 * Hook for fetching all document processing jobs for the current agent with real-time updates.
 * Uses Supabase Realtime to listen for job changes - NO POLLING!
 *
 * @param agentIdOverride - Optional agent ID (if not provided, uses context)
 * @param status - Optional status filter
 *
 * @example
 * ```tsx
 * // Using context
 * const { data: jobs, isLoading } = useDocumentJobs();
 *
 * // With explicit agentId
 * const { data: jobs } = useDocumentJobs('agent-123', 'processing');
 *
 * return (
 *   <div>
 *     {jobs?.map(job => (
 *       <JobCard key={job.jobId} job={job} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useDocumentJobs(agentIdOverride?: string, status?: DocumentJobStatus) {
  const { agentId: contextAgentId } = useAgentContext();
  const queryClient = useQueryClient();

  // Use override if provided, otherwise fall back to context
  const agentId = agentIdOverride || contextAgentId;

  // Initial fetch
  const query = useQuery({
    queryKey: queryKeys.documentJobs(agentId, status),
    queryFn: async () => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      return agentService.listDocumentJobs(agentId, status);
    },
    enabled: !!agentId,
    ...createDocumentJobRetryConfig([401, 403, 429]),
  });

  // Real-time subscription for all jobs for this agent
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`document-jobs-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'document_processing_jobs',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          // Invalidate query to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.documentJobs(agentId, status) });

          // Also invalidate knowledge bases in case new ones were added
          if (payload.eventType === 'UPDATE') {
            const newJob = payload.new as DocumentProcessingJobRow;
            if (newJob?.status === 'completed' || newJob?.status === 'failed') {
              notifyJobStatusChange(newJob.status, newJob.file_name);

              // Invalidate knowledge bases when job completes (new KB may have been created)
              if (newJob?.status === 'completed') {
                queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases(newJob.agent_id) });
              }
            }
          }
        }
      )
      .subscribe();

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `document-jobs-${agentId}`);

    return () => {
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [agentId, status, queryClient]);

  return query;
}

/**
 * Hook for cancelling a document processing job.
 *
 * @example
 * ```tsx
 * const cancelMutation = useCancelDocumentJob();
 *
 * const handleCancel = (jobId: string) => {
 *   cancelMutation.mutate(jobId);
 * };
 * ```
 */
export function useCancelDocumentJob() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => agentService.cancelDocumentJob(jobId),
    onSuccess: (_data, jobId) => {
      // Invalidate both the specific job and the jobs list
      queryClient.invalidateQueries({ queryKey: queryKeys.documentJob(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.documentJobs(agentId) });
      toast.success('Job cancelled successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to cancel job'));
    },
  });
}
