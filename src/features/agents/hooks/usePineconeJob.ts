import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { pineconeUploadService } from '../services/pineconeUploadService';
import type {
  PineconeUploadJob,
  PineconeUploadJobStatus,
  PineconeUploadRequest,
} from '../types/pineconeUpload.types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../utils/errorHandling';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

/**
 * Database row type for pinecone_upload_jobs table (snake_case)
 * This represents the raw Supabase Realtime payload structure
 */
interface PineconeUploadJobRow {
  id: string;
  user_id: string;
  agent_id: string;
  file_name: string;
  file_size: number;
  text_length: number;
  status: PineconeUploadJobStatus;
  progress_percentage: number;
  current_step: string | null;
  chunk_count: number | null;
  batch_count: number | null;
  result_json: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
}

/**
 * Hook for uploading text to Pinecone asynchronously and getting the job ID.
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadToPinecone();
 *
 * const handleUpload = async () => {
 *   const job = await uploadMutation.mutateAsync({
 *     agentId: 'agent-123',
 *     text: 'Document content...',
 *     filename: 'test.txt'
 *   });
 *   console.log('Job created:', job.jobId);
 * };
 * ```
 */
export function useUploadToPinecone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PineconeUploadRequest) => {
      return pineconeUploadService.uploadDocument(request);
    },
    onSuccess: (data, variables) => {
      // Invalidate jobs list to include the new job (if we had a list query)
      queryClient.invalidateQueries({ queryKey: queryKeys.pineconeJobs(variables.agentId) });
      toast.success(`Upload job created - processing "${variables.filename}"...`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to start Pinecone upload'));
    },
  });
}

/**
 * Hook for fetching a single Pinecone upload job with real-time updates.
 * Uses Supabase Realtime to listen for job status changes - NO POLLING!
 *
 * @param jobId - The job ID to fetch
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data: job, isLoading } = usePineconeJob(jobId);
 *
 * if (job?.status === 'completed') {
 *   console.log('Upload complete!', job.chunkCount, 'chunks uploaded');
 * }
 *
 * if (job?.status === 'processing') {
 *   console.log(`Progress: ${job.progressPercentage}% - ${job.currentStep}`);
 * }
 * ```
 */
export function usePineconeJob(jobId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: queryKeys.pineconeJob(jobId),
    queryFn: async () => {
      if (!jobId) {
        throw new Error('No job ID provided');
      }
      return pineconeUploadService.getPineconeJob(jobId);
    },
    enabled: enabled && !!jobId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (job not found) or 401 (unauthorized)
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: 1000, // 1 second between retries
  });

  // Real-time subscription for job updates
  useEffect(() => {
    if (!jobId || !enabled) return;

    const channel = supabase
      .channel(`pinecone-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pinecone_upload_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          // Invalidate query to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.pineconeJob(jobId) });

          const newJob = payload.new as PineconeUploadJobRow;
          if (newJob?.status === 'completed') {
            toast.success(`Upload complete! "${newJob.file_name}" - ${newJob.chunk_count} chunks uploaded`);
            // Invalidate all job queries when job completes or fails
            queryClient.invalidateQueries({ queryKey: queryKeys.pineconeJobs(newJob.agent_id) });
          } else if (newJob?.status === 'failed') {
            toast.error(`Upload failed: "${newJob.file_name}" - ${newJob.error_message || 'Unknown error'}`);
            queryClient.invalidateQueries({ queryKey: queryKeys.pineconeJobs(newJob.agent_id) });
          }
        }
      )
      .subscribe();

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `pinecone-job-${jobId}`);

    return () => {
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [jobId, enabled, queryClient]);

  return query;
}

/**
 * Hook for fetching all Pinecone upload jobs for an agent with real-time updates.
 * Uses Supabase Realtime to listen for job changes - NO POLLING!
 *
 * @param agentIdOverride - Optional agent ID (if not provided, uses context)
 * @param status - Optional status filter
 *
 * @example
 * ```tsx
 * // Using context
 * const { data: jobs, isLoading } = usePineconeJobs();
 *
 * // With explicit agentId
 * const { data: jobs } = usePineconeJobs('agent-123', 'processing');
 *
 * return (
 *   <div>
 *     {jobs?.map(job => (
 *       <PineconeJobCard key={job.id} job={job} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function usePineconeJobs(agentIdOverride?: string, status?: PineconeUploadJobStatus) {
  const { agentId: contextAgentId } = useAgentContext();
  const queryClient = useQueryClient();

  // Use override if provided, otherwise fall back to context
  const agentId = agentIdOverride || contextAgentId;

  // Note: This assumes there's a backend endpoint to list jobs
  // If not available yet, this can return an empty query
  const query = useQuery({
    queryKey: queryKeys.pineconeJobs(agentId, status),
    queryFn: async () => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      // TODO: Implement listPineconeJobs in service if needed
      return [] as PineconeUploadJob[];
    },
    enabled: !!agentId,
  });

  // Real-time subscription for all jobs for this agent
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`pinecone-jobs-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pinecone_upload_jobs',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          // Invalidate query to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.pineconeJobs(agentId, status) });

          if (payload.eventType === 'UPDATE') {
            const newJob = payload.new as PineconeUploadJobRow;
            if (newJob?.status === 'completed') {
              toast.success(`Upload complete! "${newJob.file_name}" - ${newJob.chunk_count} chunks`);
            } else if (newJob?.status === 'failed') {
              toast.error(`Upload failed: "${newJob.file_name}"`);
            }
          }
        }
      )
      .subscribe();

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `pinecone-jobs-${agentId}`);

    return () => {
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [agentId, status, queryClient]);

  return query;
}
