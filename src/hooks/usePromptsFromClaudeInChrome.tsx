import type { MCPServerConnection } from '../services/mcp/types.js';
import type { PermissionMode } from '../types/permissions.js';

/** Browser automation is not included in the personal-local build. */
export function usePromptsFromClaudeInChrome(
  _mcpClients: MCPServerConnection[],
  _toolPermissionMode: PermissionMode,
): void {}
