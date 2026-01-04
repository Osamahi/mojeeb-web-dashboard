/**
 * Admin Pricing Management Page
 * SuperAdmin-only page to view current Stripe products and prices.
 * Displays real-time pricing data from Stripe API.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddProductModal } from '../components/AddProductModal';
import { AddPriceModal } from '../components/AddPriceModal';
import { EditProductModal } from '../components/EditProductModal';
import { ProductActionsMenu } from '../components/ProductActionsMenu';
import { useCreateProductMutation } from '../hooks/useCreateProductMutation';
import { useCreatePriceMutation } from '../hooks/useCreatePriceMutation';
import { useUpdateProductMutation } from '../hooks/useUpdateProductMutation';
import { useDeleteProductMutation } from '../hooks/useDeleteProductMutation';
import { pricingService } from '../services/pricingService';
import type {
  StripeProductWithPrices,
  Currency,
  CreateStripeProductRequest,
  CreateStripePriceRequest,
  UpdateStripeProductRequest,
} from '../types/pricing.types';
import { StripeEnvironmentMode } from '../types/pricing.types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AdminPricingPage() {
  const { t } = useTranslation();
  useDocumentTitle('pricing.admin_page_title');

  const [products, setProducts] = useState<StripeProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [environmentMode, setEnvironmentMode] = useState<StripeEnvironmentMode>(
    StripeEnvironmentMode.Test
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Price modal states
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StripeProductWithPrices | null>(null);

  // Product edit modal states
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<StripeProductWithPrices | null>(null);

  // Mutation hooks
  const createProductMutation = useCreateProductMutation();
  const createPriceMutation = useCreatePriceMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();

  /**
   * Load pricing data from Stripe API
   */
  const loadPricingData = useCallback(
    async (mode: StripeEnvironmentMode, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await pricingService.getAllProductsWithPrices(mode);
        setProducts(data);

        if (isRefresh) {
          toast.success(t('pricing.refresh_success'));
        }
      } catch (error) {
        console.error('Failed to load pricing data:', error);
        toast.error(t('pricing.load_failed'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  // Load pricing data when component mounts or environment mode changes
  useEffect(() => {
    loadPricingData(environmentMode);
  }, [loadPricingData, environmentMode]);

  /**
   * Handle refresh button click
   */
  const handleRefresh = useCallback(() => {
    loadPricingData(environmentMode, true);
  }, [loadPricingData, environmentMode]);

  /**
   * Handle environment mode change
   */
  const handleModeChange = useCallback(
    (newMode: StripeEnvironmentMode) => {
      setEnvironmentMode(newMode);
    },
    []
  );

  /**
   * Handle add product button click
   */
  const handleAddProductClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  /**
   * Handle product creation submission
   */
  const handleCreateProduct = useCallback(
    async (product: CreateStripeProductRequest) => {
      await createProductMutation.mutateAsync(
        { product, mode: environmentMode },
        {
          onSuccess: () => {
            setIsAddModalOpen(false);
            loadPricingData(environmentMode);
          },
        }
      );
    },
    [createProductMutation, environmentMode, loadPricingData]
  );

  /**
   * Handle add price button click
   */
  const handleAddPriceClick = useCallback((product: StripeProductWithPrices) => {
    setSelectedProduct(product);
    setIsAddPriceModalOpen(true);
  }, []);

  /**
   * Handle price creation submission
   */
  const handleCreatePrice = useCallback(
    async (priceData: CreateStripePriceRequest) => {
      await createPriceMutation.mutateAsync(
        { priceData, mode: environmentMode },
        {
          onSuccess: () => {
            setIsAddPriceModalOpen(false);
            setSelectedProduct(null);
            loadPricingData(environmentMode);
          },
        }
      );
    },
    [createPriceMutation, environmentMode, loadPricingData]
  );

  /**
   * Handle edit product click
   */
  const handleEditProductClick = useCallback((product: StripeProductWithPrices) => {
    setSelectedProductForEdit(product);
    setIsEditProductModalOpen(true);
  }, []);

  /**
   * Handle product update submission
   */
  const handleUpdateProduct = useCallback(
    async (productId: string, updates: UpdateStripeProductRequest) => {
      await updateProductMutation.mutateAsync(
        { productId, updates, mode: environmentMode },
        {
          onSuccess: () => {
            setIsEditProductModalOpen(false);
            setSelectedProductForEdit(null);
            loadPricingData(environmentMode);
          },
        }
      );
    },
    [updateProductMutation, environmentMode, loadPricingData]
  );

  /**
   * Handle archive product
   */
  const handleArchiveProduct = useCallback(
    async (productId: string) => {
      await deleteProductMutation.mutateAsync(
        { productId, mode: environmentMode },
        {
          onSuccess: () => {
            loadPricingData(environmentMode);
          },
        }
      );
    },
    [deleteProductMutation, environmentMode, loadPricingData]
  );

  /**
   * Render individual price cell for a specific currency and interval
   */
  const renderPriceCell = (
    product: StripeProductWithPrices,
    currency: string,
    interval: 'monthly' | 'annual'
  ) => {
    const currencyPrices = product.prices[currency];
    const price = currencyPrices?.[interval];

    if (!price) {
      return <span className="text-sm text-gray-400">—</span>;
    }

    return (
      <div className="flex items-center justify-end gap-2">
        <span className="font-semibold text-gray-900">
          {pricingService.formatPrice(price.amount, currency)}
        </span>
        {!price.isActive && (
          <Badge variant="secondary" className="text-xs">
            {t('pricing.inactive')}
          </Badge>
        )}
      </div>
    );
  };

  /**
   * Render product card
   */
  const renderProductCard = (product: StripeProductWithPrices) => {
    const currencies: Currency[] = ['USD', 'EGP', 'SAR'];
    const availableCurrencies = currencies.filter(
      (currency) => product.prices[currency]
    );

    return (
      <Card key={product.stripeProductId} className="p-6">
        <div className="space-y-4">
          {/* Product Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              </div>
              {product.description && (
                <p className="text-sm text-gray-600">{product.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {t('pricing.stripe_id')}: {product.stripeProductId}
              </p>
            </div>
            <ProductActionsMenu
              product={product}
              onEdit={handleEditProductClick}
              onAddPrice={handleAddPriceClick}
              onArchive={handleArchiveProduct}
            />
          </div>

          {/* Pricing Table */}
          {availableCurrencies.length > 0 ? (
            <div className="overflow-x-auto pt-4 border-t border-gray-200">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {t('pricing.field.billing_interval')}
                    </th>
                    {availableCurrencies.map((currency) => (
                      <th key={currency} className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        {currency}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600">
                      {t('pricing.monthly')}
                    </td>
                    {availableCurrencies.map((currency) => (
                      <td key={currency} className="py-3 px-4 text-right">
                        {renderPriceCell(product, currency, 'monthly')}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600">
                      {t('pricing.annual')}
                    </td>
                    {availableCurrencies.map((currency) => (
                      <td key={currency} className="py-3 px-4 text-right">
                        {renderPriceCell(product, currency, 'annual')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
              {t('pricing.no_prices_available')}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <BaseHeader
        title={t('pricing.admin_title')}
        subtitle={t('pricing.admin_subtitle')}
        additionalActions={
          <div className="flex items-center gap-2">
            {/* Environment Mode Selector */}
            <select
              value={environmentMode}
              onChange={(e) => handleModeChange(Number(e.target.value) as StripeEnvironmentMode)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              disabled={loading || refreshing}
            >
              <option value={StripeEnvironmentMode.Test}>
                {t('pricing.environment_test')}
              </option>
              <option value={StripeEnvironmentMode.Production}>
                {t('pricing.environment_production')}
              </option>
            </select>
          </div>
        }
        primaryAction={{
          label: t('pricing.add_product'),
          icon: Plus,
          onClick: handleAddProductClick,
          disabled: loading || refreshing,
        }}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProduct}
        environmentMode={environmentMode}
        isLoading={createProductMutation.isPending}
      />

      {/* Add Price Modal */}
      {selectedProduct && (
        <AddPriceModal
          isOpen={isAddPriceModalOpen}
          onClose={() => {
            setIsAddPriceModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleCreatePrice}
          productId={selectedProduct.stripeProductId}
          productName={selectedProduct.name}
          environmentMode={environmentMode}
          isLoading={createPriceMutation.isPending}
        />
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setSelectedProductForEdit(null);
        }}
        onSubmit={handleUpdateProduct}
        product={selectedProductForEdit}
        environmentMode={environmentMode}
        isLoading={updateProductMutation.isPending}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <EmptyState
          icon={<DollarSign className="w-12 h-12 text-neutral-400" />}
          title={t('pricing.no_products_title')}
          description={t('pricing.no_products_description')}
        />
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {t('pricing.total_products', { count: products.length })}
            </p>
          </div>
          {products.map(renderProductCard)}
        </div>
      )}
    </div>
  );
}
