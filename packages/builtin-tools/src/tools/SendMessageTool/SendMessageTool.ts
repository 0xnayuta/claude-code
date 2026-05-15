import { z } from 'zod/v4'
import type { Tool } from 'src/Tool.js'
import { buildTool, type ToolDef } from 'src/Tool.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { SEND_MESSAGE_TOOL_NAME } from './constants.js'

const structuredMessageSchema = z.record(z.string(), z.unknown())

const inputSchema = lazySchema(() =>
  z.object({
    to: z.string(),
    summary: z.string().optional(),
    message: z.union([z.string(), structuredMessageSchema]),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Input = z.infer<InputSchema>

export type SendMessageToolOutput = {
  success: boolean
  message: string
}

export const SendMessageTool: Tool<InputSchema, SendMessageToolOutput> =
  buildTool({
    name: SEND_MESSAGE_TOOL_NAME,
    maxResultSizeChars: 100_000,
    userFacingName() {
      return 'SendMessage'
    },
    get inputSchema(): InputSchema {
      return inputSchema()
    },
    isEnabled() {
      return false
    },
    async description() {
      return 'SendMessage is removed in this build'
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
      return {
        data: {
          success: false,
          message: 'SendMessage is removed in this build.',
        },
      }
    },
    renderToolUseMessage() {
      return null
    },
    renderToolResultMessage() {
      return null
    },
  } satisfies ToolDef<InputSchema, SendMessageToolOutput>)
