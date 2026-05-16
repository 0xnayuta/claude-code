import type { Message } from 'src/types/message.js'
import type { Tool, ToolUseContext } from 'src/Tool.js'
import type { SystemPrompt } from 'src/utils/systemPromptType.js'

export const CORE_PROVIDER_CONTRACT_VERSION = 1 as const

export type CoreProviderType =
  | 'firstParty'
  | 'bedrock'
  | 'vertex'
  | 'foundry'
  | 'openai'
  | 'gemini'
  | 'grok'

export type CoreProviderConfig = {
  provider: CoreProviderType
  baseUrl?: string
  apiKey?: string
  model?: string
}

export type CoreProviderRequestOptions = {
  model: string
  maxTokens?: number
  system?: SystemPrompt
  temperature?: number
  topP?: number
}

export type CoreProviderStreamResponse = AsyncGenerator<unknown, void>

export type CoreProviderContract = {
  version: typeof CORE_PROVIDER_CONTRACT_VERSION
  getProvider: () => CoreProviderType
  resolveProvider: (config?: Partial<CoreProviderConfig>) => CoreProviderType
  isFirstPartyProvider: () => boolean
  buildRequestOptions: (opts: CoreProviderRequestOptions) => unknown
}

export type CoreToolExecutorContract = {
  version: 1
  executeTool: (
    tool: Tool,
    args: Record<string, unknown>,
    context: ToolUseContext,
  ) => Promise<unknown>
  buildToolCallContext: (opts: {
    messages: Message[]
    canUseTool: unknown
  }) => ToolUseContext
}

export type CoreMessageNormalizerContract = {
  version: 1
  normalizeMessagesForAPI: (messages: Message[]) => Message[]
  prependUserContext: (messages: Message[], context: Record<string, string>) => Message[]
  appendSystemContext: (messages: Message[], context: Record<string, string>) => Message[]
}