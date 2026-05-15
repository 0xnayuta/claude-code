import type { CoreAPIProvider } from '../providers/coreProviders.js'

export type RuntimeProfile = 'core-local' | 'legacy-full'

export type CoreRuntimeProvider = CoreAPIProvider

export interface CoreRuntimeShell {
  profile: RuntimeProfile
  isCoreLocal: boolean
  commandNames: readonly string[]
  toolNames: readonly string[]
  providers: readonly CoreRuntimeProvider[]
}
