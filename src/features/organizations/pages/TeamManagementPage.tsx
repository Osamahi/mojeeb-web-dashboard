/**
 * Team Management Page
 * Manage organization members and their roles
 * Shows organization members based on global selected agent
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Trash2, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { organizationService } from '../services/organizationService';
import AssignUserToOrgModal from '../components/AssignUserToOrgModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TeamTableSkeleton } from '../components/TeamTableSkeleton';
import { BaseHeader } from '@/components/ui/BaseHeader';
import type { OrganizationMember } from '../types';

export default function TeamManagementPage() {
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
    toast.success('Member list updated');
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
      toast.success('Member removed successfully');
      refetch();
      setIsConfirmDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      toast.error('Failed to remove member');
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
          <p className="text-neutral-500">Please select an agent to view team members</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title="Team"
        subtitle="Manage your team"
        primaryAction={{
          label: "Add",
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
            <p className="text-neutral-500">No members found. Click "Add" to add team members.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
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
                        {member.user?.phone || '-'}
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
                        title="Remove member"
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
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.name || memberToRemove?.user?.email || 'this member'} from the organization?\n\nThis action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemoving}
      />
    </div>
  );
}
