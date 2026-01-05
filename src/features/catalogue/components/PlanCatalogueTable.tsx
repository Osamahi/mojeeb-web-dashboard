import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Edit2 } from 'lucide-react';
import type { PlanCatalogueItem } from '../types/catalogue.types';

interface PlanCatalogueTableProps {
  plans: PlanCatalogueItem[];
  isLoading: boolean;
  onEdit: (plan: PlanCatalogueItem) => void;
}

export function PlanCatalogueTable({
  plans,
  isLoading,
  onEdit,
}: PlanCatalogueTableProps) {
  const { t } = useTranslation();

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      // Sort by message limit
      return a.messageLimit - b.messageLimit;
    });
  }, [plans]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-neutral-500">{t('catalogue.noPlansFound')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              {t('catalogue.table.code')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              {t('catalogue.table.name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              {t('catalogue.table.limits')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              {t('catalogue.table.createdAt')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {sortedPlans.map((plan) => (
            <tr key={plan.id} className="hover:bg-neutral-50">
              <td className="whitespace-nowrap px-6 py-4">
                <span className="text-sm text-neutral-500">
                  {plan.code}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-900">
                    {plan.name}
                  </span>
                  {plan.description && (
                    <span className="text-xs text-neutral-500">
                      {plan.description}
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col gap-0.5 text-sm text-neutral-900">
                  <span>{plan.messageLimit.toLocaleString()} {t('catalogue.table.messages')}</span>
                  <span className="text-xs text-neutral-500">
                    {plan.agentLimit} {t('catalogue.table.agents')}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                {format(new Date(plan.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(plan)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  title="Edit plan"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
