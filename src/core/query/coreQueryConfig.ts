import type {
  CoreQueryConfig,
  CoreQueryModelOptions,
  CoreQuerySource,
} from 'src/core/contracts/queryContract.js'

export type CoreQueryRuntimeProfile = 'core-local' | 'legacy-full'

export type CoreQueryRuntimeOptions = {
  profile: CoreQueryRuntimeProfile
  config: CoreQueryConfig
  querySource: CoreQuerySource
  skipCacheWrite?: boolean
}

export type CoreQueryRuntimeDefaults = {
  maxTurns: number
  maxOutputTokensOverride: number
  taskBudgetTotal: number
  continuationBudget: number
  warningBufferTokens: number
  errorBufferTokens: number
}

export const DEFAULT_QUERY_RUNTIME_DEFAULTS: CoreQueryRuntimeDefaults = {
  maxTurns: 100,
  maxOutputTokensOverride: 8_192,
  taskBudgetTotal: 500_000,
  continuationBudget: 0,
  warningBufferTokens: 20_000,
  errorBufferTokens: 20_000,
}

export type CoreQueryBuildConfigOptions = {
  mainLoopModel: string
  fallbackModel?: string
  maxOutputTokensOverride?: number
  maxTurns?: number
  taskBudget?: { total: number }
}

export function buildCoreQueryConfig(
  opts: CoreQueryBuildConfigOptions,
  defaults: CoreQueryRuntimeDefaults = DEFAULT_QUERY_RUNTIME_DEFAULTS,
): CoreQueryConfig {
  return {
    model: {
      mainLoopModel: opts.mainLoopModel,
      fallbackModel: opts.fallbackModel,
      maxOutputTokensOverride:
        opts.maxOutputTokensOverride ?? defaults.maxOutputTokensOverride,
    },
    maxTurns: opts.maxTurns ?? defaults.maxTurns,
    taskBudget: opts.taskBudget,
  }
}

export type CoreQueryProfileResolver = (profile: CoreQueryRuntimeProfile) => CoreQueryRuntimeOptions

export function resolveCoreQueryProfile(
  profile: CoreQueryRuntimeProfile,
  overrides?: Partial<CoreQueryRuntimeOptions>,
): CoreQueryRuntimeOptions {
  return {
    profile,
    config: buildCoreQueryConfig({
      mainLoopModel: 'claude-3-5-sonnet-20241022',
      maxOutputTokensOverride: DEFAULT_QUERY_RUNTIME_DEFAULTS.maxOutputTokensOverride,
      maxTurns: DEFAULT_QUERY_RUNTIME_DEFAULTS.maxTurns,
    }),
    querySource: 'core-runtime' as CoreQuerySource,
    skipCacheWrite: false,
    ...overrides,
  }
}