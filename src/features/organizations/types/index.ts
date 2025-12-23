/**
 * Organization Types
 * Matches backend DTOs for consistent API communication
 */

/**
 * Organization entity type
 * Matches backend Organization model
 */
export interface Organization {
  id: string;
  name: string;
  contactEmail?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  defaultPrimaryColor?: string;
  defaultWelcomeMessage?: string;
  logoUrl?: string;
  allowedDomains?: string[];
}

/**
 * DTO for creating a new organization
 * Matches backend CreateOrganizationDto
 * Note: OwnerId is optional - if not provided, backend uses JWT token user
 */
export interface CreateOrganizationRequest {
  name: string;
  contactEmail?: string;
  ownerId?: string;
  defaultPrimaryColor?: string;
  defaultWelcomeMessage?: string;
  logoUrl?: string;
  allowedDomains?: string[];
}

/**
 * DTO for updating an existing organization
 * Matches backend UpdateOrganizationDto
 */
export interface UpdateOrganizationRequest {
  name: string;
  contactEmail?: string;
  ownerId?: string; // Optional - allows changing organization owner
  defaultPrimaryColor?: string;
  defaultWelcomeMessage?: string;
  logoUrl?: string;
  allowedDomains?: string[];
}

/**
 * User search result from SuperAdmin search endpoint
 * Includes current organization info for validation
 */
export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  currentOrganization: {
    id: string;
    name: string;
  } | null;
}

/**
 * Organization member (matches backend OrganizationMember model)
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  // Optional user details (if enriched)
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone?: string | null;
  };
}

/**
 * Organization member with full user details
 * Used in team management views
 */
export interface OrganizationMemberWithUser {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

/**
 * Request to assign a user to an organization
 * Matches backend AssignUserRequest
 */
export interface AssignUserToOrganizationRequest {
  userId: string;
  role?: 'owner' | 'admin' | 'member';
  removeFromCurrent?: boolean;
}
