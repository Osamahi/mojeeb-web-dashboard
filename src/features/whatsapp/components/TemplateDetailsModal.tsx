/**
 * Template Details Modal
 * Displays full details of a WhatsApp message template
 */

import { BaseModal } from '@/components/ui/BaseModal';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare } from 'lucide-react';
import type { MessageTemplate } from '../types/whatsapp.types';

interface TemplateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: MessageTemplate | null;
}

export function TemplateDetailsModal({
  isOpen,
  onClose,
  template,
}: TemplateDetailsModalProps) {
  if (!template) return null;

  // Determine status color
  const statusColor =
    template.status === 'APPROVED' ? 'text-green-600' :
    template.status === 'PENDING' ? 'text-orange-500' :
    template.status === 'REJECTED' ? 'text-red-600' :
    'text-neutral-500';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Details"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Template Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className={`font-medium ${statusColor}`}>
                {template.status}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-600">{template.category}</span>
            </div>
          </div>
        </div>

        {/* Template Information */}
        <div className="space-y-4">
          {/* Template ID */}
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Template ID
            </label>
            <p className="mt-1 text-sm text-neutral-900 font-mono bg-neutral-50 p-2 rounded border border-neutral-200">
              {template.id}
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Language
            </label>
            <p className="mt-1 text-sm text-neutral-900">
              {template.language}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Category
            </label>
            <p className="mt-1 text-sm text-neutral-900">
              {template.category}
            </p>
          </div>

          {/* Components */}
          {template.components && template.components.length > 0 && (
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 block">
                Template Components
              </label>
              <div className="space-y-3">
                {template.components.map((component, index) => (
                  <div
                    key={index}
                    className="bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="text-xs">
                        {component.type}
                      </Badge>
                      {component.format && (
                        <span className="text-xs text-neutral-500">
                          Format: {component.format}
                        </span>
                      )}
                    </div>
                    {component.text && (
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        {component.text}
                      </p>
                    )}
                    {component.example?.body_text?.[0] && (
                      <div className="mt-2 pt-2 border-t border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">
                          Example:
                        </span>
                        <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">
                          {component.example.body_text[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Score (if available) */}
          {template.quality_score && (
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Quality Score
              </label>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={
                    template.quality_score.score === 'HIGH' ? 'success' :
                    template.quality_score.score === 'MEDIUM' ? 'warning' :
                    'error'
                  }
                >
                  {template.quality_score.score}
                </Badge>
                {template.quality_score.date && (
                  <span className="text-xs text-neutral-500">
                    as of {new Date(template.quality_score.date * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
