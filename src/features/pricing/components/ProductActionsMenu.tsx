/**
 * Dropdown actions menu for Stripe products.
 * Provides Edit, Add Price, and Archive actions for products.
 * SuperAdmin-only feature.
 */

import { useState } from 'react';
import { MoreVertical, Edit, Plus, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/useConfirm';
import type { StripeProductWithPrices } from '../types/pricing.types';

export interface ProductActionsMenuProps {
  product: StripeProductWithPrices;
  onEdit: (product: StripeProductWithPrices) => void;
  onAddPrice: (product: StripeProductWithPrices) => void;
  onArchive: (productId: string) => void;
}

export function ProductActionsMenu({ product, onEdit, onAddPrice, onArchive }: ProductActionsMenuProps) {
  const { t } = useTranslation();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = () => {
    onEdit(product);
    setIsOpen(false);
  };

  const handleAddPrice = () => {
    onAddPrice(product);
    setIsOpen(false);
  };

  const handleArchive = async () => {
    const confirmed = await confirm({
      title: t('pricing.archive_product'),
      message: t('pricing.confirm_archive_product'),
      confirmText: t('common.archive'),
      variant: 'danger',
    });

    if (confirmed) {
      onArchive(product.stripeProductId);
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={t('common.actions')}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu">
                {/* Edit Product */}
                <button
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  role="menuitem"
                >
                  <Edit className="h-4 w-4" />
                  {t('pricing.edit_product')}
                </button>

                {/* Add Price */}
                <button
                  onClick={handleAddPrice}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  role="menuitem"
                >
                  <Plus className="h-4 w-4" />
                  {t('pricing.add_price')}
                </button>

                {/* Archive Product */}
                <button
                  onClick={handleArchive}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  role="menuitem"
                >
                  <Archive className="h-4 w-4" />
                  {t('pricing.archive_product')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
}
