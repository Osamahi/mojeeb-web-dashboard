import { useMemo, useCallback } from 'react';
import { Package, Check, X, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { AddonPlan } from '../types/addon.types';

interface AddonPlansTableViewProps {
  plans: AddonPlan[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onEditClick: (plan: AddonPlan) => void;
  onDeleteClick: (plan: AddonPlan) => void;
  onCreateClick: () => void;
  isDeleting: boolean;
}

export function AddonPlansTableView({
  plans,
  isLoading,
  error,
  onEditClick,
  onDeleteClick,
  onCreateClick,
  isDeleting,
}: AddonPlansTableViewProps) {
  // Memoized columns configuration
  const columns = useMemo(() => [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '15%',
      render: (_: unknown, plan: AddonPlan) => (
        <code className="text-sm font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
          {plan.code}
        </code>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '20%',
      render: (_: unknown, plan: AddonPlan) => (
        <span className="text-sm font-medium text-neutral-900">{plan.name}</span>
      ),
    },
    {
      key: 'addon_type',
      label: 'Type',
      sortable: true,
      width: '15%',
      render: (_: unknown, plan: AddonPlan) => {
        const isMessageCredits = plan.addon_type === 'message_credits';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            isMessageCredits
              ? 'bg-blue-50 text-blue-700'
              : 'bg-purple-50 text-purple-700'
          }`}>
            {plan.addon_type === 'message_credits' ? 'Message Credits' : 'Agent Slots'}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      width: '15%',
      render: (_: unknown, plan: AddonPlan) => {
        const isMessageCredits = plan.addon_type === 'message_credits';
        return (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-neutral-900">
              +{plan.quantity.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-500">
              {isMessageCredits ? 'messages' : 'agents'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: '25%',
      render: (_: unknown, plan: AddonPlan) => (
        plan.description ? (
          <p className="text-sm text-neutral-600 max-w-xs">{plan.description}</p>
        ) : (
          <span className="text-sm text-neutral-400">—</span>
        )
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      width: '10%',
      render: (_: unknown, plan: AddonPlan) => (
        plan.is_active ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            <X className="w-3 h-3" />
            Inactive
          </span>
        )
      ),
    },
    {
      key: 'actions' as keyof AddonPlan,
      label: '',
      sortable: false,
      width: '100px',
      cellClassName: 'text-right pr-6',
      render: (_: unknown, plan: AddonPlan) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(plan);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
            title="Edit plan"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(plan);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
            title="Delete plan"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [onEditClick, onDeleteClick, isDeleting]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="animate-pulse p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 bg-neutral-200 rounded flex-1"></div>
                <div className="h-12 bg-neutral-200 rounded w-32"></div>
                <div className="h-12 bg-neutral-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<Package className="w-12 h-12 text-neutral-400" />}
          title="Failed to load add-on plans"
          description={error.message}
        />
      </div>
    );
  }

  // Empty state
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<Package className="w-12 h-12 text-neutral-400" />}
          title="No add-on plans found"
          description="Create your first add-on plan to get started"
          action={
            <Button onClick={onCreateClick}>
              <Package className="w-4 h-4 mr-2" />
              Create First Plan
            </Button>
          }
        />
      </div>
    );
  }

  // Table view
  return (
    <div className="relative bg-white rounded-lg border border-neutral-200">
      <DataTable
        data={plans}
        rowKey="id"
        paginated={false}
        columns={columns}
      />
    </div>
  );
}
