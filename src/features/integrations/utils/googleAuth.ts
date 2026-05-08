/**
 * Google Identity Services (GIS) auth-code flow.
 *
 * Browser-initiated OAuth via `google.accounts.oauth2.initCodeClient()`. The browser receives
 * an authorization code (popup mode), forwards it to the backend, backend exchanges for
 * access + refresh tokens with `redirect_uri='postmessage'`.
 *
 * Why browser-side: Google's Drive Picker only registers the per-file `drive.file` binding when
 * the OAuth flow originates in the same browser session as the Picker. Server-side OAuth code
 * exchange (initiated from a redirect URL) bypasses the binding registration → 404 on subsequent
 * Sheets/Drive API calls. Browser flow + backend code exchange = both Picker binding AND offline
 * refresh token.
 */

const GIS_CLIENT_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: GisCodeClientConfig) => GisCodeClient;
        };
      };
    };
  }
}

interface GisCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode?: 'popup' | 'redirect';
  callback?: (response: GisCodeClientResponse) => void;
  error_callback?: (err: { type?: string; message?: string }) => void;
  redirect_uri?: string;
  state?: string;
  hint?: string;
}

interface GisCodeClient {
  requestCode: () => void;
}

interface GisCodeClientResponse {
  code?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

let gisLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisLoadPromise) {
    gisLoadPromise = new Promise<void>((resolve, reject) => {
      // index.html already includes the GIS script with async/defer; if it's already loaded, this resolves immediately.
      // If it hasn't loaded yet, we attach a script tag (idempotent — won't double-load if same src exists).
      const existing = document.querySelector(`script[src="${GIS_CLIENT_SRC}"]`);
      if (existing) {
        // Wait for the existing tag to finish loading.
        const check = () => {
          if (window.google?.accounts?.oauth2) resolve();
          else setTimeout(check, 50);
        };
        check();
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_CLIENT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }
  return gisLoadPromise;
}

/**
 * Trigger the GIS popup consent screen and return the authorization code.
 * Resolves with the code on success, throws on user-cancel or error.
 */
export async function requestGoogleAuthCode(opts: {
  clientId: string;
  scope: string;
}): Promise<string> {
  await loadGisScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google Identity Services SDK is not available');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initCodeClient({
      client_id: opts.clientId,
      scope: opts.scope,
      ux_mode: 'popup',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.code) {
          reject(new Error('GIS callback returned no authorization code'));
          return;
        }
        resolve(response.code);
      },
      error_callback: (err) => {
        reject(new Error(err.message || err.type || 'GIS auth-code request failed'));
      },
    });
    client.requestCode();
  });
}
