/**
 * WhatsApp Templates Hook
 * Custom hook for fetching and managing WhatsApp message templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 */
export function useSendTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      phoneNumberId,
      accessToken,
      request,
    }: {
      phoneNumberId: string;
      accessToken: string;
      request: SendTemplateRequest;
    }) => whatsappService.sendTemplate(phoneNumberId, accessToken, request),
    onSuccess: () => {
      // Optionally invalidate queries or show success toast
      console.log('Template message sent successfully');
    },
  });
}
