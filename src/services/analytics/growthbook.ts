import { memoize } from 'lodash-es'

export type GrowthBookUserAttributes = {
  id: string
  sessionId: string
  deviceID: string
  platform: 'win32' | 'darwin' | 'linux'
  apiBaseUrlHost?: string
  organizationUUID?: string
  accountUUID?: string
  userType?: string
  subscriptionType?: string
  rateLimitTier?: string
  firstTokenTime?: number
  email?: string
  appVersion?: string
  github?: unknown
}

type GrowthBookRefreshListener = () => void | Promise<void>
const listeners = new Set<GrowthBookRefreshListener>()
const featureOverrides = new Map<string, unknown>()

export function onGrowthBookRefresh(
  listener: GrowthBookRefreshListener,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitRefresh(): void {
  for (const listener of listeners) {
    void Promise.resolve(listener()).catch(() => {})
  }
}

export function hasGrowthBookEnvOverride(..._args: unknown[]): boolean {
  return false
}

export function getAllGrowthBookFeatures(): Record<string, unknown> {
  return Object.fromEntries(featureOverrides)
}

export function getGrowthBookConfigOverrides(): Record<string, unknown> {
  return Object.fromEntries(featureOverrides)
}

export function setGrowthBookConfigOverride(feature: string, value: unknown): void {
  if (value === undefined) {
    featureOverrides.delete(feature)
  } else {
    featureOverrides.set(feature, value)
  }
  emitRefresh()
}

export function clearGrowthBookConfigOverrides(): void {
  featureOverrides.clear()
  emitRefresh()
}

export function getApiBaseUrlHost(..._args: unknown[]): string | undefined {
  return undefined
}

export const initializeGrowthBook = memoize(async (): Promise<void> => {})

export async function getFeatureValue_DEPRECATED<T>(
  ...args: [string, T, ...unknown[]]
): Promise<T> {
  return args[1]
}

export function getFeatureValue_CACHED_MAY_BE_STALE<T>(
  ...args: [string, T, ...unknown[]]
): T {
  const feature = args[0]
  const fallback = args[1]
  const override = featureOverrides.get(feature)
  return (override as T | undefined) ?? fallback
}

export function getFeatureValue_CACHED_WITH_REFRESH<T>(
  ...args: [string, T, ...unknown[]]
): T {
  return getFeatureValue_CACHED_MAY_BE_STALE(...args)
}

export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
  ...args: [string, boolean?, ...unknown[]]
): boolean {
  return args[1] ?? false
}

export async function checkSecurityRestrictionGate(
  ...args: [string, boolean?, ...unknown[]]
): Promise<boolean> {
  return args[1] ?? false
}

export async function checkGate_CACHED_OR_BLOCKING(
  ...args: [string, boolean?, ...unknown[]]
): Promise<boolean> {
  return args[1] ?? false
}

export function refreshGrowthBookAfterAuthChange(..._args: unknown[]): void {
  emitRefresh()
}

export function resetGrowthBook(..._args: unknown[]): void {
  featureOverrides.clear()
}

export async function refreshGrowthBookFeatures(..._args: unknown[]): Promise<void> {
  emitRefresh()
}

export function setupPeriodicGrowthBookRefresh(..._args: unknown[]): void {}

export function stopPeriodicGrowthBookRefresh(..._args: unknown[]): void {}

export async function getDynamicConfig_BLOCKS_ON_INIT<T>(
  ...args: [string, T, ...unknown[]]
): Promise<T> {
  return args[1]
}

export function getDynamicConfig_CACHED_MAY_BE_STALE<T>(
  ...args: [string, T, ...unknown[]]
): T {
  return args[1]
}
