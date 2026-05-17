import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { isToastHandled } from '@/lib/errors';
import { captureLeadFromConversation } from '../services/conversationApi';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Admin-triggered lead capture. Calls the backend endpoint that re-runs Gemini
 * narrowed to the capture_lead tool and routes the result through the same
 * action queue Gemini uses for auto-captures — so the lead appears via the
 * normal realtime channel.
 *
 * Endpoint is async (202 Accepted): we invalidate both conversations and leads
 * after a short delay so the queue has time to process. Realtime will also
 * surface the row, this is a belt-and-braces refresh.
 */
export function useCaptureLeadFromConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: captureLeadFromConversation,

    onSuccess: (_data, conversationId) => {
      toast.success(t('conversations.lead_capture_queued'));

      // Invalidate the single-conversation cache so ChatPanel re-fetches the
      // refreshed triggered_actions chip; realtime will also fire this, but the
      // explicit invalidation closes the timing window between 202-accepted and
      // queue completion.
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });

      if (agentId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(agentId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      }
    },

    onError: (error: unknown) => {
      if (isToastHandled(error)) return;
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message = error.response?.data?.error ?? error.response?.data?.message;
        if (status === 400) {
          toast.error(message || t('conversations.lead_capture_unavailable'));
        } else if (status === 404) {
          toast.error(t('conversations.lead_capture_not_found'));
        } else {
          toast.error(message || t('conversations.lead_capture_failed'));
        }
      } else {
        toast.error(t('conversations.lead_capture_failed'));
      }
    },
  });
}
