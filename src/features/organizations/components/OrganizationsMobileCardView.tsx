/**
 * OrganizationsMobileCardView Component
 * Mobile card-based view for organizations list
 * Includes simple list rendering with loading states
 */

import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { OrganizationCard } from './OrganizationCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Organization } from '../types';

interface OrganizationsMobileCardViewProps {
  organizations: Organization[];
  onOrganizationClick: (organization: Organization) => void;
  searchQuery?: string;
}

export function OrganizationsMobileCardView({
  organizations,
  onOrganizationClick,
  searchQuery
}: OrganizationsMobileCardViewProps) {
  // Empty state
  if (!organizations || organizations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<Building2 className="w-12 h-12 text-neutral-400" />}
          title={searchQuery ? 'No organizations found' : 'No organizations yet'}
          description={
            searchQuery
              ? 'Try adjusting your search criteria'
              : 'Organizations will appear here once created'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {organizations.map((organization, index) => (
        <motion.div
          key={organization.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <OrganizationCard
            organization={organization}
            onClick={onOrganizationClick}
          />
        </motion.div>
      ))}
    </div>
  );
}
