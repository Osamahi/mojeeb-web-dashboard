/**
 * authSession — single coordinator for token refresh.
 *
 * Why this exists:
 *   Before this module, three independent code paths could call
 *   /api/auth/refresh in parallel (axios 401 interceptor, AuthInitializer
 *   mount, useOnAppResume). Even though /refresh itself was deduplicated,
 *   the *side effects* (storing tokens, updating Supabase auth, syncing
 *   the Zustand store) ran once per caller, producing duplicate work and
 *   broken Supabase realtime auth.
 *
 *   This module owns the ONLY way to refresh. Everyone calls
 *   ensureFresh(); concurrent callers get the same Promise; side effects
 *   run exactly once per real network call.
 *
 * Error model (see ../features/auth/errors.ts):
 *   - TerminalAuthError → refresh token is dead. Caller should sign out.
 *   - TransientAuthError → network/server failure. Caller should NOT sign
 *     out; the next API call will trigger another refresh attempt.
 *
 * Notes:
 *   - We use raw axios (not the api instance) for the /refresh POST so the
 *     401 interceptor can't recurse on us.
 *   - updateSupabaseAuth is fire-and-forget by design: a Supabase realtime
 *     auth blip should not abort token refresh. Realtime will recover on
 *     its own next subscribe.
 */

import axios, { AxiosError, isAxiosError } from 'axios';
import { env } from '@/config/env';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStore';
import { updateSupabaseAuth } from './supabase';
import { logger } from './logger';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { isTokenExpired } from '@/features/auth/utils/tokenUtils';
import {
  TerminalAuthError,
  TransientAuthError,
} from '@/features/auth/errors';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Buffer applied to access-token expiry so we don't return a token that's
 * about to expire mid-request. Matches tokenUtils' default.
 */
const EXPIRY_BUFFER_SECONDS = 30;

class AuthSession {
  private inflight: Promise<SessionTokens> | null = null;

  /**
   * Get fresh tokens, refreshing if needed. Concurrent callers share one
   * in-flight refresh.
   *
   * @throws {TerminalAuthError}  refresh token dead — caller should sign out
   * @throws {TransientAuthError} network/server hiccup — caller should retry
   */
  async ensureFresh(): Promise<SessionTokens> {
    // Fast path: token still valid → no network.
    const access = getAccessToken();
    const refresh = getRefreshToken();
    if (access && refresh && !isTokenExpired(access, EXPIRY_BUFFER_SECONDS)) {
      return { accessToken: access, refreshToken: refresh };
    }

    // Coalesce concurrent callers onto the same promise.
    if (this.inflight) return this.inflight;

    this.inflight = this.doRefresh().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async doRefresh(): Promise<SessionTokens> {
    const refresh = getRefreshToken();
    if (!refresh) {
      throw new TerminalAuthError('no_refresh_token');
    }

    let tokens: SessionTokens;
    try {
      const { data } = await axios.post<RefreshResponse>(
        `${env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken: refresh },
      );
      tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      if (isRefreshTokenRejection(error)) {
        throw new TerminalAuthError('refresh_rejected', error);
      }
      throw new TransientAuthError(error);
    }

    // Side effects — exactly once per real refresh.
    setTokens(tokens.accessToken, tokens.refreshToken);
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    // Best-effort. Failure here doesn't fail the refresh; realtime will
    // re-auth on its own next subscribe cycle.
    updateSupabaseAuth(tokens.accessToken, tokens.refreshToken).catch((err) => {
      logger.warn('[authSession] Supabase auth sync failed (non-fatal)', err);
    });

    return tokens;
  }
}

/**
 * The /refresh endpoint returns 401 (or 403) when the refresh token is
 * itself invalid/expired/revoked. Anything else (network error, 5xx,
 * timeout) is transient.
 */
function isRefreshTokenRejection(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = (error as AxiosError).response?.status;
  return status === 401 || status === 403;
}

export const authSession = new AuthSession();
