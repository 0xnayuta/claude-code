// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import addDir from './commands/add-dir/index.js'
import btw from './commands/btw/index.js'
import clear from './commands/clear/index.js'
import color from './commands/color/index.js'
import copy from './commands/copy/index.js'
import compact from './commands/compact/index.js'
import config from './commands/config/index.js'
import { context, contextNonInteractive } from './commands/context/index.js'
// cost/index.ts re-exports usage — /cost is now an alias of /usage
import diff from './commands/diff/index.js'
import doctor from './commands/doctor/index.js'
import memory from './commands/memory/index.js'
import help from './commands/help/index.js'
import init from './commands/init.js'
import keybindings from './commands/keybindings/index.js'
import lang from './commands/lang/index.js'
import login from './commands/login/index.js'
import logout from './commands/logout/index.js'
import breakCache, {
  breakCacheNonInteractive,
} from './commands/break-cache/index.js'
import mcp from './commands/mcp/index.js'
import resume from './commands/resume/index.js'
import status from './commands/status/index.js'
import usage from './commands/usage/index.js'
import theme from './commands/theme/index.js'
import vim from './commands/vim/index.js'
import { feature } from 'bun:bundle'
import { filterToCoreCommands } from './core/commands/coreCommands.js'
import { createCoreRuntime } from './core/runtime/createCoreRuntime.js'
// Dead code elimination: conditional imports
/* eslint-disable @typescript-eslint/no-require-imports */
const proactive =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./commands/proactive.js').default
    : null
const briefCommand =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? require('./commands/brief.js').default
    : null
const assistantCommand = null
const bridge = null
const remoteControlServerCommand = null
const voiceCommand = null
const monitorCmd = null
const coordinatorCmd = null
const forceSnip = feature('HISTORY_SNIP')
  ? require('./commands/force-snip.js').default
  : null
const workflowsCmd = null
const clearSkillIndexCache: (() => void) | null = null
const subscribePr = feature('KAIROS_GITHUB_WEBHOOKS')
  ? require('./commands/subscribe-pr.js').default
  : null
const ultraplan = null
const torch = feature('TORCH') ? require('./commands/torch.js').default : null
const daemonCmd = null
const jobCmd = feature('TEMPLATES')
  ? require('./commands/job/index.js').default
  : null
const peersCmd = feature('UDS_INBOX')
  ? (
      require('./commands/peers/index.js') as typeof import('./commands/peers/index.js')
    ).default
  : null
const attachCmd = feature('UDS_INBOX')
  ? require('./commands/attach/index.js').default
  : null
const detachCmd = feature('UDS_INBOX')
  ? require('./commands/detach/index.js').default
  : null
const sendCmd = feature('UDS_INBOX')
  ? require('./commands/send/index.js').default
  : null
const pipesCmd = feature('UDS_INBOX')
  ? require('./commands/pipes/index.js').default
  : null
const pipeStatusCmd = feature('UDS_INBOX')
  ? require('./commands/pipe-status/index.js').default
  : null
const historyCmd = feature('UDS_INBOX')
  ? require('./commands/history/index.js').default
  : null
const claimMainCmd = feature('UDS_INBOX')
  ? require('./commands/claim-main/index.js').default
  : null
const forkCmd = feature('FORK_SUBAGENT')
  ? (
      require('./commands/fork/index.js') as typeof import('./commands/fork/index.js')
    ).default
  : null
const buddy = null
const poor = feature('POOR')
  ? (
      require('./commands/poor/index.js') as typeof import('./commands/poor/index.js')
    ).default
  : null
const coreRuntime = createCoreRuntime()
const personalLocalCommandTrimmed = coreRuntime.isCoreLocal
const releaseNotes = personalLocalCommandTrimmed
  ? null
  : require('./commands/release-notes/index.js').default
const localVaultCommand = personalLocalCommandTrimmed
  ? null
  : require('./commands/local-vault/index.js').default
const localMemoryCommand = personalLocalCommandTrimmed
  ? null
  : require('./commands/local-memory/index.js').default
const terminalSetup = personalLocalCommandTrimmed
  ? null
  : require('./commands/terminalSetup/index.js').default
const plugin = null
const chrome = null
const stickers = personalLocalCommandTrimmed
  ? null
  : require('./commands/stickers/index.js').default
