/**
 * Auth-domain error types.
 *
 * These exist so callers (axios interceptor, AuthInitializer, route guards)
 * can branch on the *kind* of failure without inspecting HTTP status codes
 * or string-matching error messages.
 *
 *   - TerminalAuthError → the session is dead. Sign the user out.
 *   - TransientAuthError → the network or server failed. Keep the session,
 *     surface the error to the caller, the next API call will retry.
 *
 * Anything else thrown from the refresh path is a programming bug and should
 * be surfaced (don't catch it).
 */

export type TerminalAuthReason = 'no_refresh_token' | 'refresh_rejected';

export class TerminalAuthError extends Error {
  readonly name = 'TerminalAuthError';
  constructor(
    readonly reason: TerminalAuthReason,
    readonly cause?: unknown
  ) {
    super(`Terminal auth error: ${reason}`);
  }
}

export class TransientAuthError extends Error {
  readonly name = 'TransientAuthError';
  constructor(readonly cause: unknown) {
    super('Transient auth error');
  }
}

export function isTerminalAuthError(err: unknown): err is TerminalAuthError {
  return err instanceof TerminalAuthError;
}

export function isTransientAuthError(err: unknown): err is TransientAuthError {
  return err instanceof TransientAuthError;
}
