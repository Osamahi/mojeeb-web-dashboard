/**
 * Saved Messages — React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isToastHandled } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { savedMessagesService } from '../services/savedMessagesService';
import type {
  CreateSavedMessageRequest,
  SavedMessage,
  UpdateSavedMessageRequest,
} from '../types/savedMessages.types';

export function useSavedMessages(agentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.savedMessages(agentId),
    queryFn: () => savedMessagesService.list(agentId!),
    enabled: !!agentId,
    // Cache is invalidated on create/update/delete via setQueryData below,
    // so the list never goes stale during a session unless the user mutates it.
    staleTime: Infinity,
  });
}

export function useCreateSavedMessage(agentId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreateSavedMessageRequest) =>
      savedMessagesService.create(agentId!, payload),
    onSuccess: (created) => {
      queryClient.setQueryData<SavedMessage[]>(
        queryKeys.savedMessages(agentId),
        (prev) => (prev ? [...prev, created] : [created])
      );
      toast.success(t('saved_messages.create_success'));
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        const msg = (error as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error
          ?? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? t('saved_messages.create_error');
        toast.error(msg);
      }
    },
  });
}

export function useUpdateSavedMessage(agentId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSavedMessageRequest }) =>
      savedMessagesService.update(agentId!, id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<SavedMessage[]>(
        queryKeys.savedMessages(agentId),
        (prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? [updated]
      );
      toast.success(t('saved_messages.update_success'));
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        const msg = (error as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error
          ?? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? t('saved_messages.update_error');
        toast.error(msg);
      }
    },
  });
}

export function useDeleteSavedMessage(agentId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => savedMessagesService.remove(agentId!, id),
    onSuccess: (_void, id) => {
      queryClient.setQueryData<SavedMessage[]>(
        queryKeys.savedMessages(agentId),
        (prev) => prev?.filter((m) => m.id !== id) ?? []
      );
      toast.success(t('saved_messages.delete_success'));
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        toast.error(t('saved_messages.delete_error'));
      }
    },
  });
}
