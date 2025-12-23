/**
 * OrganizationCard Component
 * Mobile-friendly card view for individual organization
 * Clean vertical layout following minimal design system
 */

import { format } from 'date-fns';
import { Building2, Mail, Calendar } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Organization } from '../types';

interface OrganizationCardProps {
  organization: Organization;
  onClick: (organization: Organization) => void;
}

export function OrganizationCard({ organization, onClick }: OrganizationCardProps) {
  return (
    <button
      onClick={() => onClick(organization)}
      className="w-full bg-white border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors text-left"
    >
      {/* Header: Logo/Icon + Name */}
      <div className="flex items-start gap-3 mb-3">
        {organization.logoUrl ? (
          <Avatar
            src={organization.logoUrl}
            name={organization.name}
            size="md"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate">
            {organization.name}
          </h3>
        </div>
      </div>

      {/* Contact Email */}
      {organization.contactEmail && (
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-neutral-400 flex-shrink-0" />
          <span className="text-sm text-neutral-600 truncate">
            {organization.contactEmail}
          </span>
        </div>
      )}

      {/* Footer: Created Date */}
      <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-xs text-neutral-500">
          Created {organization.createdAt ? format(new Date(organization.createdAt), 'MMM dd, yyyy') : '-'}
        </span>
      </div>
    </button>
  );
}
