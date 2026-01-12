import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../services/pineconeTestService';
import type { PineconeUploadRequest } from '../types/pineconeTest.types';
import { toast } from 'sonner';

export function usePineconeUpload() {
  return useMutation({
    mutationFn: (request: PineconeUploadRequest) => uploadDocument(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          `Document uploaded successfully! ${data.chunks_uploaded} chunks created in ${data.duration_ms?.toFixed(0)}ms`
        );
      } else {
        toast.error(data.error || 'Upload failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}