const upgrade = personalLocalCommandTrimmed
  ? null
  : require('./commands/upgrade/index.js').default
const autofixPr = null
const issue = personalLocalCommandTrimmed
  ? null
  : require('./commands/issue/index.js').default
const onboarding = personalLocalCommandTrimmed
  ? null
  : require('./commands/onboarding/index.js').default
const securityReview = personalLocalCommandTrimmed
  ? null
  : require('./commands/security-review.js').default
const agents = personalLocalCommandTrimmed
  ? null
  : require('./commands/agents/index.js').default
const advisor = personalLocalCommandTrimmed
  ? null
  : require('./commands/advisor.js').default
const autonomy = null
const commit = personalLocalCommandTrimmed
  ? null
  : require('./commands/commit.js').default
const commitPushPr = personalLocalCommandTrimmed
  ? null
  : require('./commands/commit-push-pr.js').default
const debugToolCall = personalLocalCommandTrimmed
  ? null
  : require('./commands/debug-tool-call/index.js').default
const effort = personalLocalCommandTrimmed
  ? null
  : require('./commands/effort/index.js').default
const heapDump = personalLocalCommandTrimmed
  ? null
  : require('./commands/heapdump/index.js').default
const ide = personalLocalCommandTrimmed
  ? null
  : require('./commands/ide/index.js').default
const initVerifiers = personalLocalCommandTrimmed
  ? null
  : require('./commands/init-verifiers.js').default
const pr_comments = personalLocalCommandTrimmed
  ? null
  : require('./commands/pr_comments/index.js').default
const rateLimitOptions = personalLocalCommandTrimmed
  ? null
  : require('./commands/rate-limit-options/index.js').default
const recap = personalLocalCommandTrimmed
  ? null
  : require('./commands/recap/index.js').default
const reloadPlugins = null
const rename = personalLocalCommandTrimmed
  ? null
  : require('./commands/rename/index.js').default
const skills = personalLocalCommandTrimmed
  ? null
  : require('./commands/skills/index.js').default
const tasks = personalLocalCommandTrimmed
  ? null
  : require('./commands/tasks/index.js').default
const branch = personalLocalCommandTrimmed
  ? null
  : require('./commands/branch/index.js').default
const bridgeKick = personalLocalCommandTrimmed
  ? null
  : require('./commands/bridge-kick.js').default
const fast = personalLocalCommandTrimmed
  ? null
  : require('./commands/fast/index.js').default
const feedback = personalLocalCommandTrimmed
  ? null
  : require('./commands/feedback/index.js').default
const passes = null
const perfIssue = personalLocalCommandTrimmed
  ? null
  : require('./commands/perf-issue/index.js').default
const privacySettings = personalLocalCommandTrimmed
  ? null
  : require('./commands/privacy-settings/index.js').default
const review = null
const ultrareview = null
const sandboxToggle = personalLocalCommandTrimmed
  ? null
  : require('./commands/sandbox-toggle/index.js').default
const session = personalLocalCommandTrimmed
  ? null
  : require('./commands/session/index.js').default
const summary = personalLocalCommandTrimmed
  ? null
  : require('./commands/summary/index.js').default
const tuiModule = personalLocalCommandTrimmed
  ? null
  : (require('./commands/tui/index.js') as typeof import('./commands/tui/index.js'))
const tui = tuiModule?.default ?? null
const tuiNonInteractive = tuiModule?.tuiNonInteractive ?? null
const antTrace = personalLocalCommandTrimmed
  ? null
  : require('./commands/ant-trace/index.js').default
const backfillSessions = personalLocalCommandTrimmed
  ? null
  : require('./commands/backfill-sessions/index.js').default
const bughunter = personalLocalCommandTrimmed
  ? null
  : require('./commands/bughunter/index.js').default
const goodClaude = personalLocalCommandTrimmed
  ? null
  : require('./commands/good-claude/index.js').default
const mockLimits = personalLocalCommandTrimmed
  ? null
  : require('./commands/mock-limits/index.js').default
const oauthRefresh = personalLocalCommandTrimmed
  ? null
  : require('./commands/oauth-refresh/index.js').default
