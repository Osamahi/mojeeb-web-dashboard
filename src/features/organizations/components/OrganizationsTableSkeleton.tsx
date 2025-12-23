/**
 * Organizations Table Skeleton
 * Loading skeleton for organizations table
 */

import { Skeleton } from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';

export default function OrganizationsTableSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="space-y-4">
        {/* Search Bar Skeleton */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300" />
          <Skeleton height="40px" className="rounded-md" />
        </div>

        {/* Table Skeleton */}
        <div className="space-y-3 mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 pb-3 border-b border-neutral-200">
            <Skeleton height="16px" width="120px" />
            <Skeleton height="16px" width="100px" />
            <Skeleton height="16px" width="80px" />
            <Skeleton height="16px" width="80px" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 py-4 border-b border-neutral-100"
            >
              {/* Organization Column (with avatar) */}
              <div className="flex items-center gap-3">
                <Skeleton circle width="40px" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="16px" width="70%" />
                  <Skeleton height="12px" width="40%" />
                </div>
              </div>

              {/* Contact Email Column */}
              <div className="flex items-center">
                <Skeleton height="14px" width="80%" />
              </div>

              {/* Owner ID Column */}
              <div className="flex items-center">
                <Skeleton height="14px" width="60%" />
              </div>

              {/* Created Column */}
              <div className="flex items-center">
                <Skeleton height="14px" width="70%" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Skeleton height="14px" width="180px" />
          <div className="flex items-center gap-2">
            <Skeleton height="32px" width="32px" className="rounded-md" />
            <Skeleton height="32px" width="32px" className="rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
