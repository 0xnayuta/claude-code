/**
 * Sentry no-op facade for the personal-local build.
 *
 * The UI error boundary still calls these functions, but this fork does not
 * initialize or report to the Sentry SDK.
 */

let initialized = false

export function initSentry(): void {
  initialized = false
}

export function captureException(
  _error: unknown,
  _context?: Record<string, unknown>,
): void {}

export function setTag(_key: string, _value: string): void {}

export function setUser(_user: {
  id?: string
  email?: string
  username?: string
}): void {}

export async function closeSentry(_timeoutMs = 2000): Promise<void> {}

export function isSentryInitialized(): boolean {
  return initialized
}
