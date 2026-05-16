import type { Command } from 'src/commands.js'

export const CORE_COMMAND_CONTRACT_VERSION = 2 as const

// ── Safety types ─────────────────────────────────────────────────────────────

export type CoreCommandSafety =
  | 'safe'
  | 'remote-safe'
  | 'bridge-safe'
  | 'internal-only'

// ── Command sets (core-owned constants) ──────────────────────────────────────

export const CORE_INTERNAL_ONLY_COMMANDS = [
  'daemon',
  'update',
  'doctor',
  'init',
  'exit',
] as const

export const CORE_REMOTESAFE_COMMANDS = new Set<string>([
  'help', 'clear', 'status', 'compact', 'usage', 'btw', 'diff',
])

export const CORE_BRIDGESAFE_COMMANDS = new Set<string>([
  'help', 'clear', 'status', 'usage', 'btw', 'diff', 'context', 'mcp',
  'resume', 'compact',
])

export const CORE_BUILTIN_COMMAND_NAMES: ReadonlySet<string> = new Set([
  'add-dir', 'btw', 'clear', 'color', 'copy', 'compact', 'config',
  'context', 'diff', 'doctor', 'memory', 'help', 'init', 'keybindings',
  'lang', 'login', 'logout', 'break-cache', 'mcp', 'resume', 'status',
  'usage', 'theme', 'vim', 'agent', 'auto-mode', 'attach', 'backfill-sessions',
  'branch', 'bridge-kick', 'brief', 'bughunter', 'claim-main', 'color',
  'commit-push-pr', 'cost', 'create', 'edit', 'explain', 'fix', 'goto',
  'guard', 'hack', 'improve', 'investigate', 'join', 'kill', 'leave',
  'logs', 'mitigate', 'new', 'plan', 'pm', 'prompt', 'pr', 'pr-comments',
  'review', 'security-review', 'self-hosted-runner', 'shell', 'skill',
  'subscribe-pr', 'sync', 'test', 'tip', 'torch', 'undo', 'verify',
])

// ── Core command contract v2 ─────────────────────────────────────────────────

export type CoreCommandContract = {
  version: typeof CORE_COMMAND_CONTRACT_VERSION
  listCommands: (cwd: string) => Promise<Command[]>
  listBuiltInCommandNames: () => ReadonlySet<string>
  findCommandByName: (
    commandName: string,
    commands: Command[],
  ) => Command | undefined
  getCommand: (commandName: string, commands: Command[]) => Command | undefined
  hasCommand: (commandName: string, commands: Command[]) => boolean
  meetsAvailabilityRequirement: (cmd: Command) => boolean
  isRemoteSafe: (commandName: string) => boolean
  isBridgeSafe: (commandName: string) => boolean
  filterCommandsForRemoteMode: (commands: Command[]) => Command[]
  formatDescriptionWithSource: (cmd: Command) => string
  getCommandSafety: (cmd: Command) => CoreCommandSafety
}

// ── Core command utility functions (core-owned) ───────────────────────────────

export function coreGetCommand(
  commandName: string,
  commands: Command[],
): Command | undefined {
  return commands.find(cmd => cmd.name === commandName)
}

export function coreHasCommand(
  commandName: string,
  commands: Command[],
): boolean {
  return commands.some(cmd => cmd.name === commandName)
}

export function coreFilterCommandsForRemoteMode(
  commands: Command[],
): Command[] {
  return commands.filter(cmd => CORE_REMOTESAFE_COMMANDS.has(cmd.name))
}

export function coreGetCommandSafety(
  cmd: Command,
): CoreCommandSafety {
  if (CORE_INTERNAL_ONLY_COMMANDS.includes(cmd.name as typeof CORE_INTERNAL_ONLY_COMMANDS[number])) {
    return 'internal-only'
  }
  if (CORE_BRIDGESAFE_COMMANDS.has(cmd.name)) {
    return 'bridge-safe'
  }
  if (CORE_REMOTESAFE_COMMANDS.has(cmd.name)) {
    return 'remote-safe'
  }
  return 'safe'
}