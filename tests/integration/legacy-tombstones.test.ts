import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

const cliPath = join(process.cwd(), 'src/entrypoints/cli.tsx')

function runCli(args: string[]): {
  exitCode: number
  stdout: string
  stderr: string
} {
  const result = Bun.spawnSync(['bun', 'run', cliPath, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLAUDE_CODE_LOCAL_PERSONAL: '1',
      ANTHROPIC_API_KEY: 'test-key-for-tombstones',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })

  return {
    exitCode: result.exitCode ?? 0,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }
}

describe('legacy tombstones', () => {
  test('--teleport is removed with stable error', () => {
    const result = runCli(['--teleport'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('--teleport/--remote has been removed from this build')
  })

  test('--remote is removed with stable error', () => {
    const result = runCli(['--remote'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('--teleport/--remote has been removed from this build')
  })
})
