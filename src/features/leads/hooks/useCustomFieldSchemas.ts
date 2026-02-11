/**
 * React Query Hooks for Custom Field Schema Management
 * Following TanStack Query patterns from the Mojeeb project
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { toast } from 'sonner';
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
    queryFn: () => {
      console.log('[useCustomFieldSchemas] Fetching schemas for agentId:', agentId);
      return getCustomFieldSchemas(agentId!);
    },
    enabled: !!agentId,
    staleTime: 0, // Always fetch fresh data (was 5 minutes - causing cache issue)
    gcTime: 0, // Don't cache (for debugging)
    refetchOnMount: true, // Always refetch when component mounts
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

  return useMutation({
    mutationFn: (data: CreateCustomFieldSchemaRequest) =>
      createCustomFieldSchema(agentId!, data),
    onSuccess: () => {
      // Invalidate all schema queries
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success('Custom field created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to create custom field';
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

  return useMutation({
    mutationFn: ({ schemaId, data }: { schemaId: string; data: UpdateCustomFieldSchemaRequest }) =>
      updateCustomFieldSchema(agentId!, schemaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success('Custom field updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to update custom field';
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

  return useMutation({
    mutationFn: (schemaId: string) => deleteCustomFieldSchema(agentId!, schemaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.table(agentId!) });
      toast.success('Custom field deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to delete custom field';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to reorder custom field schemas
 */
export const useReorderCustomFieldSchemas = () => {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

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
      toast.error('Failed to reorder custom fields');
    },
    onSuccess: () => {
      toast.success('Custom fields reordered successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId!) });
    },
  });
};
