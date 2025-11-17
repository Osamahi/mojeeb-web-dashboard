import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import type {
  ApiPlatformConnectionResponse,
  ApiConnectionHealthResponse,
} from '../types';
import { ApiError, NotFoundError } from '@/lib/errors';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from '@/lib/logger';

// Mock the entire api module with test axios instance
vi.mock('@/lib/api', async () => {
  const axios = await import('axios');

  const testApi = axios.default.create({
    baseURL: 'http://localhost:5267',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    default: testApi,
    API_URL: 'http://localhost:5267',
  };
});

// Import after mocks
import { connectionService } from './connectionService';

describe('connectionService', () => {
  const mockApiConnection: ApiPlatformConnectionResponse = {
    id: 'conn-123',
    agent_id: 'agent-456',
    platform: 'facebook',
    platform_account_id: 'fb-page-789',
    platform_account_name: 'Test Page',
    platform_account_handle: '@testpage',
    platform_picture_url: 'https://example.com/pic.jpg',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    metadata: {
      parent_page_id: 'parent-123',
      follower_count: 5000,
    },
  };

  const mockHealthyApiResponse: ApiConnectionHealthResponse = {
    is_healthy: true,
    status: 'healthy',
    message: 'Connection is healthy',
    expires_at: '2025-02-01T00:00:00Z',
    token_check_raw_json: JSON.stringify({
      data: {
        scopes: ['pages_show_list', 'pages_messaging', 'pages_manage_metadata'],
        data_access_expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
      },
    }),
    subscription_check_raw_json: JSON.stringify({
      data: [{ object: 'page', callback_url: 'https://example.com/webhook' }],
    }),
  };

  const mockUnhealthyApiResponse: ApiConnectionHealthResponse = {
    is_healthy: false,
    status: 'unhealthy',
    message: 'Token expired',
    expires_at: null,
    token_check_raw_json: JSON.stringify({
      data: {
        is_valid: false,
      },
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConnections', () => {
    it('should fetch connections and transform to camelCase', async () => {
      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({
            data: [mockApiConnection],
          });
        })
      );

      const result = await connectionService.getConnections('agent-456');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'conn-123',
        agentId: 'agent-456',
        platform: 'facebook',
        platformAccountId: 'fb-page-789',
        platformAccountName: 'Test Page',
        platformAccountHandle: '@testpage',
        platformPictureUrl: 'https://example.com/pic.jpg',
        parentPageId: 'parent-123',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      });
    });

    it('should handle empty connections list', async () => {
      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const result = await connectionService.getConnections('agent-456');

      expect(result).toEqual([]);
    });

    it('should handle missing data property gracefully', async () => {
      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({});
        })
      );

      const result = await connectionService.getConnections('agent-456');

      expect(result).toEqual([]);
    });

    it('should log warning and fallback for unknown platform type', async () => {
      const unknownPlatformConnection = {
        ...mockApiConnection,
        platform: 'unknown_platform',
      };

      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({ data: [unknownPlatformConnection] });
        })
      );

      const result = await connectionService.getConnections('agent-456');

      expect(result[0].platform).toBe('web');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unknown platform type 'unknown_platform'")
      );
    });

    it('should throw NotFoundError on 404', async () => {
      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json(
            { message: 'Agent not found' },
            { status: 404 }
          );
        })
      );

      await expect(connectionService.getConnections('agent-456')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ApiError on server error', async () => {
      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(connectionService.getConnections('agent-456')).rejects.toThrow(
        ApiError
      );
    });

    it('should handle null optional fields', async () => {
      const connectionWithNulls = {
        ...mockApiConnection,
        platform_account_name: null,
        platform_account_handle: null,
        platform_picture_url: null,
        metadata: null,
      };

      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({ data: [connectionWithNulls] });
        })
      );

      const result = await connectionService.getConnections('agent-456');

      expect(result[0].platformAccountName).toBeNull();
      expect(result[0].platformAccountHandle).toBeNull();
      expect(result[0].platformPictureUrl).toBeNull();
      expect(result[0].parentPageId).toBeNull();
      expect(result[0].platformMetadata).toBeNull();
    });

    it('should transform all valid platform types', async () => {
      const platforms = ['web', 'widget', 'facebook', 'instagram', 'whatsapp', 'tiktok', 'twitter', 'linkedin'];
      const connections = platforms.map((platform, index) => ({
        ...mockApiConnection,
        id: `conn-${index}`,
        platform,
      }));

      server.use(
        http.get('http://localhost:5267/api/social/connections', () => {
          return HttpResponse.json({ data: connections });
        })
      );

      const result = await connectionService.getConnections('agent-456');

      platforms.forEach((platform, index) => {
        expect(result[index].platform).toBe(platform);
      });
    });
  });

  describe('disconnectPlatform', () => {
    it('should disconnect platform successfully', async () => {
      server.use(
        http.delete('http://localhost:5267/api/social/connections/conn-123', () => {
          return HttpResponse.json({ message: 'Connection disconnected successfully' });
        })
      );

      await expect(connectionService.disconnectPlatform('conn-123')).resolves.not.toThrow();
    });

    it('should throw NotFoundError on 404', async () => {
      server.use(
        http.delete('http://localhost:5267/api/social/connections/nonexistent', () => {
          return HttpResponse.json(
            { message: 'Connection not found' },
            { status: 404 }
          );
        })
      );

      await expect(connectionService.disconnectPlatform('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ApiError on 403 forbidden', async () => {
      server.use(
        http.delete('http://localhost:5267/api/social/connections/conn-123', () => {
          return HttpResponse.json(
            { message: 'Forbidden' },
            { status: 403 }
          );
        })
      );

      await expect(connectionService.disconnectPlatform('conn-123')).rejects.toThrow(
        ApiError
      );
    });
  });

  describe('checkConnectionHealth', () => {
    it('should check health and transform healthy response', async () => {
      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(mockHealthyApiResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.tokenValid).toBe(true);
      expect(result.permissions).toEqual(['pages_show_list', 'pages_messaging', 'pages_manage_metadata']);
      expect(result.webhookSubscriptionActive).toBe(true);
      // Allow for timing variance (29-30 days)
      expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(29);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(30);
      expect(result.tokenExpiresAt).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should handle unhealthy connection', async () => {
      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(mockUnhealthyApiResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.tokenValid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should handle malformed token_check_raw_json gracefully', async () => {
      const malformedResponse = {
        ...mockHealthyApiResponse,
        token_check_raw_json: 'not valid json',
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(malformedResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.tokenValid).toBe(true);
      expect(result.permissions).toEqual([]);
      expect(result.tokenExpiresAt).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to parse token_check_raw_json',
        expect.any(Error)
      );
    });

    it('should handle missing scopes in token data', async () => {
      const responseWithoutScopes = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            is_valid: true,
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(responseWithoutScopes);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.permissions).toEqual([]);
    });

    it('should warn when scopes is not an array', async () => {
      const invalidScopesResponse = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            scopes: 'not an array',
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(invalidScopesResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.permissions).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'token_check_raw_json.data.scopes is not an array',
        expect.any(Object)
      );
    });

    it('should filter non-string values from scopes', async () => {
      const mixedScopesResponse = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            scopes: ['valid_scope', 123, null, 'another_scope', undefined],
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(mixedScopesResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.permissions).toEqual(['valid_scope', 'another_scope']);
    });

    it('should handle invalid expiry timestamp', async () => {
      const invalidExpiryResponse = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            scopes: ['read'],
            data_access_expires_at: 'not a number',
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(invalidExpiryResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.tokenExpiresAt).toBeNull();
      expect(result.daysUntilExpiry).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'token_check_raw_json.data.data_access_expires_at is invalid',
        expect.any(Object)
      );
    });

    it('should handle zero or negative expiry timestamp', async () => {
      const zeroExpiryResponse = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            scopes: ['read'],
            data_access_expires_at: 0,
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(zeroExpiryResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.tokenExpiresAt).toBeNull();
      expect(result.daysUntilExpiry).toBeNull();
    });

    it('should handle webhook subscription with error', async () => {
      const subscriptionErrorResponse = {
        ...mockHealthyApiResponse,
        subscription_check_raw_json: JSON.stringify({
          error: {
            message: 'Subscription not found',
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(subscriptionErrorResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.webhookSubscriptionActive).toBe(false);
    });

    it('should handle malformed subscription_check_raw_json', async () => {
      const malformedSubscriptionResponse = {
        ...mockHealthyApiResponse,
        subscription_check_raw_json: 'invalid json',
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(malformedSubscriptionResponse);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      expect(result.webhookSubscriptionActive).toBe(true); // Default value
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to parse subscription_check_raw_json',
        expect.any(Error)
      );
    });

    it('should throw NotFoundError on 404', async () => {
      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/nonexistent', () => {
          return HttpResponse.json(
            { message: 'Connection not found' },
            { status: 404 }
          );
        })
      );

      await expect(
        connectionService.checkConnectionHealth('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });

    it('should calculate correct days until expiry', async () => {
      // Set expiry to exactly 10 days from now
      const tenDaysFromNow = Math.floor(Date.now() / 1000) + 86400 * 10;
      const response = {
        ...mockHealthyApiResponse,
        token_check_raw_json: JSON.stringify({
          data: {
            scopes: ['read'],
            data_access_expires_at: tenDaysFromNow,
          },
        }),
      };

      server.use(
        http.get('http://localhost:5267/api/FacebookBusinessOAuth/check-health/conn-123', () => {
          return HttpResponse.json(response);
        })
      );

      const result = await connectionService.checkConnectionHealth('conn-123');

      // Should be approximately 10 days (could be 9-10 depending on timing)
      expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(9);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(10);
    });
  });
});
