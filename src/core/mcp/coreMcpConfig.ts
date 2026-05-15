import { isCoreLocalRuntimeProfile } from '../runtime/createCoreRuntime.js'
import {
  getAllMcpConfigs as getAllMcpConfigsImpl,
  getClaudeCodeMcpConfigs as getClaudeCodeMcpConfigsImpl,
} from '../../services/mcp/config.js'

export {
  addMcpConfig,
  getAllMcpConfigs,
  removeMcpConfig,
  getClaudeCodeMcpConfigs,
  getMcpConfigByName,
  getMcpConfigsByScope,
  getMcpServerSignature,
  isMcpServerDisabled,
  setMcpServerEnabled,
  parseMcpConfig,
  parseMcpConfigFromFilePath,
  doesEnterpriseMcpConfigExist,
  dedupClaudeAiMcpServers,
  filterMcpServersByPolicy,
  areMcpConfigsAllowedWithEnterpriseMcpConfig,
} from '../../services/mcp/config.js'

/**
 * Runtime-aware MCP config loader.
 * core-local: local/manual Claude Code MCP configs only (no claude.ai connectors)
 * legacy-full: full merged MCP configs
 */
export async function getRuntimeAllMcpConfigs() {
  if (isCoreLocalRuntimeProfile()) {
    return getClaudeCodeMcpConfigsImpl()
  }
  return getAllMcpConfigsImpl()
}
