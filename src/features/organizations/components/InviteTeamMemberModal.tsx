/**
 * Invite Team Member Modal
 * Simplified modal for organization owners/admins to invite new team members
 * Only shows email input and role selection (no agent or user search)
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { organizationService } from '../services/organizationService';
import { useAgentContext } from '@/hooks/useAgentContext';
import InvitationSentModal from './InvitationSentModal';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteTeamMemberModal({
  isOpen,
  onClose,
  onSuccess
}: InviteTeamMemberModalProps) {
  const { t } = useTranslation();
  const { agent } = useAgentContext();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');

  const handleSubmit = async () => {
    if (!agent?.organizationId) {
      toast.error(t('organizations.invite_org_not_found'));
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      toast.error(t('organizations.invite_email_required'));
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error(t('organizations.invite_email_invalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await organizationService.inviteOrAssignUser(
        agent.organizationId,
        {
          email: email.trim(),
          role: selectedRole,
          removeFromCurrent: false
        }
      );

      if (result.type === 'invited' && result.invitation) {
        // Show confirmation modal with invitation link
        setInvitationToken(result.invitation.invitationToken);
        setShowConfirmation(true);
      } else {
        // User was assigned directly (already exists)
        toast.success(t('organizations.invite_success'), {
          description: t('organizations.invite_success_description', { email, role: selectedRole })
        });
        // Reset and close
        handleClose();
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to invite user:', error);

      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || t('organizations.invite_error_failed');

      if (errorMessage.includes('already a member')) {
        toast.error(t('organizations.invite_error_already_member'), {
          description: errorMessage
        });
      } else {
        toast.error(t('organizations.invite_error_failed'), {
          description: errorMessage
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedRole('member');
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setInvitationToken('');
    handleClose();
  };

  const canSubmit = email.trim();

  return (
    <>
      <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('organizations.invite_title')}
      subtitle={t('organizations.invite_subtitle')}
      maxWidth="md"
      isLoading={isSubmitting}
      closable={!isSubmitting}
    >
      <div className="space-y-5">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
            {t('organizations.invite_email_label')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('organizations.invite_email_placeholder')}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
            {t('organizations.invite_role_label')}
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'admin' | 'member')}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="member">{t('organizations.role_member_description')}</option>
            <option value="admin">{t('organizations.role_admin_description')}</option>
            <option value="owner">{t('organizations.role_owner_description')}</option>
          </select>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('organizations.invite_cancel_button')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            isLoading={isSubmitting}
            className="bg-brand-cyan hover:bg-brand-cyan/90"
          >
            {t('organizations.invite_send_button')}
          </Button>
        </div>
      </div>
    </BaseModal>

      {/* Invitation Sent Confirmation Modal */}
      <InvitationSentModal
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        email={email}
        invitationToken={invitationToken}
        organizationName={agent?.name || 'your organization'}
        role={selectedRole}
      />
    </>
  );
}
