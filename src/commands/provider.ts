import type { Command } from '../commands.js'
import type { LocalCommandCall } from '../types/command.js'
import { getRuntimeAPIProvider as getAPIProvider } from '../core/providers/coreProviders.js'
import { applyConfigEnvironmentVariables } from '../utils/managedEnv.js'
import { updateSettingsForSource } from '../utils/settings/settings.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'

// Get merged env: process.env + settings.env (from userSettings)
function getMergedEnv(): Record<string, string> {
  const settings = getSettings_DEPRECATED()
  const merged: Record<string, string> = Object.fromEntries(
    Object.entries(process.env).filter(
      (e): e is [string, string] => e[1] !== undefined,
    ),
  )
  if (settings?.env) {
    Object.assign(merged, settings.env)
  }
  return merged
}

const call: LocalCommandCall = async (args, _context) => {
  const arg = args.trim().toLowerCase()

  if (!arg) {
    const current = getAPIProvider()
    return { type: 'text', value: `Current API provider: ${current}` }
  }

  if (arg === 'unset') {
    updateSettingsForSource('userSettings', { modelType: undefined })
    delete process.env.CLAUDE_CODE_USE_OPENAI
    return {
      type: 'text',
      value:
        'API provider cleared (will use Anthropic unless OpenAI is configured).',
    }
  }

  const validProviders = ['anthropic', 'openai']
  if (!validProviders.includes(arg)) {
    return {
      type: 'text',
      value: `Invalid provider: ${arg}\nValid: ${validProviders.join(', ')}`,
    }
  }

  if (arg === 'openai') {
    const mergedEnv = getMergedEnv()
    const hasChatGPTAuth = mergedEnv.OPENAI_AUTH_MODE === 'chatgpt'
    const hasKey = !!mergedEnv.OPENAI_API_KEY
    const hasUrl = !!mergedEnv.OPENAI_BASE_URL
    updateSettingsForSource('userSettings', { modelType: 'openai' })
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    applyConfigEnvironmentVariables()
    if (!hasChatGPTAuth && (!hasKey || !hasUrl)) {
      const missing = []
      if (!hasKey) missing.push('OPENAI_API_KEY')
      if (!hasUrl) missing.push('OPENAI_BASE_URL')
      return {
        type: 'text',
        value: `Switched to OpenAI provider.\nWarning: Missing env vars: ${missing.join(', ')}\nConfigure them via /login or set manually.`,
      }
    }
    return { type: 'text', value: 'API provider set to openai.' }
  }

  updateSettingsForSource('userSettings', { modelType: undefined })
  delete process.env.CLAUDE_CODE_USE_OPENAI
  applyConfigEnvironmentVariables()
  return { type: 'text', value: 'API provider set to anthropic.' }
}

const provider = {
  type: 'local',
  name: 'provider',
  description: 'Switch API provider (anthropic/openai)',
  aliases: ['api'],
  argumentHint: '[anthropic|openai|unset]',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default provider
