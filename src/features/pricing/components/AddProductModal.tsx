/**
 * Modal for creating a new Stripe product.
 * SuperAdmin-only feature.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { CreateStripeProductRequest, StripeEnvironmentMode } from '../types/pricing.types';

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: CreateStripeProductRequest) => void;
  environmentMode: StripeEnvironmentMode;
  isLoading?: boolean;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  environmentMode,
  isLoading = false,
}: AddProductModalProps) {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Form validation
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

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
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isActive: true, // Always create products as active
    });

    // Reset form
    setName('');
    setDescription('');
    setErrors({});
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      setErrors({});
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('pricing.add_product_title')}
      subtitle={
        environmentMode === 0
          ? t('pricing.add_product_subtitle_test')
          : t('pricing.add_product_subtitle_production')
      }
      maxWidth="md"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-6">
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
          <Button onClick={handleSubmit} disabled={isLoading} loading={isLoading} className="flex-1">
            {isLoading ? t('pricing.creating') : t('pricing.create_product')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
