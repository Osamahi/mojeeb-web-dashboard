/**
 * Pinecone upload job status types
 * Matches backend PineconeUploadJobStatus constants
 */
export type PineconeUploadJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Pinecone upload job processing steps
 * Matches backend PineconeUploadJobStep constants
 */
export type PineconeUploadJobStep =
  | 'chunking'
  | 'generating_embeddings'
  | 'uploading_batches'
  | 'completed';

/**
 * Pinecone upload job entity
 * Matches backend PineconeUploadJob model
 */
export interface PineconeUploadJob {
  id: string;
  userId: string;
  agentId: string;
  fileName: string;
  fileSize: number;
  textLength: number;
  status: PineconeUploadJobStatus;
  progressPercentage: number;
  currentStep?: PineconeUploadJobStep;
  chunkCount?: number;
  batchCount?: number;
  resultJson?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

/**
 * Response from creating a new Pinecone upload job
 * Matches backend PineconeUploadJobCreatedDto
 */
export interface PineconeUploadJobCreatedDto {
  jobId: string;
  status: PineconeUploadJobStatus;
  statusUrl: string;
  pollInterval: number;
}

/**
 * Request to upload document to Pinecone
 * Backend will extract text from the file using DocumentParserService
 */
export interface PineconeUploadRequest {
  agentId: string;
  file: File;
}

/**
 * API response wrapper for job creation
 */
export interface PineconeUploadJobCreatedResponse {
  success: boolean;
  message: string;
  data: PineconeUploadJobCreatedDto;
}

/**
 * API response wrapper for job status
 */
export interface PineconeUploadJobStatusResponse {
  success: boolean;
  data: {
    jobId: string;
    fileName: string;
    status: PineconeUploadJobStatus;
    progressPercentage: number;
    currentStep?: PineconeUploadJobStep;
    chunkCount?: number;
    batchCount?: number;
    resultJson?: string;
    errorMessage?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
  };
}

/**
 * Helper function to get status badge color
 */
export function getStatusColor(status: PineconeUploadJobStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'cancelled':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Helper function to get human-readable step name
 */
export function getStepLabel(step?: PineconeUploadJobStep): string {
  if (!step) return 'Initializing...';

  switch (step) {
    case 'chunking':
      return 'Chunking text...';
    case 'generating_embeddings':
      return 'Generating embeddings...';
    case 'uploading_batches':
      return 'Uploading to Pinecone...';
    case 'completed':
      return 'Upload complete';
    default:
      return 'Processing...';
  }
}
