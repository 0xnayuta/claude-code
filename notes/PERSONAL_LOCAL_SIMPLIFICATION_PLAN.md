# 个人本地 Coding Agent 精简计划

> 目标：将当前功能较完整、包含远程控制/协作/企业观测/桌面自动化等能力的 Claude Code fork，裁剪为一个面向个人使用的本地 coding agent。
>
> 本计划基于当前仓库代码与文档结构整理，强调 **先 feature/profile 收缩，再物理删除**。每个阶段都必须保证 `bun run typecheck` 通过。

## 1. 精简目标

### 1.1 最终产品形态

个人本地版应聚焦以下场景：

- 在本地终端中启动交互式 REPL。
- 与模型进行多轮 coding 对话。
- 读取、搜索、编辑、写入本地项目文件。
- 执行本地 shell 命令，并对危险命令进行明确确认。
- 保留 Todo/Plan 能力，用于任务拆解和执行跟踪。
- 保留会话历史、恢复、上下文压缩、token 预算与 Poor Mode。
- 保留一种或少数模型 provider，避免企业云/多 provider 兼容层过度复杂。
- 可选保留 WebSearch 或 WebFetch，但只保留一种主要后端/路径。

### 1.2 非目标

个人本地版不追求：

- 远程控制当前机器。
- 多机器群控或 LAN 自动发现。
- 后台 daemon/worker 常驻。
- 微信、飞书、Discord、Telegram 等外部 channel 接入。
- Computer Use / Chrome Use / Voice Mode。
- 企业策略、远程托管配置、GrowthBook 实验、Sentry、Langfuse、OpenTelemetry。
- 多 agent 群体协作、team/swarm/coordinator。
- 插件 marketplace、技能搜索/学习等动态扩展系统。

## 2. 当前核心架构判断

项目主链路如下：

```text
src/entrypoints/cli.tsx
  → src/main.tsx
  → src/screens/REPL.tsx
  → src/QueryEngine.ts
  → src/query.ts
  → src/services/api/claude.ts / provider adapters
  → src/tools.ts
  → packages/builtin-tools/src/tools/*
```

文档中的五层架构可以对应为：

| 层次 | 保留重点 | 主要文件 |
| --- | --- | --- |
| 交互层 | 终端 UI、用户输入、消息展示 | `src/screens/REPL.tsx`, `src/components/` |
| 编排层 | 会话状态、transcript、成本统计、文件历史 | `src/QueryEngine.ts` |
| 核心循环层 | streaming、tool loop、compact、错误恢复 | `src/query.ts` |
| 工具层 | 读写文件、搜索、Bash、Todo/Plan、Web | `src/tools.ts`, `packages/builtin-tools/src/tools/` |
| 通信层 | 模型 API 调用与 provider 适配 | `src/services/api/claude.ts`, `src/services/api/openai/` 等 |

个人版最小闭环不应破坏这条主链路。

## 3. 保留范围

### 3.1 必须保留

| 功能 | 原因 | 主要位置 |
| --- | --- | --- |
| CLI 启动 | 程序入口 | `src/entrypoints/cli.tsx`, `src/main.tsx` |
| REPL | 主要交互界面 | `src/screens/REPL.tsx`, `src/replLauncher.tsx` |
| QueryEngine | 会话编排、transcript、文件历史 | `src/QueryEngine.ts` |
| Agentic Loop | 核心思考-行动-观察循环 | `src/query.ts` |
| Claude/API 调用 | 模型通信 | `src/services/api/claude.ts` |
| 文件读取 | coding agent 基础能力 | `FileReadTool` |
| 文件编辑 | coding agent 基础能力 | `FileEditTool` |
| 文件写入 | 新建文件/完整重写 | `FileWriteTool` |
| Glob/Grep | 本地代码搜索 | `GlobTool`, `GrepTool` |
| Bash | 测试、构建、检查、git 等 | `BashTool` |
| Todo | 任务状态管理 | `TodoWriteTool` |
| Plan Mode | 只读规划、执行前确认 | `EnterPlanModeTool`, `ExitPlanModeV2Tool` |
| 权限系统 | 本地安全边界 | `src/hooks/toolPermission/`, `src/utils/permissions/` |
| 会话历史/恢复 | 个人长期使用必需 | transcript/session 相关模块 |
| 上下文压缩 | 长会话必需 | `src/services/compact/` |
| Token Budget | 成本与上下文控制 | `TOKEN_BUDGET` feature |
| Poor Mode | 降低额外 token 消耗 | `src/commands/poor/` |
| Prompt Cache Break Detection | 保持缓存稳定性 | `PROMPT_CACHE_BREAK_DETECTION` feature |

