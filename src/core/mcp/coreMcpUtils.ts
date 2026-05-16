import type { Command } from 'src/commands.js'
import { getCwd } from 'src/utils/cwd.js'
import { getGlobalClaudeFile } from 'src/utils/env.js'
import type { Tool } from 'src/Tool.js'
import { isSettingSourceEnabled } from 'src/utils/settings/constants.js'
import { getSettings_DEPRECATED, hasSkipDangerousModePermissionPrompt } from 'src/utils/settings/settings.js'
import { getIsNonInteractiveSession } from 'src/bootstrap/state.js'
import type { ServerResource, ConfigScope } from 'src/services/mcp/types.js'

/**
 * Core-owned MCP normalization utility.
 * Kept here so core string/tool matching no longer depends on legacy mcp utils.
 */
const CLAUDEAI_SERVER_PREFIX = 'claude.ai '

export function normalizeNameForMCP(name: string): string {
  let normalized = name.replace(/[^a-zA-Z0-9_-]/g, '_')
  if (name.startsWith(CLAUDEAI_SERVER_PREFIX)) {
    normalized = normalized.replace(/_+/g, '_').replace(/^_|_$/g, '')
  }
  return normalized
}

export function getMcpPrefix(serverName: string): string {
  return `mcp__${normalizeNameForMCP(serverName)}__`
}

export function mcpInfoFromString(toolString: string): {
  serverName: string
  toolName: string | undefined
} | null {
  const parts = toolString.split('__')
  const [mcpPart, serverName, ...toolNameParts] = parts
  if (mcpPart !== 'mcp' || !serverName) {
    return null
  }
  const toolName =
    toolNameParts.length > 0 ? toolNameParts.join('__') : undefined
  return { serverName, toolName }
}

export function getMcpDisplayName(fullName: string, serverName: string): string {
  return fullName.replace(getMcpPrefix(serverName), '')
}

export function extractMcpToolDisplayName(userFacingName: string): string {
  let withoutSuffix = userFacingName.replace(/\s*\(MCP\)\s*$/, '')
  withoutSuffix = withoutSuffix.trim()
  const dashIndex = withoutSuffix.indexOf(' - ')
  if (dashIndex !== -1) {
    return withoutSuffix.substring(dashIndex + 3).trim()
  }
  return withoutSuffix
}

function buildMcpToolName(serverName: string, toolName: string): string {
  return `${getMcpPrefix(serverName)}${normalizeNameForMCP(toolName)}`
}

export function getToolNameForPermissionCheck(tool: {
  name: string
  mcpInfo?: { serverName: string; toolName: string }
}): string {
  return tool.mcpInfo
    ? buildMcpToolName(tool.mcpInfo.serverName, tool.mcpInfo.toolName)
    : tool.name
}

export function commandBelongsToServer(
  command: Command,
  serverName: string,
): boolean {
  const normalized = normalizeNameForMCP(serverName)
  const name = command.name
  if (!name) return false
  return (
    name.startsWith(`mcp__${normalized}__`) || name.startsWith(`${normalized}:`)
  )
}

export function filterToolsByServer(tools: Tool[], serverName: string): Tool[] {
  const prefix = getMcpPrefix(serverName)
  return tools.filter(tool => tool.name?.startsWith(prefix))
}

export function filterMcpPromptsByServer(
  commands: Command[],
  serverName: string,
): Command[] {
  return commands.filter(
    c =>
      commandBelongsToServer(c, serverName) &&
      !(c.type === 'prompt' && c.loadedFrom === 'mcp'),
  )
}

export function excludeToolsByServer(tools: Tool[], serverName: string): Tool[] {
  const prefix = getMcpPrefix(serverName)
  return tools.filter(tool => !tool.name?.startsWith(prefix))
}

export function excludeCommandsByServer(
  commands: Command[],
  serverName: string,
): Command[] {
  return commands.filter(c => !commandBelongsToServer(c, serverName))
}

export function excludeResourcesByServer(
  resources: Record<string, ServerResource[]>,
  serverName: string,
): Record<string, ServerResource[]> {
  const result = { ...resources }
  delete result[serverName]
  return result
}

