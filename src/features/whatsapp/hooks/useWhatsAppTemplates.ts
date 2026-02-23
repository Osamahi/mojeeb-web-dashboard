/**
 * WhatsApp Templates Hook
 * Custom hook for fetching and managing WhatsApp message templates
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { whatsappService } from '../services/whatsappService';
import type { SendTemplateRequest } from '../types/whatsapp.types';

export const WHATSAPP_QUERY_KEYS = {
  templates: (connectionId: string) => ['whatsapp', 'templates', connectionId] as const,
};

/**
 * Hook to fetch message templates
 * SECURITY: Access token retrieved from backend using connectionId
 */
export function useWhatsAppTemplates(connectionId?: string) {
  return useQuery({
    queryKey: WHATSAPP_QUERY_KEYS.templates(connectionId || ''),
    queryFn: () => {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }
      return whatsappService.getTemplates(connectionId);
    },
    enabled: !!connectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to send a template message
 * SECURITY: Uses connectionId for credential retrieval, no access token exposed
 */
export function useSendTemplate() {
  return useMutation({
    mutationFn: ({
      connectionId,
      request,
    }: {
      connectionId: string;
      request: SendTemplateRequest;
    }) => whatsappService.sendTemplate(connectionId, request),
  });
}