### 3.2 推荐保留但可简化

| 功能 | 建议 |
| --- | --- |
| WebFetch/WebSearch | 保留一种主要路径；如使用 Anthropic 官方 web search，可保留 `WebSearchTool`；如只需抓网页，可保留 `WebFetchTool`。 |
| MCP | 默认关闭自动连接；保留手动配置能力即可。 |
| Memory/CLAUDE.md | 保留项目 memory 与 CLAUDE.md 加载；删除团队 memory/sync。 |
| Hooks | 可保留本地 hook；关闭远程/channel/bridge relay。 |
| LSPTool | 默认关闭，通过 env 显式开启。 |
| PowerShellTool | Windows 用户可保留；否则默认关闭。 |
| SkillTool | 如果个人工作流依赖本地 skills 可保留；skill search/learning 后置。 |

## 4. 默认禁用或移除范围

### 4.1 远程控制与后台系统

| 功能 | 建议 | 主要位置 |
| --- | --- | --- |
| Remote Control / Bridge | 个人版默认不构建 | `src/bridge/`, `src/hooks/useReplBridge.tsx`, `BRIDGE_MODE` |
| Remote Control Server | 移出 workspace 或后续删除 | `packages/remote-control-server/` |
| Daemon | 默认关闭 | `src/daemon/`, `DAEMON`, `BG_SESSIONS` |
| ACP | 默认关闭 | `src/services/acp/`, `packages/acp-link/`, `ACP` |
| Background sessions | 默认关闭 | `BG_SESSIONS`, `ps/logs/attach/kill` 路径 |
| Templates/job | 默认关闭 | `TEMPLATES`, `src/commands/job/` |

### 4.2 多机/多进程协作

| 功能 | 建议 | 主要位置 |
| --- | --- | --- |
| UDS Inbox / Pipe IPC | 默认关闭 | `UDS_INBOX`, `src/hooks/usePipeIpc.ts`, `src/hooks/useInboxPoller.ts` |
| LAN Pipes | 默认关闭/删除 | `LAN_PIPES`, `docs/features/lan-pipes*.md` |
| Peers/Send/Attach/Detach/Pipes commands | 从个人版命令列表移除 | `src/commands/{peers,send,attach,detach,pipes,pipe-status}` |
| Coordinator/Swarm/Team | 默认关闭 | `COORDINATOR_MODE`, `src/coordinator/`, `src/utils/swarm/` |
| Team tools | 从工具注册中移除 | `TeamCreateTool`, `TeamDeleteTool`, `SendMessageTool` |

### 4.3 外部入口与自动化

| 功能 | 建议 | 主要位置 |
| --- | --- | --- |
| Channels | 默认关闭 | `--channels`, `src/services/mcp/channel*` |
| Weixin | 删除或移出 workspace | `packages/weixin/`, `ccb weixin` fast path |
| Computer Use | 默认关闭/后续删除 | `@ant/computer-use-*`, `src/utils/computerUse/`, `CHICAGO_MCP` |
| Chrome Use | 默认关闭/后续删除 | `@ant/claude-for-chrome-mcp`, `src/utils/claudeInChrome/` |
| Voice Mode | 默认关闭/后续删除 | `VOICE_MODE`, `src/hooks/useVoiceIntegration.tsx`, `src/services/voiceStreamSTT.ts` |
| Buddy | 删除或关闭 | `BUDDY`, `src/buddy/`, `src/commands/buddy/` |
| Kairos/assistant/proactive | 默认关闭 | `KAIROS`, `src/assistant/`, `src/commands/proactive.js` |
| Schedule/Cron | 默认关闭 | cron tools, `src/commands/schedule/` |
| Workflow scripts | 后置 | `WORKFLOW_SCRIPTS`, WorkflowTool |

### 4.4 企业、观测、实验系统

