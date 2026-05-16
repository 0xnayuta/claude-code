import type { ScopedMcpServerConfig } from 'src/services/mcp/types.js'

export const CORE_MCP_CONFIG_CONTRACT_VERSION = 1 as const

export type CoreMcpConfigContract = {
  version: typeof CORE_MCP_CONFIG_CONTRACT_VERSION
  parseMcpConfig: (raw: unknown) => ScopedMcpServerConfig
  getMcpServerSignature: (config: ScopedMcpServerConfig) => string
  isMcpServerDisabled: (name: string) => boolean
}