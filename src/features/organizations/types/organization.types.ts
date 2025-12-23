/**
 * Organization types for organization-centric architecture
 * Created: December 22, 2025
 */

export type Organization = {
  id: string;
  name: string;
  contactEmail: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMemberRole = 'owner' | 'admin' | 'member';

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UserOrganization = {
  organization: Organization;
  role: OrganizationMemberRole;
  joinedAt: string;
};
