/**
 * Team Management Page
 * Manage organization members and their roles
 * Shows organization members based on global selected agent
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserPlus, Trash2, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { organizationService } from '../services/organizationService';
import AssignUserToOrgModal from '../components/AssignUserToOrgModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TeamTableSkeleton } from '../components/TeamTableSkeleton';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { OrganizationMember } from '../types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function TeamManagementPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_team_management');
  const { agent } = useAgentContext();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember & { user?: { name: string | null; email: string | null; phone?: string | null } } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch organization members with enriched user details (from backend)
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ['organization-members', agent?.organizationId],
    queryFn: () =>
      agent?.organizationId
        ? organizationService.getOrganizationMembers(agent.organizationId)
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
    toast.success(t('team.member_updated'));
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_joined')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('team.table_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {member.user?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="h-4 w-4" />
                        {member.user?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {member.user?.phone ? <PhoneNumber value={member.user.phone} /> : '-'}
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
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2"
                        title={t('team.remove_button_title')}
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

      {/* Assign User Modal */}
      <AssignUserToOrgModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onSuccess={handleAssignSuccess}
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
    </div>
  );
}
