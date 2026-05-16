import type { Tools, ToolPermissionContext, ToolProgressData } from 'src/Tool.js'
import type { Message } from 'src/types/message.js'

export const CORE_TOOL_CONTRACT_VERSION = 2 as const

// ── Tool safety / permission types ───────────────────────────────────────────

export type CoreToolPermissionLevel = 'allowed' | 'denied' | 'requires-approval'

export type CoreToolPermissionContext = {
  permissionMode?: string
  deniedTools?: ReadonlySet<string>
  approvedTools?: ReadonlySet<string>
  pendingTools?: ReadonlySet<string>
}

export type CoreToolProgressEvent = {
  toolName: string
  progress?: ToolProgressData
  percentage?: number
}

// ── Tool execution contract ───────────────────────────────────────────────────

export type CoreToolExecutionContext = {
  permissionContext: CoreToolPermissionContext
  messages: Message[]
  currentWorkingDirectory?: string
  projectRoot?: string
}

export type CoreToolExecutionResult<T = unknown> = {
  success: boolean
  result?: T
  error?: string
}

// ── Core tool contract v2 ────────────────────────────────────────────────────

export type CoreToolContract = {
  version: typeof CORE_TOOL_CONTRACT_VERSION
  listTools: (permissionContext: CoreToolPermissionContext) => Tools
  listPersonalLocalTools: () => Tools
  findToolByName: (toolName: string, tools: Tools) => Tools[number] | undefined
  toolMatchesName: (tool: { name?: string; originalName?: string }, name: string) => boolean
  filterToolProgressMessages: (messages: Message[]) => Message[]
  buildToolCallContext: (opts: CoreToolExecutionContext) => CoreToolPermissionContext
}

// ── Core tool utility functions (core-owned) ────────────────────────────────

export function coreToolMatchesName(
  tool: { name?: string; originalName?: string },
  name: string,
): boolean {
  const toolName = tool.name ?? tool.originalName ?? ''
  if (toolName === name) return true
  if (toolName.endsWith(`/${name}`)) return true
  return false
}

export function coreFindToolByName(
  toolName: string,
  tools: Tools,
): Tools[number] | undefined {
  return tools.find(t => coreToolMatchesName(t, toolName))
}

export function coreGetEmptyToolPermissionContext(): CoreToolPermissionContext {
  return {}
}

export function coreBuildToolCallContext(
  opts: CoreToolExecutionContext,
): CoreToolPermissionContext {
  return {
    permissionMode: opts.permissionContext.permissionMode,
    deniedTools: opts.permissionContext.deniedTools,
    approvedTools: opts.permissionContext.approvedTools,
    pendingTools: opts.permissionContext.pendingTools,
  }
}