/* eslint-enable @typescript-eslint/no-require-imports */
import permissions from './commands/permissions/index.js'
import plan from './commands/plan/index.js'
import hooks from './commands/hooks/index.js'
import files from './commands/files/index.js'
import rewind from './commands/rewind/index.js'
import version from './commands/version.js'
import provider from './commands/provider.js'
import { logError } from './utils/log.js'
import { toError } from './utils/errors.js'
import { logForDebugging } from './utils/debug.js'
import memoize from 'lodash-es/memoize.js'
import { isUsing3PServices, isClaudeAISubscriber } from './core/auth/coreAuth.js'
import { isFirstPartyAnthropicBaseUrl } from './core/providers/coreProviders.js'
import { isPersonalLocalProfileEnabled } from './utils/personalLocal.js'
import env from './commands/env/index.js'
import exit from './commands/exit/index.js'
import exportCommand from './commands/export/index.js'
import model from './commands/model/index.js'
import tag from './commands/tag/index.js'
import outputStyle from './commands/output-style/index.js'
import {
  extraUsage,
  extraUsageNonInteractive,
} from './commands/extra-usage/index.js'
import statusline from './commands/statusline.js'
// stats/index.ts re-exports usage — /stats is now an alias of /usage
// insights.ts is 113KB (3200 lines, includes diffLines/html rendering). Lazy
// shim defers the heavy module until /insights is actually invoked.
const usageReport: Command = {
  type: 'prompt',
  name: 'insights',
  description: 'Generate a report analyzing your Claude Code sessions',
  contentLength: 0,
  progressMessage: 'analyzing your sessions',
  source: 'builtin',
  async getPromptForCommand(args, context) {
    const real = (await import('./commands/insights.js')).default
    if (real.type !== 'prompt') throw new Error('unreachable')
    return real.getPromptForCommand(args, context)
  },
}
import { getSettingSourceName } from './utils/settings/constants.js'
import {
  type Command,
  getCommandName,
  isCommandEnabled,
} from './types/command.js'

// Re-export types from the centralized location
export type {
  Command,
  CommandBase,
  CommandResultDisplay,
  LocalCommandResult,
  LocalJSXCommandContext,
  PromptCommand,
  ResumeEntrypoint,
} from './types/command.js'
export { getCommandName, isCommandEnabled } from './types/command.js'

// Commands that get eliminated from the external build
// Public-but-previously-locked commands moved to the main COMMANDS array below:
//   commit, commitPushPr, bridgeKick, initVerifiers, autofixPr, onboarding
// Remaining items here are truly Anthropic-internal (admin/diagnostics endpoints
// with no fork backend), so they only show up under USER_TYPE=ant.
export const INTERNAL_ONLY_COMMANDS = [
  backfillSessions,
  bughunter,
  goodClaude,
  mockLimits,
  antTrace,
  oauthRefresh,
].filter(Boolean)

function filterCommandsForPersonalLocal(commands: Command[]): Command[] {
  if (!isPersonalLocalProfileEnabled()) return commands
  return filterToCoreCommands(commands)
}

