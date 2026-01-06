/**
 * Organization Selector Component
 * Allows searching and selecting an organization
 * Used in SuperAdmin subscription creation
 * PATTERN: Follows UserSearchDropdown pattern - fetch all orgs, filter client-side
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Check, Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { organizationService } from '../services/organizationService';
import { subscriptionService } from '@/features/subscriptions/services/subscriptionService';
import { Input } from '@/components/ui/Input';
import type { Organization } from '../types';

interface OrganizationSelectorProps {
  value: string; // organizationId
  onChange: (organizationId: string, organization: Organization) => void;
  placeholder?: string;
  error?: string;
}

export default function OrganizationSelector({
  value,
  onChange,
  placeholder,
  error
}: OrganizationSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const placeholderText = placeholder || t('organization_selector.placeholder', 'Search organizations...');

  // Fetch all organizations upfront (SuperAdmin only endpoint)
  const { data: allOrganizations = [], isLoading } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: () => organizationService.getOrganizations(),
  });

  // Fetch all subscriptions to check which organizations already have one
  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', 'all'],
    queryFn: () => subscriptionService.getAllSubscriptions({}, 1, 999), // Fetch all subscriptions
  });

  // Create a Set of organization IDs that already have ANY active subscription
  // Backend enforces ONE subscription per organization (can't create a second one)
  // To upgrade from free to paid, users should use the "Change Plan" feature, not create new subscription
  const organizationsWithSubscriptions = useMemo(() => {
    if (!subscriptionsData?.items) return new Set<string>();
    return new Set(subscriptionsData.items.map(sub => sub.organizationId));
  }, [subscriptionsData]);

  // Find selected organization
  const selectedOrganization = useMemo(() => {
    return allOrganizations.find(org => org.id === value) || null;
  }, [allOrganizations, value]);

  // Client-side filtering
  const searchResults = useMemo<Organization[]>(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return allOrganizations
      .filter((org: Organization) => {
        const matchesName = org.name?.toLowerCase().includes(query);
        const matchesId = org.id?.toLowerCase().includes(query);
        const matchesEmail = org.contactEmail?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesEmail;
      })
      .slice(0, 20); // Limit to 20 results
  }, [allOrganizations, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleOrganizationSelect = (org: Organization) => {
    onChange(org.id, org);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleBlur}
          placeholder={placeholderText}
          className="pl-10"
        />
        {selectedOrganization && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Info message about existing subscriptions */}
      {showDropdown && searchQuery.length >= 2 && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {t('organization_selector.subscription_info', 'Organizations with existing subscriptions are disabled. To upgrade a subscription, use the subscription management page.')}
          </p>
        </div>
      )}

      {/* Organization Dropdown */}
      {showDropdown && searchQuery.length >= 2 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('organization_selector.loading', 'Loading organizations...')}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((org) => {
                const hasSubscription = organizationsWithSubscriptions.has(org.id);
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => !hasSubscription && handleOrganizationSelect(org)}
                    disabled={hasSubscription}
                    className={`w-full px-4 py-3 transition-colors flex items-start gap-3 text-left ${
                      hasSubscription
                        ? 'opacity-50 cursor-not-allowed bg-neutral-50'
                        : 'hover:bg-neutral-50 cursor-pointer'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                      hasSubscription ? 'bg-green-100' : 'bg-neutral-100'
                    }`}>
                      {hasSubscription ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Building2 className="h-4 w-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate flex items-center gap-2">
                        {org.name}
                        {hasSubscription && (
                          <span className="text-xs font-normal text-green-600">
                            {t('organization_selector.has_subscription', '(Has Subscription)')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 truncate font-mono">
                        {org.id}
                      </div>
                      {org.contactEmail && (
                        <div className="text-sm text-neutral-500 truncate mt-0.5">
                          {org.contactEmail}
                        </div>
                      )}
                    </div>
                    {selectedOrganization?.id === org.id && !hasSubscription && (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-500">
              {searchQuery.length < 2
                ? t('organization_selector.min_chars', 'Type at least 2 characters to search')
                : t('organization_selector.no_results', { query: searchQuery }, `No organizations found matching "${searchQuery}"`)
              }
            </div>
          )}
        </div>
      )}

      {/* Selected Organization Info */}
      {selectedOrganization && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-900">
                {selectedOrganization.name}
              </div>
              <div className="text-xs text-neutral-500 font-mono truncate">
                {selectedOrganization.id}
              </div>
              {selectedOrganization.contactEmail && (
                <div className="text-sm text-neutral-500 mt-1">
                  {selectedOrganization.contactEmail}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
