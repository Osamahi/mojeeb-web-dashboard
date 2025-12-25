import { useState } from 'react';
import { MoreVertical, Flag, Pause, Play, RefreshCw } from 'lucide-react';
import type { SubscriptionDetails } from '../types/subscription.types';
import { format } from 'date-fns';

interface SubscriptionTableProps {
  subscriptions: SubscriptionDetails[];
  onFlag: (id: string, flag: boolean) => void;
  onPause: (id: string, pause: boolean) => void;
  onRenew: (id: string) => void;
}

export function SubscriptionTable({
  subscriptions,
  onFlag,
  onPause,
  onRenew,
}: SubscriptionTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusBadgeClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Organization
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Billing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Current Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Limits
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {subscriptions.map((subscription) => (
            <tr key={subscription.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {subscription.organizationName}
                </div>
                <div className="text-sm text-gray-500">
                  {subscription.paymentMethod}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {subscription.planName}
                </div>
                <div className="text-sm text-gray-500">
                  {subscription.planCode}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${getStatusBadgeClasses(subscription.status)}`}
                  >
                    {subscription.status}
                  </span>
                  {subscription.isFlaggedNonPaying && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                      <Flag className="h-3 w-3" />
                      Non-paying
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-900">
                  {subscription.currency} {subscription.amount}
                </div>
                <div className="text-sm text-gray-500">
                  {subscription.billingInterval}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div>{format(new Date(subscription.currentPeriodStart), 'MMM d, yyyy')}</div>
                <div className="text-xs">
                  to {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div>{subscription.messageLimit} messages</div>
                <div>{subscription.agentLimit} agents</div>
              </td>
              <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === subscription.id ? null : subscription.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuId === subscription.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="py-1" role="menu">
                          <button
                            onClick={() => {
                              onRenew(subscription.id);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Renew Subscription
                          </button>

                          <button
                            onClick={() => {
                              onFlag(subscription.id, !subscription.isFlaggedNonPaying);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Flag className="h-4 w-4" />
                            {subscription.isFlaggedNonPaying ? 'Unflag' : 'Flag for Non-Payment'}
                          </button>

                          <button
                            onClick={() => {
                              onPause(subscription.id, subscription.status !== 'paused');
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {subscription.status === 'paused' ? (
                              <>
                                <Play className="h-4 w-4" />
                                Resume Subscription
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4" />
                                Pause Subscription
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