| 功能 | 建议 | 主要位置 |
| --- | --- | --- |
| GrowthBook | 个人版替换为本地 feature config 或 no-op | `src/services/analytics/growthbook.ts`, `@growthbook/growthbook` |
| Sentry | no-op 或移除 SDK 依赖 | `src/utils/sentry.ts`, `@sentry/node` |
| Langfuse | 默认关闭/删除依赖 | `src/services/langfuse/`, `@langfuse/*` |
| OpenTelemetry | 默认删除依赖 | `@opentelemetry/*` |
| Datadog/1P logging | no-op | `src/services/analytics/` |
| Remote Managed Settings | 默认关闭/stub | `src/services/remoteManagedSettings/` |
| Policy Limits | 个人版可 stub 为允许本地功能 | `src/services/policyLimits/` |
| MDM/managed env | 个人版可移除 | `src/utils/settings/mdm/`, `src/utils/managedEnv.ts` |

### 4.5 Provider 精简

当前 provider：

```ts
firstParty | bedrock | vertex | foundry | openai | gemini | grok
```

建议个人版二选一：

#### 方案 A：Anthropic + OpenAI-compatible

保留：

```text
firstParty
openai
```

移除/关闭：

```text
bedrock
vertex
foundry
gemini
grok
```

优点：兼容官方 Claude 与本地/第三方 OpenAI-compatible。缺点：仍有两套路由。

#### 方案 B：只保留 OpenAI-compatible

保留：

