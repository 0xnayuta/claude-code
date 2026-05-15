import { z } from 'zod/v4'
import type { Tool } from 'src/Tool.js'
import { buildTool, type ToolDef } from 'src/Tool.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { TEAM_DELETE_TOOL_NAME } from './constants.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    wait_ms: z.number().min(0).max(30_000).optional(),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Input = z.infer<InputSchema>

export type Output = {
  success: boolean
  message: string
  team_name?: string
}

export const TeamDeleteTool: Tool<InputSchema, Output> = buildTool({
  name: TEAM_DELETE_TOOL_NAME,
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
    return 'TeamDelete is removed in this build'
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
    return { data: { success: false, message: 'TeamDelete is removed in this build.' } }
  },
  renderToolUseMessage() {
    return null
  },
  renderToolResultMessage() {
    return null
  },
} satisfies ToolDef<InputSchema, Output>)
