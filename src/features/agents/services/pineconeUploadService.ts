import api from '@/lib/api';
import type {
  PineconeUploadJobCreatedDto,
  PineconeUploadJob,
  PineconeUploadRequest,
  PineconeUploadJobCreatedResponse,
  PineconeUploadJobStatusResponse,
} from '../types/pineconeUpload.types';

// API Response Types (snake_case from backend)
interface ApiPineconeJobCreatedResponse {
  job_id: string;
  status: string;
  status_url: string;
  poll_interval: number;
}

interface ApiPineconeJobStatusResponse {
  job_id: string;
  file_name: string;
  status: string;
  progress_percentage: number;
  current_step?: string;
  chunk_count?: number;
  batch_count?: number;
  result_json?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class PineconeUploadService {
  /**
   * Transform job created response from snake_case to camelCase
   */
  private transformJobCreated(apiJob: ApiPineconeJobCreatedResponse): PineconeUploadJobCreatedDto {
    return {
      jobId: apiJob.job_id,
      status: apiJob.status as PineconeUploadJobCreatedDto['status'],
      statusUrl: apiJob.status_url,
      pollInterval: apiJob.poll_interval,
    };
  }

  /**
   * Transform job status response from snake_case to camelCase
   */
  private transformJob(apiJob: ApiPineconeJobStatusResponse): PineconeUploadJob {
    return {
      id: apiJob.job_id,
      userId: '', // Not needed for frontend display
      agentId: '', // Not needed for frontend display
      fileName: apiJob.file_name,
      fileSize: 0, // Not returned by status endpoint
      textLength: 0, // Not returned by status endpoint
      status: apiJob.status as PineconeUploadJob['status'],
      progressPercentage: apiJob.progress_percentage,
      currentStep: apiJob.current_step as PineconeUploadJob['currentStep'],
      chunkCount: apiJob.chunk_count,
      batchCount: apiJob.batch_count,
      resultJson: apiJob.result_json,
      errorMessage: apiJob.error_message,
      retryCount: 0, // Not returned by status endpoint
      maxRetries: 3, // Not returned by status endpoint
      createdAt: apiJob.created_at,
      updatedAt: '', // Not returned by status endpoint
      startedAt: apiJob.started_at,
      completedAt: apiJob.completed_at,
      expiresAt: '', // Not returned by status endpoint
    };
  }

  /**
   * Upload document to Pinecone asynchronously
   * Returns job ID for progress tracking via Supabase Realtime
   */
  async uploadDocument(request: PineconeUploadRequest): Promise<PineconeUploadJobCreatedDto> {
    // Create FormData to send file to backend for extraction
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('agentId', request.agentId);

    const { data } = await api.post<ApiResponse<ApiPineconeJobCreatedResponse>>(
      '/api/pineconetest/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return this.transformJobCreated(data.data);
  }

  /**
   * Get Pinecone upload job status
   * Note: Prefer using Supabase Realtime subscriptions instead of polling
   */
  async getPineconeJob(jobId: string): Promise<PineconeUploadJob> {
    const { data } = await api.get<ApiResponse<ApiPineconeJobStatusResponse>>(
      `/api/pineconetest/jobs/${jobId}`
    );

    return this.transformJob(data.data);
  }
}

export const pineconeUploadService = new PineconeUploadService();
