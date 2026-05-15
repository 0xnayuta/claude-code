import type { AppState } from '../../state/AppState.js'
import type { Command } from '../../commands.js'
import type { AgentDefinitionsResult } from '@claude-code-best/builtin-tools/tools/AgentTool/loadAgentsDir.js'

type SetAppState = (updater: (prev: AppState) => AppState) => void

export type RefreshActivePluginsResult = {
  enabled_count: number
  disabled_count: number
  command_count: number
  agent_count: number
  hook_count: number
  mcp_count: number
  lsp_count: number
  error_count: number
  agentDefinitions: AgentDefinitionsResult
  pluginCommands: Command[]
}

export async function refreshActivePlugins(
  setAppState: SetAppState,
): Promise<RefreshActivePluginsResult> {
  setAppState(prev => ({
    ...prev,
    plugins: {
      ...prev.plugins,
      enabled: [],
      disabled: [],
      commands: [],
      needsRefresh: false,
    },
  }))

  return {
    enabled_count: 0,
    disabled_count: 0,
    command_count: 0,
    agent_count: 0,
    hook_count: 0,
    mcp_count: 0,
    lsp_count: 0,
    error_count: 0,
    agentDefinitions: { activeAgents: [], allAgents: [] },
    pluginCommands: [],
  }
}
