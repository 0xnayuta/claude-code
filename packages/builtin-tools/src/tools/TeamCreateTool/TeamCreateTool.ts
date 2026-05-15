import { z } from 'zod/v4'
import type { Tool } from 'src/Tool.js'
import { buildTool, type ToolDef } from 'src/Tool.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { TEAM_CREATE_TOOL_NAME } from './constants.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    team_name: z.string(),
    description: z.string().optional(),
    agent_type: z.string().optional(),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Input = z.infer<InputSchema>

export type Output = {
  team_name: string
  team_file_path: string
  lead_agent_id: string
}

export const TeamCreateTool: Tool<InputSchema, Output> = buildTool({
  name: TEAM_CREATE_TOOL_NAME,
  maxResultSizeChars: 100_000,
  userFacingName() {
    return ''
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  isEnabled() {
    return false
  },
  async description() {
    return 'TeamCreate is removed in this build'
  },
  async prompt() {
    return 'Disabled'
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    }
  },
  async call() {
    throw new Error('TeamCreate is removed in this build.')
  },
  renderToolUseMessage() {
    return null
  },
} satisfies ToolDef<InputSchema, Output>)
