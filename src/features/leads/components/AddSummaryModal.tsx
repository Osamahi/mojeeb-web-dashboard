/**
 * AddSummaryModal Component
 * Dedicated modal for adding/editing lead summary
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateLead } from '../hooks/useLeads';

interface AddSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName?: string;
  currentSummary?: string;
}

export function AddSummaryModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  currentSummary = '',
}: AddSummaryModalProps) {
  const [summary, setSummary] = useState(currentSummary);
  const updateMutation = useUpdateLead();

  const handleSave = () => {
    updateMutation.mutate(
      {
        leadId,
        request: { summary: summary.trim() || undefined },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `Summary - ${leadName}` : 'Summary'}
      size="md"
    >
      <div className="space-y-2">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter summary..."
            rows={6}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
            autoFocus
          />
          <div
            className={`transition-all duration-200 ease-in-out overflow-hidden ${
              summary.trim()
                ? 'max-h-20 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Summary'}
            </button>
          </div>
        </div>
    </Modal>
  );
}
