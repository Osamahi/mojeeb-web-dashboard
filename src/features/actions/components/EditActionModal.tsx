/**
 * Modal for editing an existing action
 * Pre-populates form with current values
 */

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { useUpdateAction } from '../hooks/useMutateAction';
import { useAgentContext } from '@/hooks/useAgentContext';
import { actionTypeOptions, parseJsonSafely } from '../utils/validation';
import type { Action, UpdateActionRequest } from '../types';
import { formatJson } from '../utils/formatting';

interface EditActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
}

type FormData = {
  name: string;
  description: string;
  triggerPrompt: string;
  actionType: 'api_call' | 'webhook' | 'database' | 'email' | 'sms';
  actionConfigJson: string;
  requestExampleJson?: string;
  responseExampleJson?: string;
  responseMappingJson?: string;
  testDataJson?: string;
  sandboxOptionsJson?: string;
  isActive: boolean;
  priority: number;
};

export function EditActionModal({
  isOpen,
  onClose,
  action,
}: EditActionModalProps) {
  const { agentId } = useAgentContext();
  const updateMutation = useUpdateAction();
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  // Reset form when action changes
  useEffect(() => {
    if (action) {
      reset({
        name: action.name,
        description: action.description || '',
        triggerPrompt: action.triggerPrompt,
        actionType: action.actionType,
        actionConfigJson: formatJson(action.actionConfig),
        requestExampleJson: action.requestExample
          ? formatJson(action.requestExample)
          : '',
        responseExampleJson: action.responseExample
          ? formatJson(action.responseExample)
          : '',
        responseMappingJson: action.responseMapping
          ? formatJson(action.responseMapping)
          : '',
        testDataJson: action.testData ? formatJson(action.testData) : '',
        sandboxOptionsJson: action.sandboxOptions
          ? formatJson(action.sandboxOptions)
          : '',
        isActive: action.isActive,
        priority: action.priority,
      });
    }
  }, [action, reset]);

  const handleClose = () => {
    setJsonErrors({});
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!action) return;

    // Validate JSON fields
    const errors: Record<string, string> = {};

    const actionConfig = parseJsonSafely(data.actionConfigJson);
    if (!actionConfig) {
      errors.actionConfig = 'Invalid JSON format';
    }

    const requestExample = data.requestExampleJson
      ? parseJsonSafely(data.requestExampleJson)
      : undefined;
    if (data.requestExampleJson && !requestExample) {
      errors.requestExample = 'Invalid JSON format';
    }

    const responseExample = data.responseExampleJson
      ? parseJsonSafely(data.responseExampleJson)
      : undefined;
    if (data.responseExampleJson && !responseExample) {
      errors.responseExample = 'Invalid JSON format';
    }

    const responseMapping = data.responseMappingJson
      ? parseJsonSafely(data.responseMappingJson)
      : undefined;
    if (data.responseMappingJson && !responseMapping) {
      errors.responseMapping = 'Invalid JSON format';
    }

    const testData = data.testDataJson
      ? parseJsonSafely(data.testDataJson)
      : undefined;
    if (data.testDataJson && !testData) {
      errors.testData = 'Invalid JSON format';
    }

    const sandboxOptions = data.sandboxOptionsJson
      ? parseJsonSafely(data.sandboxOptionsJson)
      : undefined;
    if (data.sandboxOptionsJson && !sandboxOptions) {
      errors.sandboxOptions = 'Invalid JSON format';
    }

    if (Object.keys(errors).length > 0) {
      setJsonErrors(errors);
      return;
    }

    setJsonErrors({});

    const request: UpdateActionRequest = {
      name: data.name,
      description: data.description,
      triggerPrompt: data.triggerPrompt,
      actionType: data.actionType,
      actionConfig: actionConfig!,
      requestExample,
      responseExample,
      responseMapping,
      testData,
      sandboxOptions,
      isActive: data.isActive,
      priority: data.priority,
    };

    await updateMutation.mutateAsync({ actionId: action.id, request });
    handleClose();
  };

  if (!action) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Action"
      subtitle={`Update configuration for "${action.name}"`}
      maxWidth="2xl"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description *
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="text-xs text-red-600 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Action Type *
          </label>
          <select
            {...register('actionType')}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {actionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Prompt */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Trigger Prompt *
          </label>
          <textarea
            {...register('triggerPrompt', {
              required: 'Trigger prompt is required',
            })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {errors.triggerPrompt && (
            <p className="text-xs text-red-600 mt-1">
              {errors.triggerPrompt.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Priority (0-1000) *
          </label>
          <input
            {...register('priority', {
              required: 'Priority is required',
              valueAsNumber: true,
              min: { value: 0, message: 'Priority must be at least 0' },
              max: { value: 1000, message: 'Priority cannot exceed 1000' },
            })}
            type="number"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.priority && (
            <p className="text-xs text-red-600 mt-1">
              {errors.priority.message}
            </p>
          )}
        </div>

        {/* Action Configuration (JSON) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Action Configuration (JSON) *
          </label>
          <textarea
            {...register('actionConfigJson')}
            rows={5}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
          />
          {jsonErrors.actionConfig && (
            <p className="text-xs text-red-600 mt-1">
              {jsonErrors.actionConfig}
            </p>
          )}
        </div>

        {/* Optional JSON Fields */}
        <details className="border border-neutral-200 rounded-lg p-3">
          <summary className="cursor-pointer font-medium text-neutral-700 text-sm">
            Optional Configuration (Click to expand)
          </summary>
          <div className="mt-4 space-y-4">
            {/* Request Example */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Request Example (JSON)
              </label>
              <textarea
                {...register('requestExampleJson')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
              />
              {jsonErrors.requestExample && (
                <p className="text-xs text-red-600 mt-1">
                  {jsonErrors.requestExample}
                </p>
              )}
            </div>

            {/* Response Example */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Response Example (JSON)
              </label>
              <textarea
                {...register('responseExampleJson')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
              />
              {jsonErrors.responseExample && (
                <p className="text-xs text-red-600 mt-1">
                  {jsonErrors.responseExample}
                </p>
              )}
            </div>

            {/* Response Mapping */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Response Mapping (JSON)
              </label>
              <textarea
                {...register('responseMappingJson')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
              />
              {jsonErrors.responseMapping && (
                <p className="text-xs text-red-600 mt-1">
                  {jsonErrors.responseMapping}
                </p>
              )}
            </div>

            {/* Test Data */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Test Data (JSON)
              </label>
              <textarea
                {...register('testDataJson')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
              />
              {jsonErrors.testData && (
                <p className="text-xs text-red-600 mt-1">
                  {jsonErrors.testData}
                </p>
              )}
            </div>

            {/* Sandbox Options */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Sandbox Options (JSON)
              </label>
              <textarea
                {...register('sandboxOptionsJson')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
              />
              {jsonErrors.sandboxOptions && (
                <p className="text-xs text-red-600 mt-1">
                  {jsonErrors.sandboxOptions}
                </p>
              )}
            </div>
          </div>
        </details>

        {/* Is Active Checkbox */}
        <div className="flex items-center gap-2">
          <input
            {...register('isActive')}
            type="checkbox"
            id="isActiveEdit"
            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActiveEdit" className="text-sm text-neutral-700">
            Active (action will trigger when conditions are met)
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
