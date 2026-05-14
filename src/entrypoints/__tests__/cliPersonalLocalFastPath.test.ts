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
      // Default product mode is personal-local. Make this explicit so the
      // test remains stable if the parent test runner env opts out.
      CLAUDE_CODE_LOCAL_PERSONAL: '1',
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

describe('CLI personal-local fast paths', () => {
  test('keeps version fast path available', () => {
    const result = runCli(['--version'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('(Claude Code)')
  })

  test('blocks remote control fast path by default', () => {
    const result = runCli(['remote-control'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('personal-local profile disables')
  })

  test('blocks browser automation fast path by default', () => {
    const result = runCli(['--claude-in-chrome-mcp'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('personal-local profile disables')
  })

  test('blocks computer-use fast path by default', () => {
    const result = runCli(['--computer-use-mcp'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('personal-local profile disables')
  })
})
