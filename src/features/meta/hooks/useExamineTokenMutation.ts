/**
 * TanStack Query mutation hook for examining Meta access tokens.
 * SuperAdmin-only functionality.
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { metaTokenService } from '../services/metaTokenService';
import type { TokenExaminationResult } from '../types/metaToken.types';

export function useExamineTokenMutation() {
  return useMutation({
    mutationFn: (token: string): Promise<TokenExaminationResult> =>
      metaTokenService.examineToken(token),
    onSuccess: (data) => {
      if (data.basicInfo?.isValid) {
        toast.success('Token examined successfully');
      } else {
        toast.warning('Token is invalid or expired');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to examine token: ${error.message}`);
    },
  });
}
