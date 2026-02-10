/**
 * Drawer component for viewing action details
 * Slides in from right with full action information
 */

import { X, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { Action } from '../types';
import { ActionTypeBadge } from './ActionTypeBadge';
import {
  formatPriority,
  getPriorityColor,
  formatJson,
} from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';

interface ActionDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
}

export function ActionDetailsDrawer({
  isOpen,
  onClose,
  action,
}: ActionDetailsDrawerProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  if (!isOpen || !action) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral-900 truncate">
              {action.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <ActionTypeBadge type={action.actionType} />
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  action.isActive
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {action.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Description */}
          {action.description && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">
                Description
              </h3>
              <p className="text-sm text-neutral-600">{action.description}</p>
            </div>
          )}

          {/* Trigger Prompt */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Trigger Prompt
            </h3>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                {action.triggerPrompt}
              </p>
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Priority
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                action.priority
              )}`}
            >
              {action.priority} - {formatPriority(action.priority)}
            </span>
          </div>

          {/* Action Configuration */}
          <JsonField
            label="Action Configuration"
            value={action.actionConfig}
            onCopy={handleCopy}
            copiedField={copiedField}
            fieldName="actionConfig"
          />

          {/* Request Example */}
          {action.requestExample && (
            <JsonField
              label="Request Example"
              value={action.requestExample}
              onCopy={handleCopy}
              copiedField={copiedField}
              fieldName="requestExample"
            />
          )}

          {/* Response Example */}
          {action.responseExample && (
            <JsonField
              label="Response Example"
              value={action.responseExample}
              onCopy={handleCopy}
              copiedField={copiedField}
              fieldName="responseExample"
            />
          )}

          {/* Response Mapping */}
          {action.responseMapping && (
            <JsonField
              label="Response Mapping"
              value={action.responseMapping}
              onCopy={handleCopy}
              copiedField={copiedField}
              fieldName="responseMapping"
            />
          )}

          {/* Test Data */}
          {action.testData && (
            <JsonField
              label="Test Data"
              value={action.testData}
              onCopy={handleCopy}
              copiedField={copiedField}
              fieldName="testData"
            />
          )}

          {/* Sandbox Options */}
          {action.sandboxOptions && (
            <JsonField
              label="Sandbox Options"
              value={action.sandboxOptions}
              onCopy={handleCopy}
              copiedField={copiedField}
              fieldName="sandboxOptions"
            />
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Action ID</span>
              <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                {action.id}
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Agent ID</span>
              <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                {action.agentId}
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Created</span>
              <span className="text-neutral-900">
                {formatSmartTimestamp(action.createdAt)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Updated</span>
              <span className="text-neutral-900">
                {formatSmartTimestamp(action.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper component for JSON fields
interface JsonFieldProps {
  label: string;
  value: Record<string, any>;
  onCopy: (text: string, fieldName: string) => void;
  copiedField: string | null;
  fieldName: string;
}

function JsonField({
  label,
  value,
  onCopy,
  copiedField,
  fieldName,
}: JsonFieldProps) {
  const jsonString = formatJson(value);
  const isCopied = copiedField === fieldName;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-700">{label}</h3>
        <button
          onClick={() => onCopy(jsonString, fieldName)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto">
        <pre className="text-xs font-mono">{jsonString}</pre>
      </div>
    </div>
  );
}
