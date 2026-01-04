/**
 * Modal for editing an existing Stripe product.
 * SuperAdmin-only feature.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type {
  StripeProductWithPrices,
  UpdateStripeProductRequest,
  StripeEnvironmentMode,
} from '../types/pricing.types';

export interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productId: string, updates: UpdateStripeProductRequest) => void;
  product: StripeProductWithPrices | null;
  environmentMode: StripeEnvironmentMode;
  isLoading?: boolean;
}

export function EditProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  environmentMode,
  isLoading = false,
}: EditProductModalProps) {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Form validation
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Pre-populate form when product changes
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setErrors({});
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = t('pricing.validation.name_required');
    } else if (name.length > 200) {
      newErrors.name = t('pricing.validation.name_too_long');
    }

    if (description && description.length > 5000) {
      newErrors.description = t('pricing.validation.description_too_long');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !product) {
      return;
    }

    onSubmit(product.stripeProductId, {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive: product.isActive, // Preserve existing active status
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      onClose();
    }
  };

  if (!product) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('pricing.edit_product_title')}
      subtitle={t('pricing.edit_product_subtitle', { product: product.name })}
      maxWidth="md"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-6">
        {/* Product ID (Read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('pricing.field.product_id')}
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono">
            {product.stripeProductId}
          </div>
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
            {t('pricing.field.name')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('pricing.placeholder.name')}
            disabled={isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">
            {t('pricing.field.description')}
          </label>
          <Textarea
            id="product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('pricing.placeholder.description')}
            disabled={isLoading}
            rows={4}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading} className="flex-1">
            {isLoading ? t('pricing.updating') : t('pricing.update_product')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
