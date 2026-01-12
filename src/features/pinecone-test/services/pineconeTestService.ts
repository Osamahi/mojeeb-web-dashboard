import api from '@/lib/api';
import type {
  PineconeUploadRequest,
  PineconeUploadResponse,
  PineconeSearchRequest,
  PineconeSearchResponse,
} from '../types/pineconeTest.types';

const BASE_URL = '/api/pineconetest';

/**
 * Upload a document to Pinecone (synchronous - waits for complete result)
 */
export async function uploadDocument(
  request: PineconeUploadRequest
): Promise<PineconeUploadResponse> {
  const formData = new FormData();
  formData.append('file', request.file);
  formData.append('agentId', request.agentId);

  const response = await api.post<PineconeUploadResponse>(
    `${BASE_URL}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Search documents in Pinecone
 */
export async function searchDocuments(
  request: PineconeSearchRequest
): Promise<PineconeSearchResponse> {
  const response = await api.post<PineconeSearchResponse>(
    `${BASE_URL}/search`,
    request
  );
  return response.data;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<{
  service: string;
  status: string;
  timestamp: string;
}> {
  const response = await api.get(`${BASE_URL}/health`);
  return response.data;
}
