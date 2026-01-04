/**
 * Pricing service for managing Stripe products and prices.
 * Handles API calls to the admin pricing endpoints.
 */

import api from '@/lib/api';
import type {
  StripeProductWithPrices,
  ApiStripeProductWithPrices,
  StripePriceDetail,
  ApiStripePriceDetail,
  StripeCurrencyPrices,
  ApiStripeCurrencyPrices,
  StripeEnvironmentMode,
  CreateStripeProductRequest,
  ApiCreateStripeProductRequest,
  CreateStripePriceRequest,
  ApiCreateStripePriceRequest,
} from '../types/pricing.types';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

class PricingService {
  /**
   * Get all Stripe products with their associated prices.
   * Fetches real-time data from Stripe API.
   * SuperAdmin-only endpoint.
   * @param mode - Stripe environment mode (test or production). Defaults to test.
   */
  async getAllProductsWithPrices(
    mode: StripeEnvironmentMode = StripeEnvironmentMode.Test
  ): Promise<StripeProductWithPrices[]> {
    const response = await api.get<ApiResponse<ApiStripeProductWithPrices[]>>(
      '/api/admin/pricing/products',
      {
        params: { mode },
      }
    );

    // Transform snake_case API response to camelCase
    return response.data.data.map((product) => this.transformProductResponse(product));
  }

  /**
   * Create a new Stripe product.
   * SuperAdmin-only endpoint.
   * @param request - Product creation details
   * @param mode - Stripe environment mode (test or production). Defaults to test.
   */
  async createProduct(
    request: CreateStripeProductRequest,
    mode: StripeEnvironmentMode = StripeEnvironmentMode.Test
  ): Promise<StripeProductWithPrices> {
    // Transform camelCase request to snake_case for backend
    const apiRequest: ApiCreateStripeProductRequest = {
      name: request.name,
      description: request.description,
      is_active: request.isActive,
    };

    const response = await api.post<ApiResponse<ApiStripeProductWithPrices>>(
      '/api/admin/pricing/products',
      apiRequest,
      {
        params: { mode },
      }
    );

    // Transform snake_case API response to camelCase
    return this.transformProductResponse(response.data.data);
  }

  /**
   * Update an existing Stripe product.
   * SuperAdmin-only endpoint.
   * @param productId - Stripe product ID
   * @param request - Product update details
   * @param mode - Stripe environment mode (test or production). Defaults to test.
   */
  async updateProduct(
    productId: string,
    request: UpdateStripeProductRequest,
    mode: StripeEnvironmentMode = StripeEnvironmentMode.Test
  ): Promise<StripeProductWithPrices> {
    // Transform camelCase request to snake_case for backend
    const apiRequest: ApiUpdateStripeProductRequest = {
      name: request.name,
      description: request.description,
      is_active: request.isActive,
    };

    const response = await api.patch<ApiResponse<ApiStripeProductWithPrices>>(
      `/api/admin/pricing/products/${productId}`,
      apiRequest,
      {
        params: { mode },
      }
    );

    // Transform snake_case API response to camelCase
    return this.transformProductResponse(response.data.data);
  }

  /**
   * Archive a Stripe product.
   * Note: Stripe doesn't support permanent deletion - this archives the product.
   * SuperAdmin-only endpoint.
   * @param productId - Stripe product ID
   * @param mode - Stripe environment mode (test or production). Defaults to test.
   */
  async deleteProduct(
    productId: string,
    mode: StripeEnvironmentMode = StripeEnvironmentMode.Test
  ): Promise<void> {
    await api.delete(`/api/admin/pricing/products/${productId}`, {
      params: { mode },
    });
  }

  /**
   * Create a new recurring price for a Stripe product.
   * SuperAdmin-only endpoint.
   * @param request - Price creation details
   * @param mode - Stripe environment mode (test or production). Defaults to test.
   */
  async createPrice(
    request: CreateStripePriceRequest,
    mode: StripeEnvironmentMode = StripeEnvironmentMode.Test
  ): Promise<StripePriceDetail> {
    // Transform camelCase request to snake_case for backend
    const apiRequest: ApiCreateStripePriceRequest = {
      product_id: request.productId,
      amount: request.amount,
      currency: request.currency,
      billing_interval: request.billingInterval,
      is_active: request.isActive,
    };

    const response = await api.post<ApiResponse<ApiStripePriceDetail>>(
      '/api/admin/pricing/prices',
      apiRequest,
      {
        params: { mode },
      }
    );

    // Transform snake_case API response to camelCase
    return this.transformPriceDetail(response.data.data);
  }

  /**
   * Transform API response from snake_case to camelCase.
   */
  private transformProductResponse(
    apiProduct: ApiStripeProductWithPrices
  ): StripeProductWithPrices {
    const transformedPrices: Record<string, StripeCurrencyPrices> = {};

    // Transform prices for each currency
    Object.entries(apiProduct.prices).forEach(([currency, currencyPrices]) => {
      transformedPrices[currency] = this.transformCurrencyPrices(currencyPrices);
    });

    return {
      stripeProductId: apiProduct.stripe_product_id,
      name: apiProduct.name,
      description: apiProduct.description,
      isActive: apiProduct.is_active,
      prices: transformedPrices,
    };
  }

  /**
   * Transform currency prices from snake_case to camelCase.
   */
  private transformCurrencyPrices(
    apiPrices: ApiStripeCurrencyPrices
  ): StripeCurrencyPrices {
    return {
      monthly: apiPrices.monthly
        ? this.transformPriceDetail(apiPrices.monthly)
        : undefined,
      annual: apiPrices.annual ? this.transformPriceDetail(apiPrices.annual) : undefined,
    };
  }

  /**
   * Transform price detail from snake_case to camelCase.
   */
  private transformPriceDetail(apiPrice: ApiStripePriceDetail): StripePriceDetail {
    return {
      priceId: apiPrice.price_id,
      amount: apiPrice.amount,
      currency: apiPrice.currency,
      interval: apiPrice.interval,
      isActive: apiPrice.is_active,
    };
  }

  /**
   * Format price amount for display.
   * Converts cents to dollars/currency with proper formatting.
   */
  formatPrice(amount: number, currency: string): string {
    const displayAmount = amount / 100;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(displayAmount);
  }
}

export const pricingService = new PricingService();
