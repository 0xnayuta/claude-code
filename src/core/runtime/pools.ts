import type { Command } from '../../types/command.js'
import type { ToolPermissionContext, Tools } from '../../Tool.js'
import { getCommands } from '../../commands.js'
import { getTools } from '../../tools.js'
import { filterToCoreCommands } from '../commands/coreCommands.js'
import { CORE_TOOL_NAMES } from '../tools/coreToolNames.js'
import { isCoreLocalRuntimeProfile } from './createCoreRuntime.js'

const CORE_TOOL_NAME_SET = new Set<string>(CORE_TOOL_NAMES)

export async function getRuntimeCommands(cwd: string): Promise<Command[]> {
  const commands = await getCommands(cwd)
  if (!isCoreLocalRuntimeProfile()) return commands
  return filterToCoreCommands(commands)
}

export function getRuntimeTools(
  permissionContext: ToolPermissionContext,
): Tools {
  const tools = getTools(permissionContext)
  if (!isCoreLocalRuntimeProfile()) return tools
  return tools.filter(tool => CORE_TOOL_NAME_SET.has(tool.name))
}
