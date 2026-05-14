import { describe, expect, test, beforeEach, afterEach } from 'bun:test'

const { getAPIProvider, isFirstPartyAnthropicBaseUrl } = await import(
  '../providers'
)

describe('getAPIProvider', () => {
  const envKeys = [
    'CLAUDE_CODE_USE_GEMINI',
    'CLAUDE_CODE_USE_BEDROCK',
    'CLAUDE_CODE_USE_VERTEX',
    'CLAUDE_CODE_USE_FOUNDRY',
    'CLAUDE_CODE_USE_OPENAI',
    'CLAUDE_CODE_USE_GROK',
    'CLAUDE_CODE_LOCAL_PERSONAL',
    'OPENAI_BASE_URL',
    'GEMINI_BASE_URL',
  ] as const
  const savedEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    // Save and clear environment variables
    for (const key of envKeys) {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    }
    // The product default is personal-local; opt out explicitly where tests
    // exercise provider routing independent of the default profile switch.
    process.env.CLAUDE_CODE_LOCAL_PERSONAL = '0'
  })

  afterEach(() => {
    // Restore environment variables
    for (const key of envKeys) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key]
      } else {
        delete process.env[key]
      }
    }
  })

  test('personal-local is the default provider profile', () => {
    delete process.env.CLAUDE_CODE_LOCAL_PERSONAL
    process.env.CLAUDE_CODE_USE_GEMINI = '1'
    expect(getAPIProvider({ modelType: 'grok' })).toBe('firstParty')
  })

  test('returns "firstParty" by default in full profile', () => {
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('ignores removed Gemini/Grok modelType selections', () => {
    expect(getAPIProvider({ modelType: 'gemini' })).toBe('firstParty')
    expect(getAPIProvider({ modelType: 'grok' })).toBe('firstParty')
  })

  test('ignores removed cloud provider environment variables', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    process.env.CLAUDE_CODE_USE_VERTEX = '1'
    process.env.CLAUDE_CODE_USE_FOUNDRY = '1'
    process.env.CLAUDE_CODE_USE_GEMINI = '1'
    process.env.CLAUDE_CODE_USE_GROK = '1'
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('"0" is not truthy', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '0'
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('empty string is not truthy', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = ''
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('OPENAI_BASE_URL alone does not select OpenAI provider', () => {
    process.env.OPENAI_BASE_URL = 'https://example.com/v1'
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('GEMINI_BASE_URL alone does not select Gemini provider', () => {
    process.env.GEMINI_BASE_URL = 'https://example.com'
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('personal-local keeps OpenAI-compatible provider available', () => {
    process.env.CLAUDE_CODE_LOCAL_PERSONAL = '1'
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    expect(getAPIProvider({})).toBe('openai')
  })

  test('personal-local ignores cloud provider environment variables', () => {
    process.env.CLAUDE_CODE_LOCAL_PERSONAL = '1'
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    process.env.CLAUDE_CODE_USE_VERTEX = '1'
    process.env.CLAUDE_CODE_USE_FOUNDRY = '1'
    expect(getAPIProvider({})).toBe('firstParty')
  })

  test('personal-local ignores Gemini and Grok provider selection', () => {
    process.env.CLAUDE_CODE_LOCAL_PERSONAL = '1'
    process.env.CLAUDE_CODE_USE_GEMINI = '1'
    expect(getAPIProvider({ modelType: 'grok' })).toBe('firstParty')
  })
})

describe('isFirstPartyAnthropicBaseUrl', () => {
  const originalBaseUrl = process.env.ANTHROPIC_BASE_URL
  const originalUserType = process.env.USER_TYPE

  afterEach(() => {
    if (originalBaseUrl !== undefined) {
      process.env.ANTHROPIC_BASE_URL = originalBaseUrl
    } else {
      delete process.env.ANTHROPIC_BASE_URL
    }
    if (originalUserType !== undefined) {
      process.env.USER_TYPE = originalUserType
    } else {
      delete process.env.USER_TYPE
    }
  })

  test('returns true when ANTHROPIC_BASE_URL is not set', () => {
    delete process.env.ANTHROPIC_BASE_URL
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
  })

  test('returns true for api.anthropic.com', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
  })

  test('returns false for custom URL', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://my-proxy.com'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
  })

  test('returns false for invalid URL', () => {
    process.env.ANTHROPIC_BASE_URL = 'not-a-url'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
  })

  test('returns true for staging URL when USER_TYPE is ant', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api-staging.anthropic.com'
    process.env.USER_TYPE = 'ant'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
  })

  test('returns true for URL with path', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
  })

  test('returns true for trailing slash', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com/'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
  })

  test('returns false for subdomain attack', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://evil-api.anthropic.com'
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
  })
})
