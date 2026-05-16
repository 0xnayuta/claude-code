import { createHash } from 'crypto'
import type { McpHTTPServerConfig, McpSSEServerConfig } from 'src/services/mcp/types.js'

// ── Core-owned pure auth helpers ─────────────────────────────────────────────

/**
 * Generates a stable key for server credentials from name + config hash.
 * Pure function — no side effects.
 */
export function getServerKey(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): string {
  const configJson = JSON.stringify({
    type: serverConfig.type,
    url: serverConfig.url,
    headers: serverConfig.headers || {},
  })

  const hash = createHash('sha256')
    .update(configJson)
    .digest('hex')
    .substring(0, 16)

  return `${serverName}|${hash}`
}

/**
 * Returns a stable cache key for an MCP server config.
 * Excludes 'scope' (provenance metadata) for content-based identity.
 */
export function getMcpServerCacheKey(
  serverName: string,
  serverRef: McpSSEServerConfig | McpHTTPServerConfig,
): string {
  return `${serverName}-${JSON.stringify(serverRef)}`
}

// ── Legacy auth facade (deep deps: OAuth flow, secure storage, SDK auth) ──────

export {
  AuthenticationCancelledError,
  ClaudeAuthProvider,
  clearMcpClientConfig,
  clearServerTokensFromLocalStorage,
  getMcpClientConfig,
  performMCPOAuthFlow,
  readClientSecret,
  revokeServerTokens,
  saveMcpClientSecret,
} from '../../services/mcp/auth.js'