/**
 * Organizations Table Component
 * Displays organizations with sorting, search, and infinite scroll
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Building2, Search } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { OrganizationsMobileCardView } from './OrganizationsMobileCardView';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Organization } from '../types';

interface OrganizationsTableProps {
  organizations: Organization[];
  onEditOrganization: (organization: Organization) => void;
}

export default function OrganizationsTable({
  organizations,
  onEditOrganization,
}: OrganizationsTableProps) {
  // Responsive breakpoint
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter organizations based on search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;

    const query = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.contactEmail?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  // Displayed organizations with infinite scroll
  const displayedOrganizations = useMemo(() => {
    return filteredOrganizations.slice(0, displayCount);
  }, [filteredOrganizations, displayCount]);

  // Reset display count when search query changes
  useEffect(() => {
    setDisplayCount(50);
  }, [searchQuery]);

  // Infinite scroll handler - detect scrollable element automatically
  useEffect(() => {
    // Find the scrollable element (could be window or a scrollable container)
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | Window => {
      if (!element) return window;

      const parent = element.parentElement;
      if (!parent) return window;

      const overflowY = window.getComputedStyle(parent).overflowY;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

      if (isScrollable && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }

      return findScrollableParent(parent);
    };

    const scrollableElement = findScrollableParent(containerRef.current);

    const handleScroll = () => {
      let scrollTop: number;
      let scrollHeight: number;
      let clientHeight: number;

      if (scrollableElement === window) {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        const element = scrollableElement as HTMLElement;
        scrollTop = element.scrollTop;
        scrollHeight = element.scrollHeight;
        clientHeight = element.clientHeight;
      }

      // Load more when scrolled near the bottom (100px from bottom)
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (!isLoadingMore && displayCount < filteredOrganizations.length) {
          setIsLoadingMore(true);

          // Load more immediately for smooth infinite scroll
          setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + 50, filteredOrganizations.length));
            setIsLoadingMore(false);
          }, 100);
        }
      }
    };

    scrollableElement.addEventListener('scroll', handleScroll);
    return () => scrollableElement.removeEventListener('scroll', handleScroll);
  }, [displayCount, filteredOrganizations.length, isLoadingMore]);

  // Helper function to load all organizations
  const handleLoadAll = () => {
    setDisplayCount(filteredOrganizations.length);
  };

  // Define columns
  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      {
        key: 'name',
        label: 'Organization',
        sortable: true,
        render: (_, org) => (
          <div className="flex items-center gap-3">
            {org.logoUrl ? (
              <Avatar src={org.logoUrl} name={org.name} size="md" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-neutral-400" />
              </div>
            )}
            <div>
              <div className="font-medium text-neutral-900">{org.name}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'contactEmail',
        label: 'Contact Email',
        sortable: true,
        render: (email) => (
          <div className="text-sm text-neutral-900">{email || '-'}</div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        render: (date) => {
          const parsedDate = date ? new Date(date) : null;
          const formattedDate = parsedDate && isValid(parsedDate)
            ? format(parsedDate, 'MMM d, yyyy')
            : 'Invalid date';

          return (
            <div className="text-sm text-neutral-900">
              {formattedDate}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search organizations by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-neutral-600">
          Found {filteredOrganizations.length} organization
          {filteredOrganizations.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Table or Mobile Card View */}
      {isMobile ? (
        <OrganizationsMobileCardView
          organizations={displayedOrganizations}
          onOrganizationClick={onEditOrganization}
          searchQuery={searchQuery}
        />
      ) : (
        <DataTable
          columns={columns}
          data={displayedOrganizations}
          rowKey="id"
          onRowClick={onEditOrganization}
          paginated={false}
          emptyState={{
            icon: <Building2 className="w-12 h-12 text-neutral-400" />,
            title: searchQuery
              ? 'No organizations found'
              : 'No organizations yet',
            description: searchQuery
              ? 'Try adjusting your search criteria'
              : 'Organizations will appear here once created',
          }}
        />
      )}

      {/* Infinite Scroll Status */}
      {displayedOrganizations.length < filteredOrganizations.length && (
        <div className="text-center py-6 space-y-3">
          {isLoadingMore ? (
            <div className="text-sm text-neutral-600">Loading more...</div>
          ) : (
            <>
              <div className="text-sm text-neutral-600">
                Showing {displayedOrganizations.length} of {filteredOrganizations.length} organizations
              </div>
              <div className="text-xs text-neutral-500">
                Scroll down to load more, or
              </div>
              <button
                onClick={handleLoadAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Load all {filteredOrganizations.length} organizations
              </button>
            </>
          )}
        </div>
      )}

      {/* All loaded message */}
      {displayedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 50 && (
        <div className="text-center py-4 text-sm text-neutral-500">
          All {filteredOrganizations.length} organizations loaded
        </div>
      )}
    </div>
  );
}