// Declared as a function so that we don't run this until getCommands is called,
// since underlying functions read from config, which can't be read at module initialization time
const COMMANDS = memoize((): Command[] => [
  addDir,
  ...(advisor ? [advisor] : []),
  ...(localVaultCommand ? [localVaultCommand] : []),
  ...(localMemoryCommand ? [localMemoryCommand] : []),
  ...(autonomy ? [autonomy] : []),
  provider,
  ...(agents ? [agents] : []),
  ...(branch ? [branch] : []),
  btw,
  ...(chrome ? [chrome] : []),
  clear,
  color,
  compact,
  config,
  copy,
  context,
  contextNonInteractive,
  diff,
  doctor,
  ...(effort ? [effort] : []),
  exit,
  ...(fast ? [fast] : []),
  files,
  ...(heapDump ? [heapDump] : []),
  help,
  ...(ide ? [ide] : []),
  init,
  keybindings,
  lang,
  mcp,
  memory,
  model,
  outputStyle,
  ...(plugin ? [plugin] : []),
  ...(pr_comments ? [pr_comments] : []),
  ...(releaseNotes ? [releaseNotes] : []),
  ...(reloadPlugins ? [reloadPlugins] : []),
  ...(rename ? [rename] : []),
  resume,
  ...(session ? [session] : []),
  ...(skills ? [skills] : []),
  status,
  statusline,
  ...(stickers ? [stickers] : []),
  tag,
  theme,
  ...(feedback ? [feedback] : []),
  ...(review ? [review] : []),
  ...(ultrareview ? [ultrareview] : []),
  rewind,
  ...(securityReview ? [securityReview] : []),
  ...(terminalSetup ? [terminalSetup] : []),
  ...(upgrade ? [upgrade] : []),
  extraUsage,
  extraUsageNonInteractive,
  ...(rateLimitOptions ? [rateLimitOptions] : []),
  usage,
  usageReport,
  vim,
  ...(forkCmd ? [forkCmd] : []),
  ...(buddy ? [buddy] : []),
  ...(poor ? [poor] : []),
  ...(proactive ? [proactive] : []),
  ...(monitorCmd ? [monitorCmd] : []),
  ...(coordinatorCmd ? [coordinatorCmd] : []),
  ...(briefCommand ? [briefCommand] : []),
  ...(assistantCommand ? [assistantCommand] : []),
  ...(bridge ? [bridge] : []),
  ...(remoteControlServerCommand ? [remoteControlServerCommand] : []),
  ...(voiceCommand ? [voiceCommand] : []),
  permissions,
  plan,
  ...(privacySettings ? [privacySettings] : []),
  hooks,
  exportCommand,
  ...(sandboxToggle ? [sandboxToggle] : []),
  ...(!isUsing3PServices() ? [logout, login()] : []),
  ...(passes ? [passes] : []),
  ...(peersCmd ? [peersCmd] : []),
  ...(attachCmd ? [attachCmd] : []),
  ...(detachCmd ? [detachCmd] : []),
  ...(sendCmd ? [sendCmd] : []),
  ...(pipesCmd ? [pipesCmd] : []),
  ...(pipeStatusCmd ? [pipeStatusCmd] : []),
  ...(historyCmd ? [historyCmd] : []),
  ...(claimMainCmd ? [claimMainCmd] : []),
  ...(tasks ? [tasks] : []),
  ...(workflowsCmd ? [workflowsCmd] : []),
  ...(ultraplan ? [ultraplan] : []),
  ...(torch ? [torch] : []),
  ...(daemonCmd ? [daemonCmd] : []),
  ...(jobCmd ? [jobCmd] : []),
  ...(forceSnip ? [forceSnip] : []),
  ...(summary ? [summary] : []),
  ...(recap ? [recap] : []),
  ...(autofixPr ? [autofixPr] : []),
  ...(commit ? [commit] : []),
  ...(commitPushPr ? [commitPushPr] : []),
  ...(bridgeKick ? [bridgeKick] : []),
  version,
  ...(subscribePr ? [subscribePr] : []),
  ...(initVerifiers ? [initVerifiers] : []),
  env,
  ...(debugToolCall ? [debugToolCall] : []),
  ...(perfIssue ? [perfIssue] : []),
  breakCache,
  breakCacheNonInteractive,
  ...(issue ? [issue] : []),
  ...(tui ? [tui] : []),
  ...(tuiNonInteractive ? [tuiNonInteractive] : []),
  ...(onboarding ? [onboarding] : []),
  ...(process.env.USER_TYPE === 'ant' && !process.env.IS_DEMO
    ? INTERNAL_ONLY_COMMANDS
    : []),
])

export const builtInCommandNames = memoize(
  (): Set<string> =>
    new Set(
      filterCommandsForPersonalLocal(COMMANDS()).flatMap(_ => [
        _.name,
        ...(_.aliases ?? []),
      ]),
    ),
)

async function getSkills(cwd: string): Promise<{
  skillDirCommands: Command[]
  bundledSkills: Command[]
}> {
  try {
    const [skillsDirModule, bundledSkillsModule] = await Promise.all([
      import('./skills/loadSkillsDir.js'),
      import('./skills/bundledSkills.js'),
    ])
    const skillDirCommands = await skillsDirModule
      .getSkillDirCommands(cwd)
      .catch(err => {
        logError(toError(err))
        logForDebugging(
          'Skill directory commands failed to load, continuing without them',
        )
        return []
      })
    // Bundled skills are registered synchronously at startup
    const bundledSkills = bundledSkillsModule.getBundledSkills()
    logForDebugging(
      `getSkills returning: ${skillDirCommands.length} skill dir commands, ${bundledSkills.length} bundled skills`,
    )
    return {
      skillDirCommands,
      bundledSkills,
    }
  } catch (err) {
    // This should never happen since we catch at the Promise level, but defensive
    logError(toError(err))
    logForDebugging('Unexpected error in getSkills, returning empty')
    return {
      skillDirCommands: [],
      bundledSkills: [],
    }
  }
}

