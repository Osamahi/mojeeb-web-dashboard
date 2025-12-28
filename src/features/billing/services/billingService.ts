import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/lib/logger';
import type {
  CreateCheckoutRequest,
  CreateBillingPortalRequest,
  CancelSubscriptionRequest,
  ChangePlanRequest,
  GetInvoicesParams,
  CheckoutSession,
  BillingPortalSession,
  CancelSubscriptionResult,
  ChangePlanResult,
  InvoiceList,
  Invoice,
  ApiCheckoutSessionResponse,
  ApiBillingPortalResponse,
  ApiCancelSubscriptionResponse,
  ApiChangePlanResponse,
  ApiInvoiceListResponse,
  ApiInvoice,
} from '../types/billing.types';

/**
 * Billing service for Stripe integration
 *
 * Handles all Stripe-related API calls including:
 * - Checkout session creation
 * - Billing portal access
 * - Subscription cancellation
 * - Plan changes (upgrades/downgrades)
 * - Invoice history retrieval
 */
class BillingService {
  private readonly baseUrl = '/api/stripe';

  // ==========================================================================
  // TRANSFORMATION METHODS (snake_case → camelCase)
  // ==========================================================================

  /**
   * Transform API checkout session response to frontend format
   */
  private transformCheckoutSession(apiResponse: ApiCheckoutSessionResponse): CheckoutSession {
    return {
      sessionId: apiResponse.session_id,
      sessionUrl: apiResponse.session_url,
      expiresAt: apiResponse.expires_at,
    };
  }

  /**
   * Transform API billing portal response to frontend format
   */
  private transformBillingPortalSession(
    apiResponse: ApiBillingPortalResponse
  ): BillingPortalSession {
    return {
      sessionUrl: apiResponse.session_url,
    };
  }

  /**
   * Transform API cancellation response to frontend format
   */
  private transformCancelSubscriptionResult(
    apiResponse: ApiCancelSubscriptionResponse
  ): CancelSubscriptionResult {
    return {
      success: apiResponse.success,
      subscriptionId: apiResponse.subscription_id,
      canceledAt: apiResponse.canceled_at,
      cancelAtPeriodEnd: apiResponse.cancel_at_period_end,
      currentPeriodEnd: apiResponse.current_period_end,
    };
  }

  /**
   * Transform API plan change response to frontend format
   */
  private transformChangePlanResult(apiResponse: ApiChangePlanResponse): ChangePlanResult {
    return {
      success: apiResponse.success,
      subscriptionId: apiResponse.subscription_id,
      newPlanCode: apiResponse.new_plan_code,
      prorationAmount: apiResponse.proration_amount,
      effectiveDate: apiResponse.effective_date,
    };
  }

  /**
   * Transform API invoice to frontend format
   */
  private transformInvoice(apiInvoice: ApiInvoice): Invoice {
    return {
      id: apiInvoice.id,
      number: apiInvoice.number,
      amountDue: apiInvoice.amount_due,
      amountPaid: apiInvoice.amount_paid,
      currency: apiInvoice.currency,
      status: apiInvoice.status,
      created: apiInvoice.created,
      periodStart: apiInvoice.period_start,
      periodEnd: apiInvoice.period_end,
      invoicePdf: apiInvoice.invoice_pdf,
      hostedInvoiceUrl: apiInvoice.hosted_invoice_url,
    };
  }

  /**
   * Transform API invoice list response to frontend format
   */
  private transformInvoiceList(apiResponse: ApiInvoiceListResponse): InvoiceList {
    return {
      invoices: apiResponse.invoices.map((inv) => this.transformInvoice(inv)),
      hasMore: apiResponse.has_more,
      totalCount: apiResponse.total_count,
    };
  }

  // ==========================================================================
  // PUBLIC API METHODS
  // ==========================================================================

  /**
   * Create a Stripe checkout session
   *
   * Redirects user to Stripe-hosted checkout page for payment.
   *
   * @param request - Checkout session parameters
   * @returns Checkout session with redirect URL
   * @throws Error if checkout session creation fails
   */
  async createCheckoutSession(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    logger.info('[BillingService]', 'Creating checkout session', {
      planId: request.planId,
      currency: request.currency,
      billingInterval: request.billingInterval,
    });

    try {
      const response = await api.post<ApiResponse<ApiCheckoutSessionResponse>>(
        `${this.baseUrl}/checkout`,
        request
      );

      const session = this.transformCheckoutSession(response.data.data);

      logger.info('[BillingService]', 'Checkout session created', {
        sessionId: session.sessionId,
      });

      return session;
    } catch (error) {
      logger.error('[BillingService]', 'Failed to create checkout session', error);
      throw error;
    }
  }

