import { CORE_COMMAND_NAMES } from '../commands/coreCommandNames.js'
import { CORE_TOOL_NAMES } from '../tools/coreToolNames.js'
import { isPersonalLocalProfileEnabled } from '../../utils/personalLocal.js'
import type {
  CoreRuntimeProvider,
  CoreRuntimeShell,
  RuntimeProfile,
} from './types.js'

export const CORE_RUNTIME_PROVIDERS = ['firstParty', 'openai'] as const

export function resolveRuntimeProfile(): RuntimeProfile {
  return isPersonalLocalProfileEnabled() ? 'core-local' : 'legacy-full'
}

export function isCoreLocalRuntimeProfile(): boolean {
  return resolveRuntimeProfile() === 'core-local'
}

export function createCoreRuntime(
  profile: RuntimeProfile = resolveRuntimeProfile(),
): CoreRuntimeShell {
  const providers: readonly CoreRuntimeProvider[] = CORE_RUNTIME_PROVIDERS

  if (profile === 'core-local') {
    return {
      profile,
      isCoreLocal: true,
      commandNames: CORE_COMMAND_NAMES,
      toolNames: CORE_TOOL_NAMES,
      providers,
    }
  }

  return {
    profile,
    isCoreLocal: false,
    commandNames: [],
    toolNames: [],
    providers,
  }
}
