/**
 * LeadNotesModal Component
 * Dedicated modal for viewing and managing lead notes
 * Shows add note input and note history without full lead details
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? t('lead_notes.title_with_name', { name: leadName }) : t('lead_notes.title')}
      maxWidth="md"
    >
      <LeadNotesSection leadId={leadId} onNoteAdded={onClose} />
    </BaseModal>
  );
}
