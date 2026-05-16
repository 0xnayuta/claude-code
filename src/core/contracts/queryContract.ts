import type { Message, UserMessage } from 'src/types/message.js'
import type { Tool, ToolUseContext } from 'src/Tool.js'
import type { SystemPrompt } from 'src/utils/systemPromptType.js'

export const CORE_QUERY_CONTRACT_VERSION = 2 as const

// ── Input contract ─────────────────────────────────────────────────────────

export type CoreQuerySource = string

export type CoreQueryParams = {
  messages: Message[]
  systemPrompt: SystemPrompt
  userContext: Record<string, string>
  systemContext: Record<string, string>
  canUseTool: unknown // type-only, avoid importing CanUseToolFn
  toolUseContext: ToolUseContext
  fallbackModel?: string
  querySource: CoreQuerySource
  maxOutputTokensOverride?: number
  maxTurns?: number
  taskBudget?: { total: number }
  skipCacheWrite?: boolean
}

// ── Output contract ────────────────────────────────────────────────────────

export type CoreQueryStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'tool_use'; tool: Tool; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; content: unknown }
  | { type: 'error'; message: string }
  | { type: 'done' }

export type CoreQueryRunResult = AsyncGenerator<
  CoreQueryStreamEvent,
  unknown,
  unknown
>

// ── Config contract ────────────────────────────────────────────────────────

export type CoreQueryModelOptions = {
  mainLoopModel: string
  fallbackModel?: string
  maxOutputTokensOverride?: number
}

export type CoreQueryConfig = {
  model: CoreQueryModelOptions
  maxTurns?: number
  taskBudget?: { total: number }
}

// ── Token budget contract ──────────────────────────────────────────────────

export type CoreTokenBudgetState = {
  totalBudget: number
  usedTokens: number
  remainingTokens: number
  continuationCount: number
}

export type CoreTokenBudgetContract = {
  version: 2
  getState: () => CoreTokenBudgetState
  incrementContinuation: () => void
  reset: () => void
}

// ── Main query contract (v2) ─────────────────────────────────────────────────

export type CoreQueryContract = {
  version: typeof CORE_QUERY_CONTRACT_VERSION
  runQuery: (input: CoreQueryParams) => Promise<CoreQueryRunResult>
  buildConfig: (params: CoreQueryParams) => CoreQueryConfig
  createTokenBudget: (budget: CoreTokenBudgetState) => CoreTokenBudgetContract
}