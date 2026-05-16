export const CORE_MCP_AUTH_CONTRACT_VERSION = 1 as const

export type CoreMcpAuthContract = {
  version: typeof CORE_MCP_AUTH_CONTRACT_VERSION
  performOAuthFlow: (
    serverName: string,
    serverConfig: unknown,
  ) => Promise<void>
  revokeTokens: (
    serverName: string,
    serverConfig: unknown,
  ) => Promise<void>
  getAuthProvider: (serverName: string, serverConfig: unknown) => unknown
}