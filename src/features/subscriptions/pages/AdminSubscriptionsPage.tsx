import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, RefreshCw, Filter, Search, Loader2 } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionDetails, SubscriptionFilters, PlanCode, SubscriptionStatus } from '../types/subscription.types';
import { CreateSubscriptionModal } from '../components/CreateSubscriptionModal';
import { SubscriptionTable } from '../components/SubscriptionTable';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { toast } from 'sonner';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [searchInput, setSearchInput] = useState(''); // Local search input for debouncing

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const pageSize = 50; // Fixed page size for infinite scroll

  // Load subscriptions with infinite scroll
  const loadSubscriptions = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await subscriptionService.getAllSubscriptions(filters, pageNum, pageSize);

      console.log('📊 Infinite scroll response:', {
        page: pageNum,
        itemsCount: response.items.length,
        totalCount: response.pagination.totalCount,
        hasNext: response.pagination.hasNext
      });

      if (append) {
        // Append new items to existing list, filtering out duplicates
        setSubscriptions(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newItems = response.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        // Replace list (initial load or filter change)
        setSubscriptions(response.items);
      }

      setTotalCount(response.pagination.totalCount);
      setHasMore(response.pagination.hasNext);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.searchTerm || '')) {
        setFilters(prev => ({ ...prev, searchTerm: searchInput || undefined }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    setSubscriptions([]);
    loadSubscriptions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSubscriptions is recreated on every render, but we only want to reload when filters change
  }, [filters]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          console.log('📜 Loading more subscriptions, page:', page + 1);
          const nextPage = page + 1;
          setPage(nextPage);
          loadSubscriptions(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [page, hasMore, loading, loadingMore]);

  // Handle subscription actions
  const handleFlag = async (id: string, flag: boolean) => {
    try {
      await subscriptionService.flagSubscription(id, flag);
      toast.success(flag ? 'Subscription flagged for non-payment' : 'Subscription unflagged');
      handleRefresh();
    } catch (error) {
      console.error('Failed to flag subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handlePause = async (id: string, pause: boolean) => {
    try {
      await subscriptionService.pauseSubscription(id, pause);
      toast.success(pause ? 'Subscription paused' : 'Subscription resumed');
      handleRefresh();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await subscriptionService.renewSubscription(id);
      toast.success('Subscription renewed successfully');
      handleRefresh();
    } catch (error) {
      console.error('Failed to renew subscription:', error);
      toast.error('Failed to renew subscription');
    }
  };

  // Refresh handler - reset infinite scroll state
  const handleRefresh = useCallback(() => {
    setPage(1);
    setSubscriptions([]);
    setHasMore(true);
    loadSubscriptions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Stable callback references for BaseHeader
  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <BaseHeader
        title="Subscriptions"
        subtitle="Manage organization subscriptions and billing"
        primaryAction={{
          label: "Create Subscription",
          icon: Plus,
          onClick: handleCreateClick
        }}
      />

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by organization name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as SubscriptionStatus || undefined })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={filters.planCode || ''}
            onChange={(e) => {
              const newPlanCode = e.target.value || undefined;
              console.log('🔍 Plan filter changed:', { value: e.target.value, newPlanCode });
              setFilters({ ...filters, planCode: newPlanCode as PlanCode | undefined });
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          /* Skeleton Table Loading State */
          <div className="overflow-hidden">
            {/* Table Header Skeleton */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-6 gap-4 px-6 py-3">
                {['Organization', 'Plan', 'Amount', 'Status', 'Next Renewal', 'Actions'].map((header, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="divide-y divide-gray-200">
              {[...Array(5)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-6 gap-4 px-6 py-4 animate-pulse">
                  {/* Organization ID */}
                  <div className="space-y-1">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
                  </div>

                  {/* Plan */}
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-100 rounded"></div>
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>

                  {/* Next Renewal */}
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <SubscriptionTable
              subscriptions={subscriptions}
              onFlag={handleFlag}
              onPause={handlePause}
              onRenew={handleRenew}
            />

            {/* Infinite Scroll Indicator */}
            <div ref={observerTarget} className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more subscriptions...</span>
                </div>
              ) : hasMore ? (
                <div className="text-center text-sm text-gray-500">
                  Scroll down to load more • Showing {subscriptions.length} of {totalCount}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  All {totalCount} subscriptions loaded
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Subscription Modal */}
      <CreateSubscriptionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
