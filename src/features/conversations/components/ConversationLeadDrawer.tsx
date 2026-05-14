/**
 * ConversationLeadDrawer
 *
 * Side-drawer that opens from the conversation header to show the lead that
 * was captured for that conversation. The drawer shell (animation, ESC,
 * scroll lock, RTL slide direction) lives in the shared `SideDrawer`
 * component; this file is just data fetching + the shared inline-edit body.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { Spinner } from '@/components/ui/Spinner';
import { useLead } from '@/features/leads/hooks/useLeads';
import { useFormCustomFieldSchemas } from '@/features/leads/hooks/useCustomFieldSchemas';
import { useInlineLeadEdit } from '@/features/leads/hooks/useInlineLeadEdit';
import { LeadInlineDetails } from '@/features/leads/components/LeadInlineDetails';

interface ConversationLeadDrawerProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationLeadDrawer({
  leadId,
  isOpen,
  onClose,
}: ConversationLeadDrawerProps) {
  const { t } = useTranslation();

  const { data: lead, isLoading } = useLead(leadId);
  const { data: formSchemas = [] } = useFormCustomFieldSchemas();
  const { savingFieldKey, saveField, saveCustomField } = useInlineLeadEdit(leadId);

  // Single ordered list — system + custom interleaved by display_order so
  // the rendered form respects the per-agent schema configuration without
  // surfacing the system/custom split to the user.
  const orderedSchemas = useMemo(
    () => [...formSchemas].sort((a, b) => a.display_order - b.display_order),
    [formSchemas]
  );

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} title={t('lead_details.title')}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !lead ? (
        <p className="text-sm text-neutral-600 text-center py-12">
          {t('lead_details.not_found', 'Lead not found.')}
        </p>
      ) : (
        <LeadInlineDetails
          lead={lead}
          schemas={orderedSchemas}
          savingFieldKey={savingFieldKey}
          onSaveField={saveField}
          onSaveCustomField={saveCustomField}
        />
      )}
    </SideDrawer>
  );
}
