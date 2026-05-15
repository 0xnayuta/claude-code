import type { ToolUseContext } from 'src/Tool.js'

export type SpawnOutput = {
  teammate_id: string
  agent_id: string
  name: string
  tmux_session_name: string
  tmux_window_name: string
  tmux_pane_id: string
  team_name?: string
}

export type SpawnTeammateConfig = {
  name: string
  prompt: string
  team_name?: string
  cwd?: string
  use_splitpane?: boolean
  plan_mode_required?: boolean
  model?: string
  agent_type?: string
  description?: string
  invokingRequestId?: string
}

export function resolveTeammateModel(
  inputModel: string | undefined,
  leaderModel: string | null,
): string {
  return inputModel ?? leaderModel ?? 'claude-sonnet-4-5'
}

export async function generateUniqueTeammateName(
  baseName: string,
  _teamName: string | undefined,
): Promise<string> {
  return baseName
}

export async function spawnTeammate(
  _config: SpawnTeammateConfig,
  _context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  throw new Error('Swarm teammates are removed in this build.')
}
