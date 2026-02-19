/**
 * React Query Hooks for Custom Field Schema Management
 * Following TanStack Query patterns from the Mojeeb project
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getCustomFieldSchemas,
  getTableCustomFieldSchemas,
  createCustomFieldSchema,
  updateCustomFieldSchema,
  deleteCustomFieldSchema,
  reorderCustomFieldSchemas,
} from '../services/customFieldSchemaService';
import type {
  CustomFieldSchema,
  CreateCustomFieldSchemaRequest,
  UpdateCustomFieldSchemaRequest,
  ReorderCustomFieldSchemasRequest,
} from '../types/customFieldSchema.types';

// Query keys
export const customFieldSchemaKeys = {
  all: (agentId: string) => ['custom-field-schemas', agentId] as const,
  table: (agentId: string) => ['custom-field-schemas', agentId, 'table'] as const,
};

/**
 * Hook to fetch all custom field schemas for the current agent
 */
export const useCustomFieldSchemas = () => {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: customFieldSchemaKeys.all(agentId || ''),
    queryFn: () => getCustomFieldSchemas(agentId!),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch table-visible custom field schemas
 */
export const useTableCustomFieldSchemas = () => {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: customFieldSchemaKeys.table(agentId || ''),
    queryFn: () => getTableCustomFieldSchemas(agentId!),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new custom field schema
 */
export const useCreateCustomFieldSchema = () => {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateCustomFieldSchemaRequest) =>
      createCustomFieldSchema(agentId!, data),
    onSuccess: () => {
      // Invalidate all schema queries
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success(t('leads.custom_field_created'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || t('leads.custom_field_create_failed');
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to update an existing custom field schema
 */
export const useUpdateCustomFieldSchema = () => {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ schemaId, data }: { schemaId: string; data: UpdateCustomFieldSchemaRequest }) =>
      updateCustomFieldSchema(agentId!, schemaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success(t('leads.custom_field_updated'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || t('leads.custom_field_update_failed');
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to delete a custom field schema
 */
export const useDeleteCustomFieldSchema = () => {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (schemaId: string) => deleteCustomFieldSchema(agentId!, schemaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success(t('leads.custom_field_deleted'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || t('leads.custom_field_delete_failed');
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to fetch schemas where show_in_form === true (for AddLeadModal / edit forms)
 * Returns both system and custom schemas in display_order
 */
export const useFormCustomFieldSchemas = () => {
  const { data: schemas = [], ...rest } = useCustomFieldSchemas();

  const formSchemas = schemas.filter(
    (s: CustomFieldSchema) => s.show_in_form
  );

  return { data: formSchemas, ...rest };
};

/**
 * Hook to reorder custom field schemas
 */
export const useReorderCustomFieldSchemas = () => {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ReorderCustomFieldSchemasRequest) =>
      reorderCustomFieldSchemas(agentId!, data),
    onMutate: async (newOrder) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });

      const previousSchemas = queryClient.getQueryData<CustomFieldSchema[]>(
        customFieldSchemaKeys.all(agentId!)
      );

      if (previousSchemas) {
        const reorderedSchemas = newOrder.schema_ids.map((id, index) => {
          const schema = previousSchemas.find(s => s.id === id);
          return schema ? { ...schema, display_order: index } : null;
        }).filter(Boolean) as CustomFieldSchema[];

        queryClient.setQueryData(customFieldSchemaKeys.all(agentId!), reorderedSchemas);
      }

      return { previousSchemas };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousSchemas) {
        queryClient.setQueryData(
          customFieldSchemaKeys.all(agentId!),
          context.previousSchemas
        );
      }
      toast.error(t('leads.custom_field_reorder_failed'));
    },
    onSuccess: () => {
      toast.success(t('leads.custom_field_reordered'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
    },
  });
};
