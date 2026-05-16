import type { Message } from 'src/types/message.js'

export const CORE_COMPACT_CONTRACT_VERSION = 1 as const

// ── Token budget ────────────────────────────────────────────────────────────

export type CoreCompactTokenConfig = {
  maxTokensPerMessage: number
  maxTokensPerFile: number
  maxTokensForSkippedFiles: number
  maxTokensForSkills: number
  maxTokensForPlans: number
  maxTokensForAgents: number
  maxTokensForAttachments: number
  maxTokensPerAttachment: number
}

export const DEFAULT_COMPACT_TOKEN_CONFIG: CoreCompactTokenConfig = {
  maxTokensPerMessage: 50_000,
  maxTokensPerFile: 5_000,
  maxTokensForSkippedFiles: 50_000,
  maxTokensForSkills: 25_000,
  maxTokensForPlans: 10_000,
  maxTokensForAgents: 25_000,
  maxTokensForAttachments: 50_000,
  maxTokensPerAttachment: 5_000,
}

// ── Error constants ────────────────────────────────────────────────────────

export const COMPACT_ERROR_MESSAGES = {
  NOT_ENOUGH_MESSAGES: 'Not enough messages to compact (minimum 2)',
  PROMPT_TOO_LONG: 'Prompt exceeds maximum context window after compaction',
  USER_ABORT: 'API Error: Request was aborted.',
  INCOMPLETE_RESPONSE: 'API Error: Response incomplete or truncated',
} as const

// ── Model context size ───────────────────────────────────────────────────────

export type CoreModelContextSizes = Record<string, number>

export const DEFAULT_MODEL_CONTEXT_SIZES: CoreModelContextSizes = {
  'claude-4-opus': 200_000,
  'claude-4-sonnet': 200_000,
  'claude-3-5-opus': 200_000,
  'claude-3-5-sonnet': 150_000,
  'claude-3-haiku': 200_000,
}

// ── Compact contract ────────────────────────────────────────────────────────

export type CoreCompactResult = {
  compactedMessages: Message[]
  discardedCount: number
  preservedCount: number
}

export type CoreCompactContract = {
  version: typeof CORE_COMPACT_CONTRACT_VERSION
  stripImagesFromMessages: (messages: Message[]) => Message[]
  stripReinjectedAttachments: (messages: Message[]) => Message[]
  truncateHeadForPTLRetry: (
    messages: Message[],
    maxTokens: number,
  ) => Message[]
  buildPostCompactMessages: (
    result: CoreCompactResult,
    boundaryMarkers?: string[],
  ) => Message[]
  createCompactCanUseTool: () => unknown // CanUseToolFn — type-only
  getEffectiveContextWindowSize: (model: string) => number
  estimateMaxTurnGrowth: (model: string) => number
}