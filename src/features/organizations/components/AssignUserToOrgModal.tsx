/**
 * Assign User to Organization Modal
 * Single-page vertical form for SuperAdmin to assign users to organizations
 * Flow: Agent → User → Role → Confirm
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { organizationService } from '../services/organizationService';
import { useAgentContext } from '@/hooks/useAgentContext';
import AgentSearchDropdown from './AgentSearchDropdown';
import UserSearchDropdown from './UserSearchDropdown';
import InvitationSentModal from './InvitationSentModal';
import type { Agent } from '@/features/agents/types/agent.types';
import type { UserSearchResult } from '../types';

interface AssignUserToOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId?: string; // Optional: Use this organization ID instead of agent's organization
}

export default function AssignUserToOrgModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId
}: AssignUserToOrgModalProps) {
  const { t } = useTranslation();
  const { agent: globalAgent } = useAgentContext();
  const [mode, setMode] = useState<'select' | 'email'>('select');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvitationConfirmation, setShowInvitationConfirmation] = useState(false);
  const [sentInvitationToken, setSentInvitationToken] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  // Auto-populate with global selected agent when modal opens
  // If organizationId is provided, we'll use it directly instead of requiring agent selection
  useEffect(() => {
    if (isOpen && !organizationId && globalAgent) {
      setSelectedAgent(globalAgent);
    }
  }, [isOpen, organizationId, globalAgent]);

  // Get the target organization ID (from prop or selected agent)
  const targetOrganizationId = organizationId || selectedAgent?.organizationId;

  // Check if user is in a different organization
  const userInDifferentOrg = selectedUser?.currentOrganization &&
    selectedUser.currentOrganization.id !== targetOrganizationId;

  const handleAssign = () => {
    // Check if all fields are filled based on mode
    if (!targetOrganizationId) {
      toast.error(t('assign_user_to_org.validation_error'));
      return;
    }

    if (mode === 'select' && !selectedUser) {
      toast.error(t('assign_user_to_org.validation_error'));
      return;
    }

    if (mode === 'email' && !email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Validate email format in email mode
    if (mode === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    // Check if confirmation needed for cross-org assignment (select mode only)
    if (mode === 'select' && userInDifferentOrg) {
      setShowConfirmation(true);
    } else {
      handleSubmit(false);
    }
  };

  const handleSubmit = async (removeFromCurrent: boolean) => {
    if (!targetOrganizationId) return;

    setIsSubmitting(true);
    try {
      if (mode === 'email') {
        // Invite by email (smart endpoint)
        const result = await organizationService.inviteOrAssignUser(
          targetOrganizationId,
          {
            email: email.trim(),
            role: selectedRole,
            removeFromCurrent
          }
        );

        if (result.type === 'invited' && result.invitation) {
          // Show confirmation modal with invitation link
          setSentEmail(email.trim());
          setSentInvitationToken(result.invitation.invitationToken);
          setShowInvitationConfirmation(true);
        } else {
          // User was assigned directly (already exists)
          toast.success('User assigned!', {
            description: `${email} has been added to your organization as ${selectedRole}.`
          });
          handleClose();
        }
      } else {
        // Assign existing user
        if (!selectedUser) return;

        await organizationService.assignUserToOrganization(
          targetOrganizationId,
          {
            userId: selectedUser.id,
            role: selectedRole,
            removeFromCurrent
          }
        );

        toast.success(t('assign_user_to_org.success_title'), {
          description: t('assign_user_to_org.success_description', { email: selectedUser.email, role: selectedRole })
        });
      }

      // If we're here (didn't show invitation confirmation), call onSuccess and close
      if (!showInvitationConfirmation) {
        handleClose();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Failed to assign/invite user:', error);

      // Backend returns { error: "message" } in ErrorResponse
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || t('assign_user_to_org.error_default');

      if (errorMessage.includes('already a member')) {
        toast.error(t('assign_user_to_org.error_already_member_title'), {
          description: errorMessage
        });
      } else {
        toast.error(mode === 'email' ? 'Invitation failed' : t('assign_user_to_org.error_title'), {
          description: errorMessage
        });
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    setMode('select');
    setSelectedAgent(null);
    setSelectedUser(null);
    setEmail('');
    setSelectedRole('member');
    setShowConfirmation(false);
    setIsSubmitting(false);
    setShowInvitationConfirmation(false);
    setSentInvitationToken('');
    setSentEmail('');
    onClose();
  };

  const handleInvitationConfirmationClose = () => {
    setShowInvitationConfirmation(false);
    setSentInvitationToken('');
    setSentEmail('');
    handleClose();
    onSuccess?.();
  };

  const canSubmit = targetOrganizationId && (mode === 'email' ? email.trim() : selectedUser);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('assign_user_to_org.title')}
        subtitle={t('assign_user_to_org.subtitle')}
        maxWidth="2xl"
        isLoading={isSubmitting}
        closable={!isSubmitting}
      >
        <div className="space-y-4">
            <div className="space-y-4">
              {/* Agent Selection - Only shown when organizationId is not provided */}
              {!organizationId && (
                <AgentSearchDropdown
                  selectedAgent={selectedAgent}
                  onAgentSelect={setSelectedAgent}
                />
              )}

              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === 'select'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="font-medium">Select User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === 'email'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Invite by Email</span>
                </button>
              </div>

              {/* User Selection (Select Mode) */}
              {mode === 'select' && (
                <UserSearchDropdown
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                  excludeOrganizationId={targetOrganizationId}
                />
              )}

              {/* Email Input (Email Mode) */}
              {mode === 'email' && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                    autoComplete="email"
                  />
                  <p className="mt-2 text-sm text-neutral-600">
                    If the user doesn't exist, they'll receive an invitation email to join.
                  </p>
                </div>
              )}

              {/* Role Selection */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'admin' | 'member')}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              >
                <option value="member">{t('assign_user_to_org.role_member')}</option>
                <option value="admin">{t('assign_user_to_org.role_admin')}</option>
                <option value="owner">{t('assign_user_to_org.role_owner')}</option>
              </select>

              {/* Summary Preview */}
              {targetOrganizationId && (mode === 'select' ? selectedUser : email.trim()) && (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h4 className="font-medium text-neutral-900 mb-3">{t('assign_user_to_org.summary_title')}</h4>
                  <div className="space-y-2 text-sm">
                    {selectedAgent && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('assign_user_to_org.summary_agent')}</span>
                        <span className="text-neutral-900 font-medium">{selectedAgent.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">{mode === 'email' ? 'Email' : t('assign_user_to_org.summary_user')}</span>
                      <span className="text-neutral-900 font-medium">{mode === 'email' ? email.trim() : selectedUser?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">{t('assign_user_to_org.summary_role')}</span>
                      <span className="text-neutral-900 font-medium capitalize">{selectedRole}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!canSubmit || isSubmitting}
                className="bg-brand-cyan hover:bg-brand-cyan/90"
              >
                {isSubmitting ? t('assign_user_to_org.assigning') : t('assign_user_to_org.assign_button')}
              </Button>
            </div>
          </div>
      </BaseModal>

      {/* Confirmation Dialog for Cross-Org Assignment */}
      <BaseModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={t('assign_user_to_org.confirm_title')}
        maxWidth="md"
        isLoading={isSubmitting}
        closable={!isSubmitting}
      >
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-neutral-700 mb-2">
                {t('assign_user_to_org.confirm_message_1', { org: selectedUser?.currentOrganization?.name })}
              </p>
              <p className="text-neutral-700">
                {t('assign_user_to_org.confirm_message_2')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? t('assign_user_to_org.moving') : t('assign_user_to_org.move_button')}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Invitation Sent Confirmation Modal */}
      <InvitationSentModal
        isOpen={showInvitationConfirmation}
        onClose={handleInvitationConfirmationClose}
        email={sentEmail}
        invitationToken={sentInvitationToken}
        organizationName={selectedAgent?.name || 'the organization'}
        role={selectedRole}
      />
    </>
  );
}