/* eslint-disable @typescript-eslint/no-require-imports */
const getWorkflowCommands = feature('WORKFLOW_SCRIPTS')
  ? (
      require('@claude-code-best/builtin-tools/tools/WorkflowTool/createWorkflowCommand.js') as typeof import('@claude-code-best/builtin-tools/tools/WorkflowTool/createWorkflowCommand.js')
    ).getWorkflowCommands
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Filters commands by their declared `availability` (auth/provider requirement).
 * Commands without `availability` are treated as universal.
 * This runs before `isEnabled()` so that provider-gated commands are hidden
 * regardless of feature-flag state.
 *
 * Not memoized — auth state can change mid-session (e.g. after /login),
 * so this must be re-evaluated on every getCommands() call.
 */
export function meetsAvailabilityRequirement(cmd: Command): boolean {
  if (!cmd.availability || cmd.availability.length === 0) return true
  for (const a of cmd.availability) {
    switch (a) {
      case 'claude-ai':
        if (isClaudeAISubscriber()) return true
        break
      case 'console':
        // Console API key user = direct 1P API customer (not 3P, not claude.ai).
        // Excludes 3P (Bedrock/Vertex/Foundry) who don't set ANTHROPIC_BASE_URL
        // and gateway users who proxy through a custom base URL.
        if (
          !isClaudeAISubscriber() &&
          !isUsing3PServices() &&
          isFirstPartyAnthropicBaseUrl()
        )
          return true
        break
      default: {
        const _exhaustive: never = a
        void _exhaustive
        break
      }
    }
  }
  return false
}

/**
 * Loads all command sources (skills, plugins, workflows). Memoized by cwd
 * because loading is expensive (disk I/O, dynamic imports).
 */
const loadAllCommands = memoize(async (cwd: string): Promise<Command[]> => {
  if (isPersonalLocalProfileEnabled()) {
    return filterToCoreCommands(COMMANDS())
  }

  const [{ skillDirCommands, bundledSkills }, workflowCommands] =
    await Promise.all([
      getSkills(cwd),
      getWorkflowCommands ? getWorkflowCommands(cwd) : Promise.resolve([]),
    ])

  return [
    ...bundledSkills,
    ...skillDirCommands,
    ...(workflowCommands as Command[]),
    ...COMMANDS(),
  ]
})

/**
 * Returns commands available to the current user. The expensive loading is
 * memoized, but availability and isEnabled checks run fresh every call so
 * auth changes (e.g. /login) take effect immediately.
 */
export async function getCommands(cwd: string): Promise<Command[]> {
  const allCommands = await loadAllCommands(cwd)

  // Get dynamic skills discovered during file operations
  const dynamicSkills = isPersonalLocalProfileEnabled()
    ? []
    : (await import('./skills/loadSkillsDir.js')).getDynamicSkills()

  // Build base commands without dynamic skills
  const baseCommands = allCommands.filter(
    _ => meetsAvailabilityRequirement(_) && isCommandEnabled(_),
  )

  if (dynamicSkills.length === 0 || isPersonalLocalProfileEnabled()) {
    return filterCommandsForPersonalLocal(baseCommands)
  }

  // Dedupe dynamic skills - only add if not already present
  const baseCommandNames = new Set(baseCommands.map(c => c.name))
  const uniqueDynamicSkills = dynamicSkills.filter(
    s =>
      !baseCommandNames.has(s.name) &&
      meetsAvailabilityRequirement(s) &&
      isCommandEnabled(s),
  )

  if (uniqueDynamicSkills.length === 0) {
    return filterCommandsForPersonalLocal(baseCommands)
  }

  // Insert dynamic skills after plugin skills but before built-in commands
  const builtInNames = new Set(COMMANDS().map(c => c.name))
  const insertIndex = baseCommands.findIndex(c => builtInNames.has(c.name))

  if (insertIndex === -1) {
    return filterCommandsForPersonalLocal([
      ...baseCommands,
      ...uniqueDynamicSkills,
    ])
  }

  return filterCommandsForPersonalLocal([
    ...baseCommands.slice(0, insertIndex),
    ...uniqueDynamicSkills,
    ...baseCommands.slice(insertIndex),
  ])
}

