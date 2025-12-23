/**
 * LeadNotesModal Component
 * Dedicated modal for viewing and managing lead notes
 * Shows add note input and note history without full lead details
 */

import { BaseModal } from '@/components/ui/BaseModal';
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `Notes - ${leadName}` : 'Notes'}
      maxWidth="md"
    >
      <LeadNotesSection leadId={leadId} onNoteAdded={onClose} />
    </BaseModal>
  );
}
