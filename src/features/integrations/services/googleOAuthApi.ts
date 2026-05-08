/**
 * Google OAuth API — one-shot calls used during the GIS code flow + Drive Picker.
 *
 * Kept separate from `integrationService` because:
 *   - These are one-shot, never cached (TanStack Query doesn't manage them).
 *   - They have a tight pairing with the GIS browser flow (initCodeClient → exchange-code →
 *     get-session) that the connection-CRUD service shouldn't know about.
 *   - The OAuth session ID returned here is passed back into createConnection / reconnect
 *     as a token-handoff handle.
 */

import api from '@/lib/api';

/**
 * Exchange a browser-side GIS authorization code for a cached OAuth session. Returns the
 * server-side session ID that subsequent calls (Picker token fetch, connection create) use.
 */
export async function exchangeAuthCode(code: string): Promise<string> {
  const { data } = await api.post<{ data: { oauth_session_id: string } }>(
    '/api/integrations/google/oauth-sessions',
    { code }
  );
  return data.data.oauth_session_id;
}

/**
 * Fetch the OAuth session's access token so the Drive Picker can authorize browser-side.
 * The session is NOT consumed; it stays alive so the eventual CreateConnection call can
 * claim it after the user picks a sheet.
 */
export async function getOAuthSessionAccessToken(oauthSessionId: string): Promise<string> {
  const { data } = await api.get<{ data: { access_token: string } }>(
    `/api/integrations/google/oauth-sessions/${oauthSessionId}`
  );
  return data.data.access_token;
}