/**
 * Clears only the memoization caches for commands, WITHOUT clearing skill caches.
 * Use this when dynamic skills are added to invalidate cached command lists.
 */
export function clearCommandMemoizationCaches(): void {
  loadAllCommands.cache?.clear?.()
  getSkillToolCommands.cache?.clear?.()
  getSlashCommandToolSkills.cache?.clear?.()
  clearSkillIndexCache?.()
}

export function clearCommandsCache(): void {
  clearCommandMemoizationCaches()
  if (isPersonalLocalProfileEnabled()) return

  const { clearSkillCaches } =
    require('./skills/loadSkillsDir.js') as typeof import('./skills/loadSkillsDir.js')
  clearSkillCaches()
}

/**
 * Filter AppState.mcp.commands to MCP-provided skills (prompt-type,
 * model-invocable, loaded from MCP). These live outside getCommands() so
 * callers that need MCP skills in their skill index thread them through
 * separately.
 */
export function getMcpSkillCommands(
  mcpCommands: readonly Command[],
): readonly Command[] {
  if (feature('MCP_SKILLS')) {
    return mcpCommands.filter(
      cmd =>
        cmd.type === 'prompt' &&
        cmd.loadedFrom === 'mcp' &&
        !cmd.disableModelInvocation,
    )
  }
  return []
}

// SkillTool shows ALL prompt-based commands that the model can invoke
// This includes both skills (from /skills/) and commands (from /commands/)
export const getSkillToolCommands = memoize(
  async (cwd: string): Promise<Command[]> => {
    const allCommands = await getCommands(cwd)
    return allCommands.filter(
      cmd =>
        cmd.type === 'prompt' &&
        !cmd.disableModelInvocation &&
        cmd.source !== 'builtin' &&
        // Always include skills from /skills/ dirs, bundled skills, and legacy /commands/ entries
        // (they all get an auto-derived description from the first line if frontmatter is missing).
        // Plugin/MCP commands still require an explicit description to appear in the listing.
        (cmd.loadedFrom === 'bundled' ||
          cmd.loadedFrom === 'skills' ||
          cmd.loadedFrom === 'commands_DEPRECATED' ||
          cmd.hasUserSpecifiedDescription ||
          cmd.whenToUse),
    )
  },
)

// Filters commands to include only skills. Skills are commands that provide
// specialized capabilities for the model to use. They are identified by
// loadedFrom being 'skills', 'plugin', or 'bundled', or having disableModelInvocation set.
export const getSlashCommandToolSkills = memoize(
  async (cwd: string): Promise<Command[]> => {
    try {
      const allCommands = await getCommands(cwd)
      return allCommands.filter(
        cmd =>
          cmd.type === 'prompt' &&
          cmd.source !== 'builtin' &&
          (cmd.hasUserSpecifiedDescription || cmd.whenToUse) &&
          (cmd.loadedFrom === 'skills' ||
            cmd.loadedFrom === 'plugin' ||
            cmd.loadedFrom === 'bundled' ||
            cmd.disableModelInvocation),
      )
    } catch (error) {
      logError(toError(error))
      // Return empty array rather than throwing - skills are non-critical
      // This prevents skill loading failures from breaking the entire system
      logForDebugging('Returning empty skills array due to load failure')
      return []
    }
  },
)

/**
 * Commands that are safe to use in remote mode (--remote).
 * These only affect local TUI state and don't depend on local filesystem,
 * git, shell, IDE, MCP, or other local execution context.
 *
 * Used in two places:
 * 1. Pre-filtering commands in main.tsx before REPL renders (prevents race with CCR init)
 * 2. Preserving local-only commands in REPL's handleRemoteInit after CCR filters
 */
export const REMOTE_SAFE_COMMANDS: Set<Command> = new Set(
  [
    session, // Shows QR code / URL for remote session
    exit, // Exit the TUI
    clear, // Clear screen
    help, // Show help
    theme, // Change terminal theme
    color, // Change agent color
    vim, // Toggle vim mode
    usage, // Show session cost, plan usage, and activity stats (/cost and /stats are aliases)
    copy, // Copy last message
    btw, // Quick note
    feedback, // Send feedback
    plan, // Plan mode toggle
    proactive, // Toggle proactive mode
    keybindings, // Keybinding management
    statusline, // Status line toggle
    stickers, // Stickers
  ].filter((c): c is Command => c !== null),
)