  /**
   * Create a Stripe billing portal session
   *
   * Redirects user to Stripe-hosted billing portal for payment method management,
   * invoice viewing, and subscription cancellation.
   *
   * @param request - Billing portal parameters (optional return URL)
   * @returns Billing portal session with redirect URL
   * @throws Error if portal session creation fails
   */
  async createBillingPortalSession(
    request?: CreateBillingPortalRequest
  ): Promise<BillingPortalSession> {
    logger.info('[BillingService]', 'Creating billing portal session', {
      returnUrl: request?.returnUrl,
    });

    try {
      const response = await api.post<ApiResponse<ApiBillingPortalResponse>>(
        `${this.baseUrl}/billing-portal`,
        request || {}
      );

      const session = this.transformBillingPortalSession(response.data.data);

      logger.info('[BillingService]', 'Billing portal session created');

      return session;
    } catch (error) {
      logger.error('[BillingService]', 'Failed to create billing portal session', error);
      throw error;
    }
  }

  /**
   * Cancel the current subscription
   *
   * Can cancel immediately or at the end of the current billing period.
   *
   * @param request - Cancellation parameters
   * @returns Cancellation result with effective date
   * @throws Error if cancellation fails
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResult> {
    logger.info('[BillingService]', 'Canceling subscription', {
      cancelAtPeriodEnd: request.cancelAtPeriodEnd,
    });

    try {
      const response = await api.post<ApiResponse<ApiCancelSubscriptionResponse>>(
        `${this.baseUrl}/cancel`,
        request
      );

      const result = this.transformCancelSubscriptionResult(response.data.data);

      logger.info('[BillingService]', 'Subscription canceled', {
        subscriptionId: result.subscriptionId,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      });

      return result;
    } catch (error) {
      logger.error('[BillingService]', 'Failed to cancel subscription', error);
      throw error;
    }
  }

  /**
   * Change subscription plan (upgrade or downgrade)
   *
   * Can apply immediately with proration or at the next billing cycle.
   *
   * @param request - Plan change parameters
   * @returns Plan change result with proration details
   * @throws Error if plan change fails
   */
  async changePlan(request: ChangePlanRequest): Promise<ChangePlanResult> {
    logger.info('[BillingService]', 'Changing plan', {
      newPlanId: request.newPlanId,
      prorate: request.prorate,
    });

    try {
      const response = await api.post<ApiResponse<ApiChangePlanResponse>>(
        `${this.baseUrl}/change-plan`,
        request
      );

      const result = this.transformChangePlanResult(response.data.data);

      logger.info('[BillingService]', 'Plan changed successfully', {
        subscriptionId: result.subscriptionId,
        newPlanCode: result.newPlanCode,
        prorationAmount: result.prorationAmount,
      });

      return result;
    } catch (error) {
      logger.error('[BillingService]', 'Failed to change plan', error);
      throw error;
    }
  }

  /**
   * Get invoice history
   *
   * Supports cursor-based pagination.
   *
   * @param params - Query parameters (limit, cursor)
   * @returns List of invoices with pagination info
   * @throws Error if fetching invoices fails
   */
  async getInvoices(params?: GetInvoicesParams): Promise<InvoiceList> {
    logger.info('[BillingService]', 'Fetching invoices', {
      limit: params?.limit,
      startingAfter: params?.startingAfter,
    });

    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.startingAfter) {
        queryParams.append('startingAfter', params.startingAfter);
      }

      const url = `${this.baseUrl}/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await api.get<ApiResponse<ApiInvoiceListResponse>>(url);

      const invoiceList = this.transformInvoiceList(response.data.data);

      logger.info('[BillingService]', 'Invoices fetched', {
        count: invoiceList.invoices.length,
        hasMore: invoiceList.hasMore,
        totalCount: invoiceList.totalCount,
      });

      return invoiceList;
    } catch (error) {
      logger.error('[BillingService]', 'Failed to fetch invoices', error);
      throw error;
    }
  }
}

// Export singleton instance
export const billingService = new BillingService();
