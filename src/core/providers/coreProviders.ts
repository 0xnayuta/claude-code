import type { SettingsJson } from '../../utils/settings/types.js'
import {
  getAPIProvider,
  getAPIProviderForStatsig,
  isFirstPartyAnthropicBaseUrl,
  type APIProvider,
} from '../../utils/model/providers.js'

export type CoreAPIProvider = Extract<APIProvider, 'firstParty' | 'openai'>

export function getRuntimeAPIProvider(
  settings?: Pick<SettingsJson, 'modelType'>,
): APIProvider {
  return getAPIProvider(settings)
}

export function getCoreAPIProvider(
  settings?: Pick<SettingsJson, 'modelType'>,
): CoreAPIProvider {
  return getAPIProvider(settings) as CoreAPIProvider
}

export { getAPIProviderForStatsig, isFirstPartyAnthropicBaseUrl }