/**
 * Builtin commands of type 'local' that ARE safe to execute when received
 * over the Remote Control bridge. These produce text output that streams
 * back to the mobile/web client and have no terminal-only side effects.
 *
 * 'local-jsx' commands are blocked by type (they render Ink UI) and
 * 'prompt' commands are allowed by type (they expand to text sent to the
 * model) — this set only gates 'local' commands.
 *
 * When adding a new 'local' command that should work from mobile, add it
 * here. Default is blocked.
 */
export const BRIDGE_SAFE_COMMANDS: Set<Command> = new Set(
  [
    compact, // Shrink context — useful mid-session from a phone
    clear, // Wipe transcript
    usage, // Show session cost (/cost alias)
    summary, // Summarize conversation
    releaseNotes, // Show changelog
    files, // List tracked files
  ].filter((c): c is Command => c !== null),
)

/**
 * Whether a slash command is safe to execute when its input arrived over the
 * Remote Control bridge (mobile/web client).
 *
 * PR #19134 blanket-blocked all slash commands from bridge inbound because
 * `/model` from iOS was popping the local Ink picker. This predicate relaxes
 * that with an explicit allowlist: 'prompt' commands (skills) expand to text
 * and are safe by construction; 'local' commands need an explicit opt-in via
 * BRIDGE_SAFE_COMMANDS; 'local-jsx' commands render Ink UI and stay blocked.
 */
export function isBridgeSafeCommand(cmd: Command): boolean {
  if (cmd.type === 'local-jsx') return cmd.bridgeSafe === true
  if (cmd.type === 'prompt') return true
  return cmd.bridgeSafe === true || BRIDGE_SAFE_COMMANDS.has(cmd)
}

export function getBridgeCommandSafety(
  cmd: Command,
  args: string,
): { ok: true } | { ok: false; reason?: string } {
  if (!isBridgeSafeCommand(cmd)) return { ok: false }
  const reason = cmd.getBridgeInvocationError?.(args)
  return reason ? { ok: false, reason } : { ok: true }
}

/**
 * Filter commands to only include those safe for remote mode.
 * Used to pre-filter commands when rendering the REPL in --remote mode,
 * preventing local-only commands from being briefly available before
 * the CCR init message arrives.
 */
export function filterCommandsForRemoteMode(commands: Command[]): Command[] {
  return commands.filter(cmd => REMOTE_SAFE_COMMANDS.has(cmd))
}

export function findCommand(
  commandName: string,
  commands: Command[],
): Command | undefined {
  return commands.find(
    _ =>
      _.name === commandName ||
      getCommandName(_) === commandName ||
      _.aliases?.includes(commandName),
  )
}

export function hasCommand(commandName: string, commands: Command[]): boolean {
  return findCommand(commandName, commands) !== undefined
}

export function getCommand(commandName: string, commands: Command[]): Command {
  const command = findCommand(commandName, commands)
  if (!command) {
    throw ReferenceError(
      `Command ${commandName} not found. Available commands: ${commands
        .map(_ => {
          const name = getCommandName(_)
          return _.aliases ? `${name} (aliases: ${_.aliases.join(', ')})` : name
        })
        .sort((a, b) => a.localeCompare(b))
        .join(', ')}`,
    )
  }

  return command
}

/**
 * Formats a command's description with its source annotation for user-facing UI.
 * Use this in typeahead, help screens, and other places where users need to see
 * where a command comes from.
 *
 * For model-facing prompts (like SkillTool), use cmd.description directly.
 */
export function formatDescriptionWithSource(cmd: Command): string {
  if (cmd.type !== 'prompt') {
    return cmd.description
  }

  if (cmd.kind === 'workflow') {
    return `${cmd.description} (workflow)`
  }

  if (cmd.source === 'plugin') {
    const pluginName = cmd.pluginInfo?.pluginManifest.name
    if (pluginName) {
      return `(${pluginName}) ${cmd.description}`
    }
    return `${cmd.description} (plugin)`
  }

  if (cmd.source === 'builtin' || cmd.source === 'mcp') {
    return cmd.description
  }

  if (cmd.source === 'bundled') {
    return `${cmd.description} (bundled)`
  }

  return `${cmd.description} (${getSettingSourceName(cmd.source)})`
}
