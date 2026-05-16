import type { Command } from 'src/types/command.js'

/**
 * Command registry utilities — core-owned pure functions.
 * These are extracted from legacy src/commands.ts as part of Phase D extraction.
 */

// ── Name extraction ────────────────────────────────────────────────────────────

export { getCommandName } from 'src/types/command.js'

// ── Command lookup ────────────────────────────────────────────────────────────

export function findCommand(
  commandName: string,
  commands: Command[],
): Command | undefined {
  return commands.find(
    cmd =>
      cmd.name === commandName ||
      cmd.aliases?.includes(commandName),
  )
}

export function hasCommand(
  commandName: string,
  commands: Command[],
): boolean {
  return findCommand(commandName, commands) !== undefined
}

export function getCommand(
  commandName: string,
  commands: Command[],
): Command {
  const command = findCommand(commandName, commands)
  if (!command) {
    const available = [...new Set(commands.map(c => c.name))].sort((a, b) =>
      a.localeCompare(b),
    )
    throw ReferenceError(
      `Command ${commandName} not found. Available: ${available.join(', ')}`,
    )
  }
  return command
}

// ── Formatting ────────────────────────────────────────────────────────────────

/**
 * Formats a command's description with its source annotation.
 * Core-owned version covers common cases; legacy wraps with plugin/settings logic.
 */
export function formatDescriptionWithSourceCore(cmd: Command): string {
  if (cmd.type !== 'prompt') return cmd.description
  if (cmd.kind === 'workflow') return `${cmd.description} (workflow)`
  if (cmd.source === 'plugin') {
    const pluginName = (cmd as { pluginInfo?: { pluginManifest?: { name?: string } } })
      .pluginInfo?.pluginManifest?.name
    if (pluginName) return `(${pluginName}) ${cmd.description}`
    return `${cmd.description} (plugin)`
  }
  if (cmd.source === 'builtin' || cmd.source === 'mcp') return cmd.description
  if (cmd.source === 'bundled') return `${cmd.description} (bundled)`
  return cmd.description
}