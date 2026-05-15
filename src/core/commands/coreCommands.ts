import type { Command } from '../../types/command.js'
import { getCommandName } from '../../types/command.js'
import { CORE_COMMAND_NAMES, type CoreCommandName } from './coreCommandNames.js'

const CORE_COMMAND_NAME_SET = new Set<string>(CORE_COMMAND_NAMES)

export function getCoreCommandNameSet(): ReadonlySet<string> {
  return CORE_COMMAND_NAME_SET
}

export function isCoreCommandName(name: string): name is CoreCommandName {
  return CORE_COMMAND_NAME_SET.has(name)
}

export function filterToCoreCommands(commands: readonly Command[]): Command[] {
  return commands.filter(cmd => isCoreCommandName(getCommandName(cmd)))
}

export function getCoreCommands(commands: readonly Command[]): Command[] {
  return filterToCoreCommands(commands)
}
