# Personal Local Profile

Claude Code can run in **personal-local mode**, a stripped-down profile focused on local coding tasks. It ships with a reduced tool set, a minimal slash-command surface, and no dynamic plugin/skill/workflow loading.

## Enabling

Personal-local mode is the **default** for this build. You can also set it explicitly:

```bash
export CLAUDE_CODE_LOCAL_PERSONAL=1
# or
claude --personal-local
```

To opt out (requires explicit `0`, `false`, `no`, or `off`):

```bash
export CLAUDE_CODE_LOCAL_PERSONAL=0
```

## Tool Set

Personal-local exposes exactly 11 tools:

| Tool | Description |
|------|-------------|
| `Bash` | Execute shell commands |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `Read` | Read files |
| `Edit` | Edit file content in-place |
| `Write` | Write or overwrite files |
| `TodoWrite` | Create and update task todos |
| `EnterPlanMode` | Enter planning mode |
| `ExitPlanMode` | Exit planning mode |
| `WebFetch` | Fetch HTTP content |
| `WebSearch` | Web search |

These are the only tools available. The following tool types are **excluded** (high cost, complexity, or remote/enterprise scope):

- `Agent` / subagent tools
- `SendMessage`, `SendUserFile`, `ListPeers`, `PushNotification`
- `ComputerUse`, `WebBrowser`
- `CronCreate`, `CronDelete`, `CronList`
- `Workflow`, `Execute`
- `TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList`
- `VaultHttpFetch`, `LocalMemoryRecall`

## Slash Commands

The command surface is filtered to local-only operations. Run `/help` in the REPL to see the available commands. The following domains are **excluded**:

- Remote control, bridge, daemon, autonomy
- Multi-machine commands: `peers`, `attach`, `detach`, `send`, `pipes`, `pipe-status`
- Voice, Chrome Use, Computer Use, Buddy, Assistant, Coordinator
- Skill search, skill learning, agent platforms
- Enterprise integrations: MDM, Remote Managed Settings, Sentry, Langfuse, GrowthBook

## Authentication

Personal-local supports two providers:

```bash
# Anthropic direct (default)
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI-compatible (Ollama, vLLM, DeepSeek, etc.)
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=http://localhost:11434
```

Run `/login` or `/provider` to switch providers interactively.

## Configuration

Settings are loaded from the standard locations:

- `~/.claude/settings.json` (user-level)
- `./.claude.json` (project-level)
- `--setting-sources user,project` (CLI override)

In personal-local mode:

- **No dynamic plugin loading** — plugins and skill directories are not scanned
- **No background daemon** — sessions are not persisted as background workers
- **No remote managed settings** — settings come only from local files
- **Telemetry is disabled** — no Sentry, Langfuse, or OpenTelemetry

## Poor Mode

To reduce token consumption in personal-local, enable `/poor` mode:

```bash
export CLAUDE_CODE_POOR=1
```

This disables `extract_memories`, `prompt_suggestion`, and `verification_agent`.

## Differences from Full Build

| Feature | Full Build | Personal-Local |
|---------|-----------|----------------|
| Tools | 50+ | 11 |
| Commands | 100+ | ~35 |
| Plugin loading | Yes | No |
| Daemon / background sessions | Yes | No |
| Remote control | Yes | No |
| Provider | All 7 | `firstParty` + `openai` |
| Telemetry | Sentry + Langfuse | None |
| MDM / managed env | Yes | No |

## Environment Variables

Key environment variables for personal-local:

```bash
CLAUDE_CODE_LOCAL_PERSONAL=1   # Enable (default)
CLAUDE_CODE_POOR=1            # Reduce token usage
CLAUDE_CODE_SIMPLE=1          # Bare mode (only Bash/Read/Edit)
ANTHROPIC_API_KEY=...         # Anthropic key
CLAUDE_CODE_USE_OPENAI=1      # Switch to OpenAI-compatible
OPENAI_API_KEY=...            # OpenAI-compatible key
OPENAI_BASE_URL=...           # Custom endpoint
```