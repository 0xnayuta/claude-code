import type { Message, UserMessage } from 'src/types/message.js'
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { randomUUID, type UUID } from 'crypto'

// ── Message constants (pure) ────────────────────────────────────────────────

export const INTERRUPT_MESSAGE = '[Request interrupted by user]'
export const INTERRUPT_MESSAGE_FOR_TOOL_USE =
  '[Request interrupted by user] Tool execution was cancelled.'
export const CANCEL_MESSAGE = '[Request cancelled by user]'
export const REJECT_MESSAGE = '[Request rejected by user]'
export const REJECT_MESSAGE_WITH_REASON_PREFIX = '[Request rejected — '
export const SUBAGENT_REJECT_MESSAGE = '[Sub-agent request rejected by user]'
export const SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX =
  '[Sub-agent request rejected by user — '
export const PLAN_REJECTION_PREFIX = '[Plan rejected by user]'
export const NO_RESPONSE_REQUESTED = 'No response requested.'
export const SYNTHETIC_MODEL = '<synthetic>'
export const SYNTHETIC_TOOL_RESULT_PLACEHOLDER = '<tool result placeholder>'
export const SYNTHETIC_MESSAGES = new Set([SYNTHETIC_MODEL, '<system>'])

// ── Message construction (core-owned) ───────────────────────────────────────

export function createCoreUserMessage({
  content,
  uuid,
  timestamp,
  origin,
}: {
  content: string | ContentBlockParam[]
  uuid?: UUID | string
  timestamp?: string
  origin?: string
}): UserMessage {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: content || '',
    },
    uuid: (uuid as string) || randomUUID(),
    timestamp: timestamp ?? new Date().toISOString(),
    origin,
  } as unknown as UserMessage
}

export function isNotEmptyMessage(message: Message): boolean {
  if (message.type === 'user') {
    const msg = message as { message?: { content?: string | ContentBlockParam[] } }
    const content = msg.message?.content
    if (!content) return false
    if (typeof content === 'string') return content.trim().length > 0
    return (content as ContentBlockParam[]).length > 0
  }
  if (message.type === 'assistant') {
    const msg = message as { assistantMessage?: { content?: unknown[] } }
    const content = msg.assistantMessage?.content
    return Array.isArray(content) && content.length > 0
  }
  return false
}

export function deriveShortMessageId(uuid: string): string {
  return uuid.replace(/-/g, '').substring(0, 8)
}

export function buildClassifierUnavailableMessage(
  model: string,
  reason: string,
): string {
  return `[Classifier unavailable for model ${model}: ${reason}]`
}

export function buildYoloRejectionMessage(reason: string): string {
  return `[Request auto-rejected: ${reason}]`
}

export function AUTO_REJECT_MESSAGE(toolName: string): string {
  return `[Auto-rejected tool use: ${toolName}]`
}

export function DONT_ASK_REJECT_MESSAGE(toolName: string): string {
  return `[Tool use rejected without asking: ${toolName}]`
}

export function withMemoryCorrectionHint(message: string): string {
  return `${message}\n\n> Memory correction applied.`
}

export function isSyntheticMessage(message: Message): boolean {
  if (message.type !== 'assistant') return false
  const assistant = message.assistantMessage as { model?: string } | undefined
  return assistant?.model ? SYNTHETIC_MESSAGES.has(assistant.model) : false
}

export function extractTag(html: string, tagName: string): string | null {
  const openTag = `<${tagName}`
  const closeTag = `</${tagName}>`
  const openIndex = html.indexOf(openTag)
  if (openIndex === -1) return null
  const contentStart = html.indexOf('>', openIndex)
  if (contentStart === -1) return null
  const closeIndex = html.indexOf(closeTag, contentStart)
  if (closeIndex === -1) return null
  return html.substring(contentStart + 1, closeIndex)
}

export type Progress = {
  percent: number
  label: string
}

export function createCoreProgressMessage<P extends Progress>({
  percent,
  label,
  model,
}: P & { model?: string }): Message {
  return {
    type: 'assistant',
    uuid: randomUUID() as UUID,
    assistantMessage: {
      id: randomUUID() as UUID,
      model: model ?? SYNTHETIC_MODEL,
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `[${label}] ${percent}%`,
        },
      ],
      stop_reason: null,
    },
    timestamp: new Date().toISOString(),
  } as unknown as Message
}

// ── Re-export helpers from legacy (with core-owned wrappers where needed) ─────

export { getLastAssistantMessage } from '../../utils/messages.js'
export { hasToolCallsInLastAssistantTurn } from '../../utils/messages.js'
export { normalizeMessagesForAPI } from '../../utils/messages.js'
export { reorderMessagesInUI } from '../../utils/messages.js'
export { isToolUseRequestMessage } from '../../utils/messages.js'
export { isToolUseResultMessage } from '../../utils/messages.js'
export { mergeUserMessages } from '../../utils/messages.js'
export { mergeAssistantMessages } from '../../utils/messages.js'
export { mergeUserMessagesAndToolResults } from '../../utils/messages.js'
export { stripCallerFieldFromAssistantMessage } from '../../utils/messages.js'