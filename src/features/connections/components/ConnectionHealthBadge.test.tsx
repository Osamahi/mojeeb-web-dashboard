import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ConnectionHealthIndicator,
  ConnectionHealthDetails,
  ConnectionHealthBadge,
} from './ConnectionHealthBadge';
import type { ConnectionHealthStatus } from '../types';

describe('ConnectionHealthBadge', () => {
  const healthyStatus: ConnectionHealthStatus = {
    tokenValid: true,
    tokenExpiresAt: '2025-02-01T00:00:00Z',
    daysUntilExpiry: 30,
    webhookSubscriptionActive: true,
    permissions: ['pages_show_list', 'pages_messaging'],
    error: null,
  };

  const expiringStatus: ConnectionHealthStatus = {
    ...healthyStatus,
    daysUntilExpiry: 5,
  };

  const unhealthyStatus: ConnectionHealthStatus = {
    tokenValid: false,
    tokenExpiresAt: null,
    daysUntilExpiry: null,
    webhookSubscriptionActive: false,
    permissions: [],
    error: 'Token expired',
  };

  const webhookInactiveStatus: ConnectionHealthStatus = {
    ...healthyStatus,
    webhookSubscriptionActive: false,
  };

  describe('ConnectionHealthIndicator', () => {
    it('should return null when shouldCheckHealth is false', () => {
      const { container } = render(
        <ConnectionHealthIndicator
          healthStatus={healthyStatus}
          isHealthLoading={false}
          shouldCheckHealth={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should show loading icon when loading', () => {
      render(
        <ConnectionHealthIndicator
          healthStatus={undefined}
          isHealthLoading={true}
          shouldCheckHealth={true}
        />
      );
      const icon = screen.getByLabelText('Loading health status');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('animate-pulse');
    });

    it('should return null when health status is undefined and not loading', () => {
      const { container } = render(
        <ConnectionHealthIndicator
          healthStatus={undefined}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should show error icon when token is invalid', () => {
      render(
        <ConnectionHealthIndicator
          healthStatus={unhealthyStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      const icon = screen.getByLabelText('Connection health critical: token invalid');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-error');
    });

    it('should show warning icon when token expires soon (< 7 days)', () => {
      render(
        <ConnectionHealthIndicator
          healthStatus={expiringStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      const icon = screen.getByLabelText('Connection health warning: token expires in 5 days');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-warning');
    });

    it('should show success icon when connection is healthy', () => {
      render(
        <ConnectionHealthIndicator
          healthStatus={healthyStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      const icon = screen.getByLabelText('Connection health good');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-brand-green');
    });

    it('should prioritize token invalid over expiry warning', () => {
      const invalidAndExpiring: ConnectionHealthStatus = {
        ...unhealthyStatus,
        daysUntilExpiry: 3,
      };
      render(
        <ConnectionHealthIndicator
          healthStatus={invalidAndExpiring}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByLabelText('Connection health critical: token invalid')).toBeInTheDocument();
    });

    it('should not show warning for exactly 7 days', () => {
      const sevenDaysStatus: ConnectionHealthStatus = {
        ...healthyStatus,
        daysUntilExpiry: 7,
      };
      render(
        <ConnectionHealthIndicator
          healthStatus={sevenDaysStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      // Should show green check, not warning
      expect(screen.getByLabelText('Connection health good')).toBeInTheDocument();
    });

    it('should show warning for 6 days', () => {
      const sixDaysStatus: ConnectionHealthStatus = {
        ...healthyStatus,
        daysUntilExpiry: 6,
      };
      render(
        <ConnectionHealthIndicator
          healthStatus={sixDaysStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByLabelText(/token expires in 6 days/)).toBeInTheDocument();
    });

    it('should handle null daysUntilExpiry gracefully', () => {
      const nullExpiryStatus: ConnectionHealthStatus = {
        ...healthyStatus,
        daysUntilExpiry: null,
      };
      render(
        <ConnectionHealthIndicator
          healthStatus={nullExpiryStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      // Should show green check since token is valid
      expect(screen.getByLabelText('Connection health good')).toBeInTheDocument();
    });
  });

  describe('ConnectionHealthDetails', () => {
    it('should return null when shouldCheckHealth is false', () => {
      const { container } = render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should show Meta platforms only notice', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText(/Meta platforms only/)).toBeInTheDocument();
    });

    it('should show token expired message when token is invalid', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={unhealthyStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Token expired or invalid')).toBeInTheDocument();
    });

    it('should show expiry warning when token expires in less than 7 days', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={expiringStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Token expires in 5 days')).toBeInTheDocument();
    });

    it('should use singular "day" for 1 day', () => {
      const oneDayStatus: ConnectionHealthStatus = {
        ...healthyStatus,
        daysUntilExpiry: 1,
      };
      render(
        <ConnectionHealthDetails
          healthStatus={oneDayStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Token expires in 1 day')).toBeInTheDocument();
    });

    it('should use plural "days" for 0 days', () => {
      const zeroDaysStatus: ConnectionHealthStatus = {
        ...healthyStatus,
        daysUntilExpiry: 0,
      };
      render(
        <ConnectionHealthDetails
          healthStatus={zeroDaysStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Token expires in 0 days')).toBeInTheDocument();
    });

    it('should not show expiry warning when 7 or more days', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.queryByText(/Token expires in/)).not.toBeInTheDocument();
    });

    it('should show webhook inactive warning', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={webhookInactiveStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Webhook subscription inactive')).toBeInTheDocument();
    });

    it('should show error message when present', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={unhealthyStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText('Error: Token expired')).toBeInTheDocument();
    });

    it('should show refresh button when onRefresh is provided', () => {
      const onRefresh = vi.fn();
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
          onRefresh={onRefresh}
          isHealthLoading={false}
        />
      );
      expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    });

    it('should call onRefresh when button is clicked', () => {
      const onRefresh = vi.fn();
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
          onRefresh={onRefresh}
          isHealthLoading={false}
        />
      );
      fireEvent.click(screen.getByText('Refresh Status'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should show checking state when loading', () => {
      const onRefresh = vi.fn();
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
          onRefresh={onRefresh}
          isHealthLoading={true}
        />
      );
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });

    it('should disable refresh button when loading', () => {
      const onRefresh = vi.fn();
      render(
        <ConnectionHealthDetails
          healthStatus={healthyStatus}
          shouldCheckHealth={true}
          onRefresh={onRefresh}
          isHealthLoading={true}
        />
      );
      const button = screen.getByText('Checking...').closest('button');
      expect(button).toBeDisabled();
    });

    it('should show multiple warnings together', () => {
      const multipleWarningsStatus: ConnectionHealthStatus = {
        tokenValid: true,
        tokenExpiresAt: '2025-01-10T00:00:00Z',
        daysUntilExpiry: 3,
        webhookSubscriptionActive: false,
        permissions: [],
        error: null,
      };
      render(
        <ConnectionHealthDetails
          healthStatus={multipleWarningsStatus}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByText(/Token expires in 3 days/)).toBeInTheDocument();
      expect(screen.getByText('Webhook subscription inactive')).toBeInTheDocument();
    });

    it('should render nothing for health status when status is undefined', () => {
      render(
        <ConnectionHealthDetails
          healthStatus={undefined}
          shouldCheckHealth={true}
        />
      );
      // Should still show the Meta notice but no health details
      expect(screen.getByText(/Meta platforms only/)).toBeInTheDocument();
      expect(screen.queryByText('Token expired or invalid')).not.toBeInTheDocument();
    });
  });

  describe('ConnectionHealthBadge', () => {
    it('should render both indicator and details', () => {
      render(
        <ConnectionHealthBadge
          healthStatus={healthyStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
        />
      );
      expect(screen.getByLabelText('Connection health good')).toBeInTheDocument();
      expect(screen.getByText(/Meta platforms only/)).toBeInTheDocument();
    });

    it('should pass onRefresh to details', () => {
      const onRefresh = vi.fn();
      render(
        <ConnectionHealthBadge
          healthStatus={healthyStatus}
          isHealthLoading={false}
          shouldCheckHealth={true}
          onRefresh={onRefresh}
        />
      );
      expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    });
  });
});
