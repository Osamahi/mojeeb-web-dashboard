/**
 * LeadNotesModal Component
 * Dedicated modal for viewing and managing lead notes
 * Shows add note input and note history without full lead details
 */

import { Modal } from '@/components/ui/Modal';
import { LeadNotesSection } from './LeadNotesSection';

interface LeadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName?: string;
}

export function LeadNotesModal({
  isOpen,
  onClose,
  leadId,
  leadName,
}: LeadNotesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `Notes - ${leadName}` : 'Notes'}
      size="md"
    >
      <div className="px-6 py-4">
        <LeadNotesSection leadId={leadId} onNoteAdded={onClose} />
      </div>
    </Modal>
  );
}