```text
openai
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

优点：配置最简单，适合 Ollama/vLLM/DeepSeek/自建网关。缺点：Anthropic 专有 beta、精确 token count、官方 web search 等能力可能受限。

推荐先采用 **方案 A**，稳定后再决定是否进一步压缩到方案 B。

## 5. Feature Flag 精简方案

当前 `scripts/defines.ts` 的 `DEFAULT_BUILD_FEATURES` 偏全量产品，个人版应显著缩小。

### 5.1 个人版建议默认 feature

建议初始只保留：

```ts
export const DEFAULT_BUILD_FEATURES = [
  'PROMPT_CACHE_BREAK_DETECTION',
  'TOKEN_BUDGET',
  'POOR',
] as const
```

可选加入：

```ts
'ULTRATHINK'
```

### 5.2 建议从默认 feature 移除

```text
BUDDY
TRANSCRIPT_CLASSIFIER
BRIDGE_MODE
AGENT_TRIGGERS_REMOTE
CHICAGO_MCP
VOICE_MODE
SHOT_STATS
AGENT_TRIGGERS
BUILTIN_EXPLORE_PLAN_AGENTS
LODESTONE
EXTRACT_MEMORIES
VERIFICATION_AGENT
KAIROS_BRIEF
AWAY_SUMMARY
ULTRAPLAN
DAEMON
ACP
WORKFLOW_SCRIPTS
MONITOR_TOOL
KAIROS
COORDINATOR_MODE
BG_SESSIONS
TEMPLATES
CONNECTOR_TEXT
COMMIT_ATTRIBUTION
DIRECT_CONNECT
EXPERIMENTAL_SKILL_SEARCH
EXPERIMENTAL_SEARCH_EXTRA_TOOLS
SSH_REMOTE
AUTOFIX_PR
```

注意：先移出默认 feature，不要立刻删除代码。很多模块已通过 `feature('X')` 条件 require，可利用 dead code elimination 降低构建复杂度。

## 6. 工具系统精简方案

重点文件：

```text
src/tools.ts
packages/builtin-tools/src/tools/
```

### 6.1 新增 personal-local 工具 preset

当前 `CLAUDE_CODE_SIMPLE` 只返回：

```ts
[BashTool, FileReadTool, FileEditTool]
```

对个人 coding agent 来说太少。建议新增正式 preset：

```ts
function getLocalPersonalTools(): Tools {
  return [
    BashTool,
    GlobTool,
    GrepTool,
    FileReadTool,
    FileEditTool,
    FileWriteTool,
    TodoWriteTool,
    EnterPlanModeTool,
    ExitPlanModeV2Tool,
    WebFetchTool,
    WebSearchTool,
  ]
}
```

可通过环境变量或构建 profile 控制：

```text
CLAUDE_CODE_LOCAL_PERSONAL=1
```

或新增工具 preset：

```text
--tools local-personal
```

### 6.2 个人版默认工具

| 工具 | 是否保留 | 备注 |
| --- | --- | --- |
| `BashTool` | 是 | 必须加强确认策略 |
| `FileReadTool` | 是 | 必备 |
| `FileEditTool` | 是 | 必备 |
| `FileWriteTool` | 是 | 必备 |
| `GlobTool` | 是 | 代码搜索 |
| `GrepTool` | 是 | 代码搜索 |
| `TodoWriteTool` | 是 | 任务跟踪 |
| `EnterPlanModeTool` | 是 | 规划 |
| `ExitPlanModeV2Tool` | 是 | 计划确认 |
| `WebSearchTool` | 可选 | 与 WebFetch 至少保留一个 |
| `WebFetchTool` | 可选 | 与 WebSearch 至少保留一个 |
| `NotebookEditTool` | 可选 | 不用 Jupyter 则关闭 |
| `SkillTool` | 可选 | 本地 skills 用户保留 |
| `AgentTool` | 默认关闭 | 子 agent 成本高、复杂度高 |
| `LSPTool` | 默认关闭 | env 开启即可 |
| `PowerShellTool` | Windows 可选 | 非 Windows 默认关闭 |

### 6.3 个人版默认移除工具

```text
TeamCreateTool
TeamDeleteTool
SendMessageTool
TaskCreateTool
TaskGetTool
TaskUpdateTool
TaskListTool
RemoteTriggerTool
MonitorTool
SleepTool
CronCreateTool
CronDeleteTool
CronListTool
VaultHttpFetchTool
LocalMemoryRecallTool
SearchExtraToolsTool
ExecuteTool
WorkflowTool
WebBrowserTool
BriefTool
PushNotificationTool
SendUserFileTool
SubscribePRTool
ReviewArtifactTool
SnipTool
DiscoverSkillsTool
```

### 6.4 BashTool 安全策略

建议默认策略：

| 命令类型 | 默认行为 |
| --- | --- |
| `ls`, `cat`, `head`, `tail`, `rg`, `grep`, `find`, `pwd`, `git status`, `git diff` | 自动允许 |
| `bun test`, `npm test`, `tsc`, `lint`, `biome check` | 询问一次后可记忆 |
| `git add`, `git commit`, `git checkout`, `git switch` | 必须确认 |
| `git reset`, `git clean`, `rm`, `mv`, `chmod`, `chown`, `sudo` | 强确认，高亮风险 |
| `curl`, `wget`, `ssh`, `scp`, `nc` | 默认询问 |
| `curl | sh`, `wget | sh`, `eval`, base64 decode execute | 默认拒绝或强确认 |
| `npm install`, `bun add`, `pip install` | 询问，并展示包名 |
| 后台命令 | 个人版默认关闭或强确认 |

实现切入点：

```text
packages/builtin-tools/src/tools/BashTool/BashTool.tsx
packages/builtin-tools/src/tools/BashTool/bashPermissions.ts
packages/builtin-tools/src/tools/BashTool/readOnlyValidation.ts
src/hooks/toolPermission/
src/utils/permissions/
```

## 7. Slash Commands 精简方案

重点文件：

```text
src/commands.ts
src/commands/*
```

### 7.1 个人版建议保留命令

```text
/help
/clear
/compact
/context
/cost 或 /usage
/doctor
/login 或 /provider
/logout
/model
/permissions
/plan
/poor
/resume
/status
/theme
/vim
/init
/memory
/hooks
/mcp       # 可保留但默认不自动连接
/files
/diff
/rewind   # 如依赖 file history，可保留
```

### 7.2 个人版建议隐藏或删除命令

```text
/bridge
/remote-control
/daemon
/voice
/buddy
/pipes
/peers
/send
/attach
/detach
/pipe-status
/schedule
/assistant
/proactive
/coordinator
/monitor
/workflows
/plugin
/skill-search
/skill-learning
/agents-platform
/mobile
/desktop
/chrome
/teleport
/share
/autofix-pr
/install-github-app
/install-slack-app
/stickers
/passes
/vault
/local-vault
/memory-stores
/remote-env
/remote-setup
/terminalSetup
/issue
/feedback
/release-notes
/upgrade
```

### 7.3 注意事项

`src/commands.ts` 当前有大量无条件 import。即使命令不显示，也可能增加模块评估和类型依赖。建议分两步：

1. 先在 `COMMANDS()` 列表中隐藏低价值命令。
2. 稳定后将低价值命令改为 `feature()` 条件 lazy require。

## 8. CLI 入口精简方案

重点文件：

```text
src/entrypoints/cli.tsx
src/main.tsx
```

### 8.1 保留入口

```text
--version / -v / -V
默认 REPL
-p / --print 管道模式
基本 auth/model/config 参数
```

### 8.2 个人版关闭入口

```text
--dump-system-prompt             # ant/eval 用途，可关闭
--claude-in-chrome-mcp
--chrome-native-host
--computer-use-mcp
--acp
weixin
--daemon-worker
remote-control / rc / remote / sync / bridge
daemon
autonomy                         # 如不做后台自治，可关闭
environment-runner
self-hosted-runner
```

处理建议：

- 第一阶段通过 feature flag 让这些路径不可达。
- 第二阶段删除对应 dynamic import。
- 第三阶段删除目录和依赖。

## 9. 依赖与 workspace 裁剪计划

不要在第一阶段立即删除依赖。建议在 feature/profile 稳定后再处理。

### 9.1 可后续移出 workspace 的包

```text
packages/remote-control-server
packages/acp-link
packages/@ant/claude-for-chrome-mcp
packages/@ant/computer-use-mcp
packages/@ant/computer-use-input
packages/@ant/computer-use-swift
packages/weixin
packages/audio-capture-napi
packages/modifiers-napi
packages/url-handler-napi
```

视是否保留图片处理决定：

```text
packages/image-processor-napi
packages/color-diff-napi
```

### 9.2 可后续移除的依赖族

```text
@growthbook/growthbook
@langfuse/*
@opentelemetry/*
@sentry/node
@aws-sdk/*
@anthropic-ai/bedrock-sdk
@anthropic-ai/vertex-sdk
@anthropic-ai/foundry-sdk
google-auth-library
@claude-code-best/mcp-chrome-bridge
doubaoime-asr
qrcode
ws
sharp                 # 如果不保留图片/截图/文档图像处理
```

### 9.3 可能继续需要的依赖

```text
@anthropic-ai/sdk      # 若保留 firstParty
openai                 # 若保留 OpenAI-compatible
@commander-js/extra-typings
react
@anthropic/ink
zod
lodash-es
chalk
execa / shell utilities
ignore / picomatch
```

## 10. 分阶段实施计划

## Phase 0：建立基线

目标：确认当前仓库状态，避免精简过程中无法判断回归。

执行：

```bash
bun install
bun run typecheck
bun run build
bun test
```

记录：

- 当前 typecheck 是否通过。
- 当前 build 是否通过。
- 当前测试失败清单。
- 当前 `bun run dev -- --version` 输出。
- 当前 REPL 是否能启动。

产出：

```text
baseline-check.md 或 issue 记录
```

## Phase 1：新增 personal-local profile

目标：不删除代码，只新增个人版开关。

建议修改：

```text
scripts/defines.ts
src/tools.ts
src/commands.ts
```

任务：

1. 将 `DEFAULT_BUILD_FEATURES` 收缩为个人版最小集合。
2. 新增 `CLAUDE_CODE_LOCAL_PERSONAL` 或 `PERSONAL_LOCAL` profile。
3. 新增 `getLocalPersonalTools()`。
4. 在 `getTools()` 中优先识别个人版 profile。
5. 在命令列表中过滤远程/后台/协作/语音/浏览器/企业命令。

验证：

```bash
bun run typecheck
bun run build
bun run dev -- --version
bun run dev
```

手测：

- REPL 启动。
- 提问普通问题。
- Read/Edit/Write 正常。
- Bash read-only 命令正常。
- 危险 Bash 弹确认。

## Phase 2：CLI fast path 收缩

目标：减少入口复杂度。

建议修改：

```text
src/entrypoints/cli.tsx
src/main.tsx
```

任务：

1. 关闭 chrome/computer-use/acp/weixin/daemon/remote-control fast path。
2. 对保留入口添加更清晰注释。
3. 删除个人版不可达路径的初始化逻辑。

验证：

```bash
bun run typecheck
bun run build
bun test src/cli src/entrypoints  # 如有对应测试
```

手测：

```bash
bun run dev -- --version
echo "say hello" | bun run src/entrypoints/cli.tsx -p
bun run dev
```

## Phase 3：命令懒加载与命令裁剪

目标：让隐藏命令不再产生 import 成本。

建议修改：

```text
src/commands.ts
src/commands/*
```

任务：

1. 将低价值命令改为 `feature()` 条件 require。
2. 删除个人版 profile 下的命令注册。
3. 确保 `/help` 中不展示被关闭命令。
4. 保证 remote-safe command 过滤逻辑不影响本地版。

验证：

```bash
bun run typecheck
bun run build
bun test src/commands
```

## Phase 4：Provider 精简

目标：减少模型路由复杂度。

建议修改：

```text
src/utils/model/providers.ts
src/services/api/*
src/services/tokenEstimation.ts
src/utils/auth.ts
src/commands/provider/
src/commands/model/
```

任务：

1. 选择 provider 策略：Anthropic + OpenAI-compatible，或仅 OpenAI-compatible。
2. 简化 `getAPIProvider()`。
3. 删除 Bedrock/Vertex/Foundry/Gemini/Grok 的运行时入口。
4. 调整 token count fallback。
5. 调整 `/login`, `/model`, `/provider` 文案。

验证：

```bash
bun run typecheck
bun run build
```

手测：

- Anthropic API key/OAuth 路径。
- OpenAI-compatible 环境变量路径。
- 模型切换。
- token budget/compact 行为。

## Phase 5：观测与企业能力 no-op 化

目标：先 no-op，后删依赖。

建议修改：

```text
src/services/analytics/
src/services/langfuse/
src/utils/sentry.ts
src/services/remoteManagedSettings/
src/services/policyLimits/
src/utils/settings/mdm/
```

任务：

1. GrowthBook 改为本地 feature map 或固定 false。
2. Sentry 保留 `SentryErrorBoundary` UI 容错，但移除 SDK 上报。
3. Langfuse/Otel 全部 no-op。
4. policy limits 对本地功能返回允许。
5. remote managed settings 不再网络请求。

验证：

```bash
bun run typecheck
bun run build
bun test src/services/analytics src/services/langfuse
```

## Phase 6：物理删除功能目录

目标：删除已不可达代码。

前置条件：

- Phase 1-5 已稳定。
- `rg` 确认无 import。
- `bun run typecheck` 已通过。

可删除目录：

```text
src/bridge/
src/daemon/
src/services/acp/
src/buddy/
src/assistant/
src/coordinator/
src/utils/computerUse/
src/utils/claudeInChrome/
packages/remote-control-server/
packages/acp-link/
packages/@ant/claude-for-chrome-mcp/
packages/@ant/computer-use-mcp/
packages/@ant/computer-use-input/
packages/@ant/computer-use-swift/
packages/weixin/
```

每删除一组都执行：

```bash
bun run typecheck
bun run build
```

不要一次性删除所有目录。

## Phase 7：依赖清理

目标：清理 package.json 与 lockfile。

任务：

1. 从 `workspaces` 中删除已移除包。
2. 从 dependencies/devDependencies/optionalDependencies 删除不可达依赖。
3. 运行安装更新 lockfile。
4. 运行 build/test/typecheck。

命令：

```bash
bun install
bun run typecheck
bun run build
bun test
bun run check:unused
```

## Phase 8：文档与测试收口

目标：个人版本可维护。

新增/更新：

```text
README.md
AGENTS.md
PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md
docs/personal-local.md
```

补充测试：

- 工具列表 snapshot 测试。
- 命令列表 snapshot 测试。
- Bash permission 策略测试。
- provider 选择测试。
- `CLAUDE_CODE_LOCAL_PERSONAL=1` smoke test。

## 11. 建议保留的 smoke test 清单

每次大阶段后手动验证：

```bash
bun run dev -- --version
bun run dev
```

REPL 内验证：

```text
/help
/status
/model
/permissions
/plan
/poor
/compact
```

任务验证：

1. 让 agent 读取 `package.json`。
2. 让 agent 搜索某个符号。
3. 让 agent 修改一个临时文件。
4. 让 agent 新建一个临时文件。
5. 让 agent 执行 `bun run typecheck`。
6. 让 agent 尝试执行 `rm -rf tmp-test`，确认弹出强确认。
7. 让 agent 进行一次 `/resume`。
8. 长对话后触发 `/compact`。

## 12. 风险与应对

| 风险 | 说明 | 应对 |
| --- | --- | --- |
| TypeScript strict 连锁错误 | 删除模块后 import/type 引用残留 | 分阶段删除，每步 typecheck |
| feature() 使用限制 | `feature()` 只能直接用于 if/三元条件等受限位置 | 遵守现有模式，不赋值、不放复杂表达式 |
| 无条件 import 副作用 | 即使命令隐藏也可能加载模块 | 先隐藏，后 lazy require |
| Provider 精简影响 token count | OpenAI-compatible 无精确 token count | 保留近似估算 fallback，并调低风险阈值 |
| Bash 安全回归 | Bash 是最大本地风险 | 强化 read-only 分类和危险命令确认 |
| 删除观测导致错误不可见 | Sentry/Langfuse 删除后排错变弱 | 保留本地 debug log 和 error log sink |
| MCP/Plugin 动态扩展风险 | 个人版若保留插件会引入不确定代码 | 默认关闭，显式开启 |
| REPL UI 引用远程状态 | AppState 可能包含 bridge/inbox 字段 | 先 no-op/隐藏 UI，再删除字段 |

## 13. 推荐最终目录状态

长期目标下，个人版核心目录大致应保留：

```text
src/entrypoints/
src/screens/
src/components/             # 可进一步精简 UI 组件
src/query.ts
src/QueryEngine.ts
src/Tool.ts
src/tools.ts
src/services/api/
src/services/compact/
src/services/tokenEstimation.ts
src/context.ts
src/utils/{bash,git,model,permissions,settings,shell,todo,...}
packages/builtin-tools/
packages/@ant/ink/
packages/@ant/model-provider/  # 如仍需要抽象
packages/mcp-client/           # 如保留 MCP
```

可删除或移出主发行版：

```text
src/bridge/
src/daemon/
src/assistant/
src/coordinator/
src/buddy/
src/services/acp/
src/services/langfuse/
src/services/teamMemorySync/
src/services/skillLearning/
src/services/skillSearch/      # 若不保留搜索
src/utils/computerUse/
src/utils/claudeInChrome/
packages/remote-control-server/
packages/acp-link/
packages/weixin/
packages/@ant/computer-use-*/
packages/@ant/claude-for-chrome-mcp/
```

## 14. 最小可交付版本定义

当以下条件满足时，可认为个人本地版 MVP 完成：

- `bun run typecheck` 通过。
- `bun run build` 通过。
- REPL 可以正常启动。
- `-p` 管道模式可用。
- 工具列表只包含 local coding 核心工具。
- `/help` 不展示远程/协作/语音/浏览器/企业命令。
- Bash 危险命令会确认。
- Read/Edit/Write/Glob/Grep/Bash/Todo/Plan 可用。
- 至少一个模型 provider 可用。
- 会话 transcript 和 `/resume` 可用。
- `/compact`、token budget、Poor Mode 可用。
- package 依赖不再包含明显无关的远程控制、语音、computer-use、企业观测依赖。

## 15. 总结

个人本地 coding agent 的核心价值不是功能数量，而是：

```text
稳定的 REPL
可靠的 agent loop
安全的本地工具执行
可控的成本与上下文
简单透明的模型配置
```

因此，精简策略应优先保留主循环和本地工具，果断关闭远程、多机、后台、桌面/语音、外部 channel、企业观测与实验系统。

推荐执行方式是：

```text
feature/profile 收缩
  → 工具/命令列表收缩
  → CLI 入口收缩
  → provider 收缩
  → 企业观测 no-op
  → 物理删除目录
  → 清理依赖
  → 补测试和文档
```

不要一开始大规模删除文件。当前仓库模块复杂且 TypeScript strict，最稳妥的路径是每阶段保持可构建、可运行、可回滚。
