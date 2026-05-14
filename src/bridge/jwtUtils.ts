// Stubbed: Remote Control bridge utilities unavailable in personal-local build

export function decodeJwtPayload(_token: string): unknown | null {
  return null
}

export function decodeJwtExpiry(_token: string): number | null {
  return null
}

// Wide parameter type to accept all caller signatures without requiring
// the exact shape — this stub is never called at runtime.
export function createTokenRefreshScheduler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _config: any,
): {
  schedule: (sessionId: string, token: string) => void
  scheduleFromExpiresIn: (sessionId: string, expiresInSeconds: number) => void
  cancel: (sessionId?: string) => void
  cancelAll: () => void
} {
  return {
    schedule: () => {},
    scheduleFromExpiresIn: () => {},
    cancel: () => {},
    cancelAll: () => {},
  }
}