export function isMcpTool(tool: Tool): boolean {
  return tool.name?.startsWith('mcp__') || tool.isMcp === true
}

// ── Config / scope helpers (core-owned) ──────────────────────────────────────

export type CoreMcpConfigScope =
  | 'local'
  | 'project'
  | 'user'
  | 'dynamic'
  | 'enterprise'
  | 'claudeai'

export function describeMcpConfigFilePath(scope: ConfigScope): string {
  switch (scope) {
    case 'user':
      return getGlobalClaudeFile()
    case 'project':
      return `${getCwd()}/.mcp.json`
    case 'local':
      return `${getGlobalClaudeFile()} [project: ${getCwd()}]`
    case 'dynamic':
      return 'Dynamically configured'
    case 'enterprise':
      return getEnterpriseMcpFilePathCore()
    case 'claudeai':
      return 'claude.ai'
    default:
      return scope as string
  }
}

export function getScopeLabel(scope: ConfigScope): string {
  switch (scope) {
    case 'local':
      return 'Local config (private to you in this project)'
    case 'project':
      return 'Project config (shared via .mcp.json)'
    case 'user':
      return 'User config (available in all your projects)'
    case 'dynamic':
      return 'Dynamic config (from command line)'
    case 'enterprise':
      return 'Enterprise config (managed by your organization)'
    case 'claudeai':
      return 'claude.ai config'
    default:
      return scope as string
  }
}

export function ensureConfigScope(scope?: string): ConfigScope {
  if (!scope) return 'local'

  const VALID_SCOPES: ConfigScope[] = [
    'local',
    'project',
    'user',
    'dynamic',
    'enterprise',
    'claudeai',
  ]

  if (!VALID_SCOPES.includes(scope as ConfigScope)) {
    throw new Error(
      `Invalid scope: ${scope}. Must be one of: ${VALID_SCOPES.join(', ')}`,
    )
  }

  return scope as ConfigScope
}

export function parseHeaders(headerArray: string[]): Record<string, string> {
  const headers: Record<string, string> = {}

  for (const header of headerArray) {
    const colonIndex = header.indexOf(':')
    if (colonIndex === -1) {
      throw new Error(
        `Invalid header format: "${header}". Expected format: "Header-Name: value"`,
      )
    }

    const key = header.substring(0, colonIndex).trim()
    const value = header.substring(colonIndex + 1).trim()

    if (!key) {
      throw new Error(
        `Invalid header: "${header}". Header name cannot be empty.`,
      )
    }

    headers[key] = value
  }

  return headers
}

export function getProjectMcpServerStatus(
  serverName: string,
): 'approved' | 'rejected' | 'pending' {
  const settings = getSettings_DEPRECATED()
  const normalizedName = normalizeNameForMCP(serverName)

  if (
    settings?.disabledMcpjsonServers?.some(
      name => normalizeNameForMCP(name) === normalizedName,
    )
  ) {
    return 'rejected'
  }

  if (
    settings?.enabledMcpjsonServers?.some(
      name => normalizeNameForMCP(name) === normalizedName,
    ) ||
    settings?.enableAllProjectMcpServers
  ) {
    return 'approved'
  }

  if (
    hasSkipDangerousModePermissionPrompt() &&
    isSettingSourceEnabled('projectSettings')
  ) {
    return 'approved'
  }

  if (
    getIsNonInteractiveSession() &&
    isSettingSourceEnabled('projectSettings')
  ) {
    return 'approved'
  }

  return 'pending'
}

// ── Remaining legacy re-exports (P2/P3) ─────────────────────────────────────

export { extractAgentMcpServers } from '../../services/mcp/utils.js'
export { ensureTransport } from '../../services/mcp/utils.js'

// ── Private helpers ─────────────────────────────────────────────────────────

function getEnterpriseMcpFilePathCore(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../services/mcp/config.js') as typeof import('../../services/mcp/config.js')
    return mod.getEnterpriseMcpFilePath()
  } catch {
    return ''
  }
}