import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Mail, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AssignUserToOrgModal from './AssignUserToOrgModal';
import { organizationService } from '../services/organizationService';
import { userService } from '@/features/users/services/userService';
import type { OrganizationMember } from '../types';

type EnrichedMember = OrganizationMember & {
  user?: { id: string; name: string | null; email: string | null; phone?: string | null };
};

interface OrganizationMembersListProps {
  organizationId: string;
  enabled?: boolean;
  showHeader?: boolean;
  readOnly?: boolean;
}

export function OrganizationMembersList({
  organizationId,
  enabled = true,
  showHeader = true,
  readOnly = false,
}: OrganizationMembersListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<EnrichedMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: enabled && !readOnly,
  });

  const {
    data: members = [],
    isLoading,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: () => organizationService.getOrganizationMembers(organizationId),
    enabled: enabled && !!organizationId,
  });

  // Backend already returns each member with a nested `user` object (see
  // organizationService.transformOrganizationMember). We additionally enrich with
  // `phone` from the users list when it has been fetched (edit mode).
  const enrichedMembers: EnrichedMember[] = useMemo(() => {
    return members.map((member) => {
      const fullUser = users.find((u) => u.id === member.userId);
      return {
        ...member,
        user: {
          id: member.user?.id ?? member.userId,
          name: member.user?.name ?? fullUser?.name ?? null,
          email: member.user?.email ?? fullUser?.email ?? null,
          phone: fullUser?.phone ?? null,
        },
      };
    });
  }, [members, users]);

  const handleAssignSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    await refetchMembers();
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await organizationService.removeUserFromOrganization(organizationId, memberToRemove.userId);
      toast.success(t('organizations.member_removed'));
      refetchMembers();
      setMemberToRemove(null);
    } catch (error) {
      toast.error(t('organizations.remove_failed'));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {(showHeader || !readOnly) && (
          <div className="flex items-center justify-between">
            {showHeader ? (
              <label className="block text-sm font-medium text-neutral-700">
                {t('organizations.team_members_count')} ({enrichedMembers.length})
              </label>
            ) : (
              <span />
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-mojeeb hover:bg-brand-mojeeb/10 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                {t('organizations.add_member')}
              </button>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="p-4 bg-neutral-50 rounded-lg animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        ) : enrichedMembers.length > 0 ? (
          <div className="max-h-96 overflow-y-auto border border-neutral-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('common.user')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('common.email')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('common.role')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('common.joined')}
                  </th>
                  {!readOnly && (
                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {enrichedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {member.user?.name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="h-3 w-3" />
                        {member.user?.email || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMemberToRemove(member);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors p-2"
                          title={t('organizations.remove_member')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-500 text-center">
            {t('organizations.no_members')}
          </div>
        )}
      </div>

      {!readOnly && (
        <>
          <AssignUserToOrgModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            onSuccess={handleAssignSuccess}
            organizationId={organizationId}
          />
          <ConfirmDialog
            isOpen={!!memberToRemove}
            onClose={() => {
              if (!isRemoving) setMemberToRemove(null);
            }}
            onConfirm={confirmRemoveMember}
            title={t('organizations.remove_member')}
            message={t('organizations.remove_member_confirm', {
              name:
                memberToRemove?.user?.name ||
                memberToRemove?.user?.email ||
                'this member',
            })}
            confirmText={t('common.delete')}
            cancelText={t('common.cancel')}
            variant="danger"
            isLoading={isRemoving}
          />
        </>
      )}
    </>
  );
}
