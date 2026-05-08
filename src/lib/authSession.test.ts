import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn<[], string | null>(() => null),
  getRefreshToken: vi.fn<[], string | null>(() => 'rt-1'),
  setTokens: vi.fn(),
  setAuthState: vi.fn(),
  updateSupabaseAuth: vi.fn(async () => undefined),
  isTokenExpired: vi.fn(() => true),
}));

vi.mock('./tokenStore', () => ({
  getAccessToken: mocks.getAccessToken,
  getRefreshToken: mocks.getRefreshToken,
  setTokens: mocks.setTokens,
}));

vi.mock('@/features/auth/stores/authStore', () => ({
  useAuthStore: {
    setState: mocks.setAuthState,
  },
}));

vi.mock('./supabase', () => ({
  updateSupabaseAuth: mocks.updateSupabaseAuth,
}));

vi.mock('@/features/auth/utils/tokenUtils', () => ({
  isTokenExpired: mocks.isTokenExpired,
}));

vi.mock('./logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/env', () => ({
  env: { VITE_API_URL: 'http://localhost:5267' },
}));

import { authSession } from './authSession';
import { TerminalAuthError, TransientAuthError } from '@/features/auth/errors';

describe('authSession.ensureFresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccessToken.mockReturnValue(null);
    mocks.getRefreshToken.mockReturnValue('rt-1');
    mocks.isTokenExpired.mockReturnValue(true);
  });

  it('returns existing tokens without a network call when access token is fresh', async () => {
    mocks.getAccessToken.mockReturnValue('valid-access');
    mocks.getRefreshToken.mockReturnValue('valid-refresh');
    mocks.isTokenExpired.mockReturnValue(false);

    let networkHit = false;
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', () => {
        networkHit = true;
        return HttpResponse.json({ access_token: 'unused', refresh_token: 'unused' });
      }),
    );

    const result = await authSession.ensureFresh();

    expect(networkHit).toBe(false);
    expect(result).toEqual({ accessToken: 'valid-access', refreshToken: 'valid-refresh' });
    expect(mocks.setTokens).not.toHaveBeenCalled();
    expect(mocks.setAuthState).not.toHaveBeenCalled();
  });

  it('refreshes tokens, persists, mirrors to store, and syncs Supabase on success', async () => {
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', () =>
        HttpResponse.json({ access_token: 'new-a', refresh_token: 'new-r' }),
      ),
    );

    const result = await authSession.ensureFresh();

    expect(result).toEqual({ accessToken: 'new-a', refreshToken: 'new-r' });
    expect(mocks.setTokens).toHaveBeenCalledTimes(1);
    expect(mocks.setTokens).toHaveBeenCalledWith('new-a', 'new-r');
    expect(mocks.setAuthState).toHaveBeenCalledTimes(1);
    expect(mocks.setAuthState).toHaveBeenCalledWith({ accessToken: 'new-a', refreshToken: 'new-r' });
    // updateSupabaseAuth is fire-and-forget; give the microtask queue a chance.
    await Promise.resolve();
    expect(mocks.updateSupabaseAuth).toHaveBeenCalledWith('new-a', 'new-r');
  });

  it('coalesces concurrent callers onto the same network request', async () => {
    let calls = 0;
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', async () => {
        calls += 1;
        // Tiny delay so the second caller arrives while the first is in flight.
        await new Promise((r) => setTimeout(r, 10));
        return HttpResponse.json({ access_token: 'a', refresh_token: 'r' });
      }),
    );

    const [a, b, c] = await Promise.all([
      authSession.ensureFresh(),
      authSession.ensureFresh(),
      authSession.ensureFresh(),
    ]);

    expect(calls).toBe(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    // Side effects must run exactly once even with three callers.
    expect(mocks.setTokens).toHaveBeenCalledTimes(1);
    expect(mocks.setAuthState).toHaveBeenCalledTimes(1);
  });

  it('throws TerminalAuthError on 401 from /refresh', async () => {
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', () =>
        HttpResponse.json({ message: 'Invalid' }, { status: 401 }),
      ),
    );

    await expect(authSession.ensureFresh()).rejects.toBeInstanceOf(TerminalAuthError);
    expect(mocks.setTokens).not.toHaveBeenCalled();
  });

  it('throws TerminalAuthError on 403 from /refresh', async () => {
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 }),
      ),
    );

    await expect(authSession.ensureFresh()).rejects.toBeInstanceOf(TerminalAuthError);
  });

  it('throws TransientAuthError on 5xx from /refresh', async () => {
    server.use(
      http.post('http://localhost:5267/api/auth/refresh', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 503 }),
      ),
    );

    await expect(authSession.ensureFresh()).rejects.toBeInstanceOf(TransientAuthError);
    expect(mocks.setTokens).not.toHaveBeenCalled();
  });

  it('throws TransientAuthError on network error', async () => {
    server.use(http.post('http://localhost:5267/api/auth/refresh', () => HttpResponse.error()));

    await expect(authSession.ensureFresh()).rejects.toBeInstanceOf(TransientAuthError);
  });

  it('throws TerminalAuthError when no refresh token exists', async () => {
    mocks.getRefreshToken.mockReturnValue(null);

    await expect(authSession.ensureFresh()).rejects.toBeInstanceOf(TerminalAuthError);
    await expect(authSession.ensureFresh()).rejects.toMatchObject({
      reason: 'no_refresh_token',
    });
  });
});
