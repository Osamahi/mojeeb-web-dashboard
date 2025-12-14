/**
 * LeadsMobileCardView Component
 * Mobile card-based view for leads list
 * Includes infinite scroll, loading states, and empty states
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, UserPlus } from 'lucide-react';
import { LeadCard } from './LeadCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Lead, LeadStatus, LeadFilters } from '../types';

interface LeadsMobileCardViewProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  filters: LeadFilters;
  onRowClick: (lead: Lead) => void;
  onEditClick: (leadId: string) => void;
  onDeleteClick: (leadId: string) => void;
  onViewConversation: (conversationId: string) => void;
  onAddLeadClick: () => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  isUpdating?: boolean;
}

export function LeadsMobileCardView({
  leads,
  isLoading,
  isFetching,
  error,
  filters,
  onRowClick,
  onEditClick,
  onDeleteClick,
  onViewConversation,
  onAddLeadClick,
  onStatusChange,
  onCopyPhone,
  isUpdating = false,
}: LeadsMobileCardViewProps) {
  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Displayed leads with infinite scroll
  const displayedLeads = leads?.slice(0, displayCount);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [filters]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && leads && displayCount < leads.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + 20, leads.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, leads, isLoadingMore]);

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="Error Loading Leads"
          description="There was an error loading leads. Please try again."
        />
      </div>
    );
  }

  // Determine if we have filters active
  const hasActiveFilters =
    filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  // Empty state
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title={hasActiveFilters ? 'No leads found' : 'No leads yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'Add your first lead to get started tracking potential customers'
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={onAddLeadClick}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Cards with smooth transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`leads-${filters.search}-${filters.status}-${filters.dateFrom}-${filters.dateTo}`}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          {/* Subtle loading overlay during filter changes */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-neutral-200 shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />
                <span className="text-xs text-neutral-600 font-medium">Updating...</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {displayedLeads?.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <LeadCard
                  lead={lead}
                  onCardClick={onRowClick}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                  onViewConversation={onViewConversation}
                  onStatusChange={onStatusChange}
                  onCopyPhone={onCopyPhone}
                  isUpdating={isUpdating}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-600">Loading more leads...</span>
        </div>
      )}

      {/* End of results indicator */}
      {displayedLeads && leads && displayedLeads.length >= leads.length && leads.length > 20 && (
        <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
          <span className="text-sm text-neutral-500">All {leads.length} leads loaded</span>
        </div>
      )}
    </>
  );
}
