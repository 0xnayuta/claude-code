import type { Tool, Tools, ToolProgressData } from 'src/Tool.js'
import type { ProgressMessage } from 'src/types/message.js'
import type { AnyObject } from 'src/Tool.js'

/**
 * Tool registry utilities — core-owned pure functions.
 * These are extracted from legacy src/Tool.ts as part of Phase D extraction.
 */

// ── Tool name matching ─────────────────────────────────────────────────────────

export function coreToolMatchesName(
  tool: { name: string; aliases?: string[] },
  name: string,
): boolean {
  return tool.name === name || (tool.aliases?.includes(name) ?? false)
}

export function coreFindToolByName(
  tools: Tools,
  name: string,
): Tool | undefined {
  return tools.find(t => coreToolMatchesName(t, name))
}

// ── Progress message filtering ───────────────────────────────────────────────

export function coreFilterToolProgressMessages(
  progressMessagesForMessage: ProgressMessage[],
): ProgressMessage<ToolProgressData>[] {
  return progressMessagesForMessage.filter(
    (msg): msg is ProgressMessage<ToolProgressData> =>
      (msg.data as { type?: string })?.type !== 'hook_progress',
  )
}

// ── Tool permission context ───────────────────────────────────────────────────

export function coreGetEmptyToolPermissionContext(): {
  mode: string
  additionalWorkingDirectories: Map<string, string>
  alwaysAllowRules: Record<string, boolean>
  alwaysDenyRules: Record<string, boolean>
  alwaysAskRules: Record<string, boolean>
  isBypassPermissionsModeAvailable: boolean
} {
  return {
    mode: 'default',
    additionalWorkingDirectories: new Map(),
    alwaysAllowRules: {},
    alwaysDenyRules: {},
    alwaysAskRules: {},
    isBypassPermissionsModeAvailable: true,
  }
}

// ── Tool definition building ──────────────────────────────────────────────────

function toolDefaults() {
  return {
    isEnabled: () => true,
    isConcurrencySafe: (_input?: unknown) => false,
    isReadOnly: (_input?: unknown) => false,
    isDestructive: (_input?: unknown) => false,
    checkPermissions: (input: Record<string, unknown>) =>
      Promise.resolve({ behavior: 'allow', updatedInput: input }),
    toAutoClassifierInput: (_input?: unknown) => '',
    userFacingName: (_input?: unknown) => '',
  }
}

export function coreBuildTool<D extends AnyObject & { name: string }>(
  def: D,
): D {
  return {
    ...toolDefaults(),
    userFacingName: () => def.name,
    ...def,
  } as D
}