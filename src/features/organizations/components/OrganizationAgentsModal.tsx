import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { OrganizationAgentsList } from './OrganizationAgentsList';

interface OrganizationAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName?: string;
}

export function OrganizationAgentsModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
}: OrganizationAgentsModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('organizations.agents_modal_title')}
      subtitle={organizationName}
      maxWidth="2xl"
      contentClassName="px-6 pb-6"
    >
      <OrganizationAgentsList
        organizationId={organizationId}
        enabled={isOpen}
        showHeader={false}
      />
    </BaseModal>
  );
}
