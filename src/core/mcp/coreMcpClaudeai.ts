import { isCoreLocalRuntimeProfile } from '../runtime/createCoreRuntime.js'
import { fetchClaudeAIMcpConfigsIfEligible as fetchClaudeAIMcpConfigsIfEligibleImpl } from '../../services/mcp/claudeai.js'

export {
  clearClaudeAIMcpConfigsCache,
  fetchClaudeAIMcpConfigsIfEligible,
  hasClaudeAiMcpEverConnected,
} from '../../services/mcp/claudeai.js'

/**
 * Runtime-aware claude.ai connector fetch.
 * core-local profile intentionally skips remote connector discovery.
 */
export async function fetchRuntimeClaudeAIMcpConfigsIfEligible() {
  if (isCoreLocalRuntimeProfile()) {
    return {}
  }
  return fetchClaudeAIMcpConfigsIfEligibleImpl()
}
