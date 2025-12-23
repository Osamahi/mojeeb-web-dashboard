/**
 * Reassign Organization Modal
 * SuperAdmin-only modal for reassigning an agent to a different organization
 * Refactored to use BaseModal component for consistency
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { agentService } from '../services/agentService';
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { queryKeys } from '@/lib/queryKeys';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/hooks/useConfirm';
import type { Agent } from '../types/agent.types';

interface ReassignOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

export default function ReassignOrganizationModal({ isOpen, onClose, agent }: ReassignOrganizationModalProps) {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [selectedOrgId, setSelectedOrgId] = useState<string>(agent.organizationId);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch organizations (SuperAdmin only)
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations();

  // Filter organizations based on search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;

    const query = searchQuery.toLowerCase();
    return organizations.filter(org =>
      org.name.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  // Reassignment mutation
  const reassignMutation = useMutation({
    mutationFn: (organizationId: string) =>
      agentService.reassignOrganization(agent.id, organizationId),
    onSuccess: (updatedAgent) => {
      toast.success(`Agent "${agent.name}" reassigned to "${updatedAgent.organizationName}" successfully!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to reassign agent');
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });

  const handleClose = () => {
    setSearchQuery('');
    setSelectedOrgId(agent.organizationId);
    onClose();
  };

  const handleReassign = async () => {
    if (selectedOrgId === agent.organizationId) {
      toast.info('Agent is already in this organization');
      return;
    }

    const selectedOrg = organizations.find(org => org.id === selectedOrgId);
    if (!selectedOrg) {
      toast.error('Please select a valid organization');
      return;
    }

    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Reassign Agent to Organization',
      message: `Are you sure you want to reassign "${agent.name}" from "${agent.organizationName}" to "${selectedOrg.name}"? This will affect agent access and permissions.`,
      confirmText: 'Confirm Reassignment',
      variant: 'danger',
    });

    if (confirmed) {
      reassignMutation.mutate(selectedOrgId);
    }
  };

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <>
      {ConfirmDialogComponent}
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Reassign to Organization"
        subtitle={`Agent: ${agent.name}`}
        maxWidth="md"
        isLoading={reassignMutation.isPending}
        closable={!reassignMutation.isPending}
        contentClassName="space-y-4"
      >
        <div className="space-y-4">
            {/* Current Organization */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <p className="text-xs text-neutral-600 mb-1">Current Organization</p>
              <p className="text-sm font-medium text-neutral-950">{agent.organizationName}</p>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Select New Organization
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Organization List */}
            <div className="border border-neutral-200 rounded-lg max-h-60 overflow-y-auto">
              {isLoadingOrgs ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  Loading organizations...
                </div>
              ) : filteredOrganizations.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  {searchQuery ? 'No organizations found matching your search' : 'No organizations available'}
                </div>
              ) : (
                filteredOrganizations.map((org) => (
                  <label
                    key={org.id}
                    className={`flex items-center gap-3 p-3 border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      selectedOrgId === org.id ? 'bg-brand-cyan/5' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="organization"
                      value={org.id}
                      checked={selectedOrgId === org.id}
                      onChange={() => setSelectedOrgId(org.id)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan"
                      disabled={org.id === agent.organizationId}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-950 truncate">{org.name}</p>
                      {org.id === agent.organizationId && (
                        <p className="text-xs text-neutral-500">Current</p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Selected Organization Preview */}
            {selectedOrg && selectedOrg.id !== agent.organizationId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700 mb-1">Will be assigned to</p>
                <p className="text-sm font-medium text-green-900">{selectedOrg.name}</p>
              </div>
            )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-neutral-200 mt-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={reassignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleReassign}
              className="flex-1"
              disabled={reassignMutation.isPending || selectedOrgId === agent.organizationId}
            >
              {reassignMutation.isPending ? 'Reassigning...' : 'Reassign'}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
