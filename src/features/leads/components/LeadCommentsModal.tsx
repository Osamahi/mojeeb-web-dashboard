/**
 * LeadCommentsModal Component
 * Dedicated modal for viewing and managing lead comments
 * Shows add comment input and comment history without full lead details
 */

import { Modal } from '@/components/ui/Modal';
import { LeadCommentsSection } from './LeadCommentsSection';

interface LeadCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName?: string;
}

export function LeadCommentsModal({
  isOpen,
  onClose,
  leadId,
  leadName,
}: LeadCommentsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `Comments - ${leadName}` : 'Comments'}
      size="md"
    >
      <div className="px-6 py-4">
        <LeadCommentsSection leadId={leadId} onCommentAdded={onClose} />
      </div>
    </Modal>
  );
}
