import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { OrganizationMembersList } from './OrganizationMembersList';

interface OrganizationMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName?: string;
  readOnly?: boolean;
}

export function OrganizationMembersModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  readOnly = false,
}: OrganizationMembersModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('organizations.team_modal_title')}
      subtitle={organizationName}
      maxWidth="2xl"
      contentClassName="px-6 pb-6"
    >
      <OrganizationMembersList
        organizationId={organizationId}
        enabled={isOpen}
        readOnly={readOnly}
        showHeader={false}
      />
    </BaseModal>
  );
}
