/**
 * Team Management Page
 * Manage organization members and their roles
 * Shows organization members based on global selected agent
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserPlus, Trash2, Mail, Calendar, Clock, RotateCw, Pen } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { organizationService } from '../services/organizationService';
import { useOrganizationAuth } from '../hooks/useOrganizationAuth';
import AssignUserToOrgModal from '../components/AssignUserToOrgModal';
import InviteTeamMemberModal from '../components/InviteTeamMemberModal';
import InvitationSentModal from '../components/InvitationSentModal';
import EditMemberRoleModal from '../components/EditMemberRoleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TeamTableSkeleton } from '../components/TeamTableSkeleton';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { OrganizationMember, PendingInvitation } from '../types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function TeamManagementPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_team_management');
  const { agent } = useAgentContext();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;
  const { canEditMember } = useOrganizationAuth();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<OrganizationMember | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember & { user?: { name: string | null; email: string | null; phone?: string | null } } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendInvitationData, setResendInvitationData] = useState<{
    email: string;
    token: string;
    role: string;
  } | null>(null);

  // Fetch organization members with enriched user details (from backend)
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ['organization-members', agent?.organizationId],
    queryFn: () =>
      agent?.organizationId
        ? organizationService.getOrganizationMembers(agent.organizationId)
        : Promise.resolve([]),
    enabled: !!agent?.organizationId,
  });

  // Fetch pending invitations
  const { data: pendingInvitations = [], isLoading: isLoadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: ['pending-invitations', agent?.organizationId],
    queryFn: () =>
      agent?.organizationId
        ? organizationService.getPendingInvitations(agent.organizationId)
        : Promise.resolve([]),
    enabled: !!agent?.organizationId,
  });

  const handleOpenAssignModal = () => {
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  const handleAssignSuccess = () => {
    refetch(); // Refresh the members list
    refetchInvitations(); // Refresh invitations list
    // Toast message already shown by InviteTeamMemberModal
  };

  const handleEditRole = (member: OrganizationMember) => {
    setMemberToEdit(member);
    setIsEditRoleModalOpen(true);
  };

  const handleCloseEditRoleModal = () => {
    setIsEditRoleModalOpen(false);
    setMemberToEdit(null);
  };

  const handleRemoveMember = (member: OrganizationMember & { user?: { name: string | null; email: string | null; phone?: string | null } }) => {
    setMemberToRemove(member);
    setIsConfirmDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!agent?.organizationId || !memberToRemove) return;

    setIsRemoving(true);
    try {
      await organizationService.removeUserFromOrganization(agent.organizationId, memberToRemove.userId);
      toast.success(t('team.member_removed'));
      refetch();
      setIsConfirmDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      toast.error(t('team.remove_failed'));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    if (!isRemoving) {
      setIsConfirmDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleCancelInvitation = (invitation: PendingInvitation) => {
    setInvitationToCancel(invitation);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelInvitation = async () => {
    if (!invitationToCancel) return;

    setIsCancelling(true);
    try {
      await organizationService.cancelInvitation(invitationToCancel.id);
      toast.success(t('team.invitation_cancelled'));
      refetchInvitations();
      setIsCancelDialogOpen(false);
      setInvitationToCancel(null);
    } catch (error) {
      toast.error(t('team.cancel_invitation_failed'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelDialog = () => {
    if (!isCancelling) {
      setIsCancelDialogOpen(false);
      setInvitationToCancel(null);
    }
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    if (!agent?.organizationId) return;

    setResendingInvitationId(invitation.id);
    try {
      // Use the proper resend endpoint (generates new token, extends expiration)
      const updatedInvitation = await organizationService.resendInvitation(invitation.id);

      // Store invitation data and show confirmation modal
      setResendInvitationData({
        email: updatedInvitation.email,
        token: updatedInvitation.invitationToken,
        role: updatedInvitation.role,
      });
      setShowResendConfirmation(true);

      // Refresh invitations list
      refetchInvitations();
    } catch (error) {
      toast.error(t('team.resend_invitation_failed'));
    } finally {
      setResendingInvitationId(null);
    }
  };

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-neutral-500">{t('team.no_agent_message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title={t('team.title')}
        subtitle={t('team.subtitle')}
        primaryAction={{
          label: t('team.add_button'),
          icon: UserPlus,
          onClick: handleOpenAssignModal
        }}
      />

      {/* Members Table */}
      {isLoading ? (
        <TeamTableSkeleton />
      ) : members.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-12 text-center">
            <p className="text-neutral-500">{t('team.no_members_message')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_email')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_role')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.status')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_joined')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="h-4 w-4" />
                        {member.user?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {t('team.active')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEditMember(member) && (
                          <button
                            onClick={() => handleEditRole(member)}
                            className="text-neutral-900 hover:text-neutral-700 transition-colors p-2"
                            title={t('team.edit_role_button_title') || 'Edit role'}
                          >
                            <Pen className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="text-neutral-900 hover:text-neutral-700 transition-colors p-2"
                          title={t('team.remove_button_title')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {!isLoadingInvitations && pendingInvitations.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('team.pending_invitations')} ({pendingInvitations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_email')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_role')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.status')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_joined')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="h-4 w-4" />
                        {invitation.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invitation.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : invitation.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleResendInvitation(invitation)}
                        disabled={resendingInvitationId === invitation.id}
                        className="text-neutral-900 hover:text-neutral-700 transition-colors p-2 disabled:opacity-50 mr-2"
                        title={t('team.resend_invitation')}
                      >
                        {resendingInvitationId === invitation.id ? (
                          <div className="h-4 w-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCw className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelInvitation(invitation)}
                        className="text-neutral-900 hover:text-neutral-700 transition-colors p-2"
                        title={t('team.cancel_invitation')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conditional Modal - SuperAdmin sees full modal, others see simple invite modal */}
      {isSuperAdmin ? (
        <AssignUserToOrgModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          onSuccess={handleAssignSuccess}
        />
      ) : (
        <InviteTeamMemberModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Edit Member Role Modal */}
      <EditMemberRoleModal
        isOpen={isEditRoleModalOpen}
        onClose={handleCloseEditRoleModal}
        member={memberToEdit}
        organizationId={agent?.organizationId || ''}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmRemoveMember}
        title={t('team.remove_dialog_title')}
        message={t('team.remove_dialog_message', {
          name: memberToRemove?.user?.name || memberToRemove?.user?.email || 'this member'
        })}
        confirmText={t('team.remove_confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isRemoving}
      />

      {/* Cancel Invitation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={handleCloseCancelDialog}
        onConfirm={confirmCancelInvitation}
        title={t('team.cancel_invitation_dialog_title')}
        message={t('team.cancel_invitation_dialog_message', { email: invitationToCancel?.email })}
        confirmText={t('team.cancel_invitation_confirm')}
        cancelText={t('team.cancel_invitation_keep')}
        variant="danger"
        isLoading={isCancelling}
      />

      {/* Resend Invitation Confirmation Modal */}
      {showResendConfirmation && resendInvitationData && (
        <InvitationSentModal
          isOpen={showResendConfirmation}
          onClose={() => {
            setShowResendConfirmation(false);
            setResendInvitationData(null);
          }}
          email={resendInvitationData.email}
          invitationToken={resendInvitationData.token}
          organizationName={agent?.organizationName || 'your organization'}
          role={resendInvitationData.role}
        />
      )}
    </div>
  );
}
