/**
 * Organizations Page
 * SuperAdmin-only page for managing organizations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { organizationService } from '../services/organizationService';
import OrganizationsTable from '../components/OrganizationsTable';
import OrganizationsTableSkeleton from '../components/OrganizationsTableSkeleton';
import EditOrganizationModal from '../components/EditOrganizationModal';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseHeader } from '@/components/ui/BaseHeader';
import type { Organization } from '../types';

export default function OrganizationsPage() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getOrganizations(),
  });

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrganization(null);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <BaseHeader
        title="Organizations"
        subtitle="Manage and view all system organizations"
        primaryAction={{
          label: "Create",
          icon: Plus,
          onClick: handleOpenCreateModal
        }}
      />

      {/* Organizations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <OrganizationsTableSkeleton />
        ) : error ? (
          <EmptyState
            icon={<Building2 className="w-12 h-12 text-neutral-400" />}
            title="Error Loading Organizations"
            description={
              error instanceof Error
                ? error.message
                : 'Failed to load organizations. Please try again.'
            }
          />
        ) : organizations && organizations.length > 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
            <OrganizationsTable
              organizations={organizations}
              onEditOrganization={handleEditOrganization}
            />
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="w-12 h-12 text-neutral-400" />}
            title="No Organizations Yet"
            description="Organizations will appear here once created"
          />
        )}
      </motion.div>

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        organization={selectedOrganization}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </div>
  );
}
