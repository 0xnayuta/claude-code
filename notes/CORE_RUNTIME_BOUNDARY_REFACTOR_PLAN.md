# Core Runtime 边界切割式重构迁移计划

> 目标：从“在旧架构中删除功能”的减法 cleanup，切换为“建立 Core Runtime 白名单主路径，再绞杀 legacy 架构”的边界切割式重构。
>
> 依据：`notes/PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md`、`notes/INACTIVE_NOOP_CLEANUP_PLAN.md`、`notes/subsequent-cleanup.md`、`notes/FEATURE_STATUS_REPORT.md`。
>
> 当前状态：Core-7（legacy 绞杀）已完成；Core-8/9 已完成并进入 Core-10（测试与文档定型）。详见 `notes/CORE_8_PLUS_MIGRATION_PLAN.md` 与 `notes/subsequent-cleanup.md`。

---

## 1. 计划定位

### 1.1 为什么新增本文档，而不是直接重写 `INACTIVE_NOOP_CLEANUP_PLAN.md`

采用 **新增文档**，暂不直接重写 `notes/INACTIVE_NOOP_CLEANUP_PLAN.md`。

原因：

1. `INACTIVE_NOOP_CLEANUP_PLAN.md` 已经承担历史 cleanup 清单、Phase 0 引用基线、Phase 1A/1B 执行记录索引等作用，直接重写会丢失审计上下文。
2. 新策略不是原计划的简单后续阶段，而是执行方法论变化：从“按功能域删除旧代码”转为“先建立 Core Runtime 主路径，再删除 legacy”。
3. 后续 Phase 2/3/4/5 不应继续按“先删 Teleport / Plugin / Workspace API”的方式推进，而应先证明 Core Runtime 不依赖这些 legacy 域。
4. 新文档可以作为新的顶层迁移计划；旧文档作为历史参考和已完成 cleanup 记录保留。

### 1.2 两份文档的职责

| 文档 | 职责 |
|------|------|
| `PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` | 产品目标与 personal-local 功能边界 |
| `FEATURE_STATUS_REPORT.md` | 代码状态、功能旗标和代码量统计 |
| `INACTIVE_NOOP_CLEANUP_PLAN.md` | 旧的功能域删除计划与已完成 Phase 记录 |
| `subsequent-cleanup.md` | 实际执行记录、引用基线、风险发现 |
| `CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` | 新的 Core Runtime 迁移战略与实施阶段 |

后续建议：

- 保留 `INACTIVE_NOOP_CLEANUP_PLAN.md`，在顶部增加指向本文档的说明即可；
- 新增执行项、验收标准、边界规则统一写入本文档；
- 每次实际删除/迁移仍记录到 `subsequent-cleanup.md`。

---

## 2. 核心原则

### 2.1 从减法过滤改为加法白名单

旧架构常见模式：

```ts
allCommands - personalLocalFilteredCommands
allTools - disabledFeatureTools
feature('X') ? require('legacy') : null
```

Core Runtime 目标模式：

```ts
coreCommands = explicit whitelist
coreTools = explicit whitelist
coreServices = explicit imports
legacy cannot enter core unless explicitly adapted
```

### 2.2 Core 不能为了兼容 legacy 而保留 legacy 架构

允许短期保留 facade，但 facade 必须分类：

| 类型 | 可否长期存在 | 示例 |
|------|--------------|------|
| stable-noop-facade | 可以 | analytics / telemetry / langfuse 最小导出 |
| compat-type-only | 可以 | `pluginIdentifier` / `PluginScope` 类型兼容 |
| temporary-facade | 不可长期 | remoteManagedSettings / autoUpdater / PromptSuggestion |
| legacy-runtime | 不可进入 Core | plugins / teleport / swarm / skillLearning / skillSearch |

### 2.3 Core 与 legacy 单向依赖

依赖方向：

```text
legacy -> core 允许
core -> legacy 禁止
```

Core 目录内禁止 import legacy 功能域。迁移期可以由 legacy wrapper 调用 core，但不能让 core 回头依赖 legacy。

### 2.4 先逻辑边界，后物理搬迁

第一阶段不追求大量移动文件，优先建立：

- core command 白名单；
- core tool 白名单；
- core runtime profile；
- import boundary 检查；
- personal-local 主路径切换。

物理移动文件应在边界稳定后分批进行。

---

## 3. Core Runtime 最终边界

### 3.1 Core 必须保留

| 功能域 | 保留内容 |
|--------|----------|
| CLI / REPL / print mode | 本地交互、非交互输入、transcript 输出 |
| Query loop | streaming、tool loop、abort、compaction、error recovery |
| QueryEngine | 会话状态、文件历史、turn bookkeeping |
| Providers | firstParty + OpenAI-compatible |
| Auth | API key、Claude OAuth、token refresh、basic profile |
| Tools | FileRead/FileEdit/FileWrite/Glob/Grep/Bash/PowerShell/Todo/Plan/WebFetch/WebSearch/SkillTool/AgentTool/MCP/LSP 可选 |
| Permissions | tool permission、rule matching、plan/bypass/default mode |
| MCP | 手动 MCP server config、MCP tools/resources/prompts |
| Memory | CLAUDE.md、local SessionMemory、compact memory、本地 multiStore |
| LSP | core LSP manager、diagnostics、definition/reference/hover |
| Settings | 本地 settings / config / theme / model / provider |
| Diagnostics | doctor 的本地环境检查 |

### 3.2 Core 禁止包含

| 功能域 | 禁止内容 |
|--------|----------|
| Plugins / Marketplace | plugin runtime、marketplace install/update、plugin MCP/LSP/agents/hooks/commands |
| Teleport / Workspace cloud | teleport、remote env、vault cloud、agents-platform、schedule cloud、workspace APIs |
| Team / Swarm / teammate | team files、mailbox、permission sync、Team tools、UDS inbox |
| Skill Learning/Search | `skillLearning`、`skillSearch`、DiscoverSkillsTool、remote canonical skills |
| Enterprise observability runtime | GrowthBook runtime、Sentry、Datadog、Langfuse tracing implementation |
| Auto update installer | autoUpdater、nativeInstaller、install GitHub/Slack app |
| External automation | Voice、Computer Use、Chrome Use、web/desktop/mobile cloud affordances |
| Autonomy / remote review | autonomy queue、autofix-pr、remote review、ultrareview cloud |

---

## 4. 建议目录结构

第一阶段新增 `src/core/`，不立即 package 化：

```text
src/core/
  runtime/
    createCoreRuntime.ts
    CoreRuntime.ts
    types.ts
  commands/
    coreCommands.ts
    coreCommandNames.ts
  tools/
    coreTools.ts
    coreToolNames.ts
  providers/
    coreProviders.ts
  auth/
    coreAuth.ts
  mcp/
    coreMcp.ts
  memory/
    coreMemory.ts
  lsp/
    coreLsp.ts
  boundaries/
    legacyImports.ts
```

暂不建议一开始拆成 workspace package。原因：当前路径 alias、Bun build、测试 mocks、`.js` 后缀 dynamic imports 已经复杂，先在 `src/core/` 建逻辑边界更稳。

---

## 5. Core 白名单草案

### 5.1 Core commands 白名单

初始 Core commands 直接复用现有命令实现，但通过新白名单导出，不再从旧 `COMMANDS()` 大列表中过滤。

建议初始包含：

```text
add-dir
break-cache
clear
color
compact
config
context
copy
diff
doctor
env
exit
export
files
help
hooks
init
keybindings
lang
login
logout
mcp
memory
model
output-style
permissions
plan
poor
provider
resume
rewind
status
statusline
tag
theme
usage
version
vim
```

需要复核是否加入：

```text
local-memory
summary
agents
skills
commit
```

当前 personal-local 白名单中未包含 `local-memory` / `summary`，但设计边界里 SessionMemory 与 local memory 是保留项。后续应单独决策：

- 若保留本地 SessionMemory 操作命令，则迁入 Core；
- 若只保留内部 SessionMemory，不暴露命令，则继续不进入 Core commands。

### 5.2 Core tools 白名单

建议初始包含：

```text
BashTool
PowerShellTool              # Windows / env enabled
FileReadTool
FileEditTool
FileWriteTool
GlobTool
GrepTool
TodoWriteTool
EnterPlanModeTool
ExitPlanModeV2Tool
WebFetchTool
WebSearchTool
SkillTool                   # local skills only
AgentTool                   # local subagent only，后续移除 remote/team/plugin 分支
TaskStopTool                # AgentTool/subagent 需要时保留
ListMcpResourcesTool
ReadMcpResourceTool
LSPTool                     # env 显式启用
LocalMemoryRecallTool       # 若 local memory 保留
SearchExtraToolsTool        # Phase 1C 暂缓，作为 optional core-adjacent
ExecuteTool                 # 若 SearchExtraToolsTool 保留则保留
```

不进入 Core：

```text
TeamCreateTool
TeamDeleteTool
SendMessageTool
RemoteTriggerTool
MonitorTool
WorkflowTool
DiscoverSkillsTool
VaultHttpFetchTool          # 需判断是否属于云端 vault；默认不进 Core
Cron tools
PushNotificationTool
SubscribePRTool
ReviewArtifactTool
WebBrowserTool
TerminalCaptureTool
```

---

## 6. Core import 边界规则

### 6.1 Core 禁止 import 的路径

`src/core/**` 禁止 import 以下路径片段：

```text
src/utils/plugins
src/services/plugins
src/commands/plugin
src/plugins
src/utils/teleport
src/commands/teleport
src/commands/schedule
src/commands/vault
src/commands/skill-store
src/commands/memory-stores
src/commands/agents-platform
src/commands/remote-setup
src/commands/remote-env
src/commands/share
src/commands/install-github-app
src/commands/install-slack-app
src/services/teamMemorySync
src/utils/swarm
src/hooks/useInboxPoller
src/hooks/useSwarm
src/services/skillLearning
src/services/skillSearch
src/commands/skill-learning
src/commands/skill-search
src/utils/nativeInstaller
src/utils/autoUpdater
src/commands/autofix-pr
src/commands/review
src/commands/autonomy
src/hooks/useVoiceIntegration
src/commands/voice
```

### 6.2 建议新增脚本

新增：

```text
scripts/check-core-boundaries.ts
```

package script：

```json
"check:boundaries": "bun run scripts/check-core-boundaries.ts"
```

脚本逻辑：

1. 遍历 `src/core/**/*.{ts,tsx}`；
2. 解析 `import ... from`、`require()`、`import()`；
3. 若匹配禁止路径，报错；
4. 允许 type-only import 仅限明确列入 allowlist 的兼容类型。

后续 `test:all` 应加入：

```bash
bun run check:boundaries
```

---

## 7. 迁移阶段

### Core-0：建立边界文档与验收规则

目标：完成本文档，明确从 cleanup 切换到 Core Runtime 重构。

产出：

- `notes/CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md`
- `INACTIVE_NOOP_CLEANUP_PLAN.md` 顶部增加指向本文档的说明
- `subsequent-cleanup.md` 继续作为执行日志

验收：

```bash
bun run typecheck
```

### Core-1：建立 Core commands 白名单

目标：让 personal-local command list 从 Core 白名单生成，而不是旧 `COMMANDS()` 大列表过滤。

步骤：

1. 新增 `src/core/commands/coreCommandNames.ts`；
2. 新增 `src/core/commands/coreCommands.ts`；
3. 将 `PERSONAL_LOCAL_COMMAND_NAMES` 改为复用 core command names；
4. 逐步让 `builtInCommandNames()` / `getCommands()` 在 personal-local profile 下走 `getCoreCommands()`；
5. 更新 command snapshot 测试。

注意：第一步可先复用现有命令文件，不做物理移动。

验收：

```bash
bun run typecheck
bun test tests/integration/command-list-snapshot.test.ts
bun run build
```

### Core-2：建立 Core tools 白名单

目标：让 personal-local tools 从 Core 白名单生成，而不是旧 `getAllBaseTools()` 减法过滤。

步骤：

1. 新增 `src/core/tools/coreTools.ts`；
2. 新增 `src/core/tools/coreToolNames.ts`；
3. 将现有 `getLocalPersonalTools()` 改为调用 `getCoreTools()`；
4. 逐步让 `getTools()` 的 personal-local 分支只走 Core tools；
5. 更新 tool snapshot 测试。

验收：

```bash
bun run typecheck
bun test tests/integration/command-list-snapshot.test.ts
bun run build
```

### Core-3：建立边界检查脚本

目标：防止新 Core 目录反向 import legacy。

步骤：

1. 新增 `scripts/check-core-boundaries.ts`；
2. 添加 `check:boundaries` script；
3. 为当前 `src/core/` 运行边界检查；
4. 在文档中记录 allowlist。

验收：

```bash
bun run check:boundaries
bun run typecheck
```

### Core-4：建立 Core Runtime profile

目标：建立一个明确的 runtime profile，使 personal-local 主路径可以显式走 Core Runtime。

步骤：

1. 新增 `src/core/runtime/types.ts`；
2. 新增 `createCoreRuntime()`，聚合 commands/tools/providers/config；
3. 将 `isPersonalLocalProfileEnabled()` 的关键调用点逐步替换为 Core runtime object；
4. 避免 Core 内部读取大型 feature flag 矩阵。

目标形态：

```ts
const runtime = createCoreRuntime({ profile: 'core-local' })
runtime.commands
runtime.tools
runtime.providers
```

验收：

```bash
bun run typecheck
bun run build
bun test
```

### Core-5：切换 personal-local REPL/query 主路径

目标：REPL 和 query 不再从 legacy command/tool registry 获取 personal-local 能力。

步骤：

1. REPL 初始化读取 Core Runtime tools/commands；
2. QueryEngine / query 使用 Core tools pool；
3. MCP tools 通过 core MCP adapter 合并；
4. local skills 通过 Core Skill adapter 加载；
5. 删除 REPL 中已删除功能的 shim / no-op 过渡层。

验收：

```bash
bun run typecheck
bun run build
bun test
```

### Core-6：迁移 Core services

目标：将核心服务分层收敛，legacy service 不能被 Core 直接 import。

优先级：

1. `core/auth`：API key / OAuth basic；
2. `core/providers`：firstParty / openai；
3. `core/mcp`：manual MCP config；
4. `core/memory`：CLAUDE.md / SessionMemory / multiStore；
5. `core/lsp`：LSP core config；
6. `core/permissions`：permission rule facade。

验收：

```bash
bun run check:boundaries
bun run typecheck
bun run build
bun test
```

### Core-7：legacy 绞杀删除

目标：在 Core 主路径稳定后，再删除 legacy 功能域。

删除顺序改为：

1. 确认 Core 不依赖该 legacy 域；
2. 移除 legacy 入口；
3. 删除 legacy directory；
4. 删除 facade 或降级为 compat-type-only；
5. 更新 tests/docs。

建议顺序：

```text
Teleport / cloud commands
Plugins / Marketplace
OAuth workspace API branches
teamMemorySync / remote memory
plugin LSP integration
autoUpdater / nativeInstaller
Swarm / Team / teammate
analytics/telemetry/langfuse implementation compression
```

---

## 8. Phase 2 之后计划如何改写

旧计划：

```text
Phase 2：删除 Teleport / Remote cloud commands
Phase 3：删除 Marketplace / Plugin integrations
Phase 4：OAuth workspace 分支
...
```

新计划：

```text
Core-1/2/3/4/5：先建立 Core Runtime 主路径
Legacy-1：删除 Core 不依赖的 Teleport/cloud commands
Legacy-2：删除 Core 不依赖的 Plugin/Marketplace
Legacy-3：删除 workspace API branches
Legacy-4：删除 team/remote memory
Legacy-5：删除 autoUpdater/nativeInstaller
```

即：后续删除不再以“功能目录是否可删”为前置，而以“Core 是否不依赖它”为前置。

---

## 9. 风险与应对

### 9.1 风险：Core 只是换目录名

应对：必须有 import boundary check；Core registry 必须是白名单；Core 不得直接 import legacy。

### 9.2 风险：一次移动太多文件导致大面积路径破坏

应对：先逻辑白名单，后物理移动；每个阶段小批量验证。

### 9.3 风险：AgentTool / SkillTool 被误伤

应对：AgentTool 本地 subagent 保留；SkillTool local skills 保留；只删除 remote/plugin/discovery 分支。每次改动运行相关测试。

### 9.4 风险：MCP 手动配置被 plugin MCP 删除误伤

应对：Core MCP adapter 只依赖 manual config；plugin MCP merge 单独归 legacy。

### 9.5 风险：OAuth 基础登录被 workspace API 删除误伤

应对：Core auth 先迁入 API key / OAuth token refresh，再删 workspace API。

### 9.6 风险：facade 永久化

应对：每个 facade 标记类型：stable-noop / compat-type-only / temporary。temporary facade 必须有删除阶段。

---

## 10. 每阶段强制验证

最低验证：

```bash
bun run typecheck
bun run build
bun test
bun run lint
```

若环境修复后恢复：

```bash
bun run check:unused
bun run check:boundaries
```

当前已知问题：

- `bun run check:unused` 在当前 shell 中因 `knip-bun` 子进程提示 `bun is not installed in %PATH%` 失败；这属于环境/PATH 问题，需单独修复后纳入强制门禁。

---

## 11. 下一步建议

不要立即继续 Phase 2 删除 Teleport。建议下一步执行：

```text
Core-1：建立 Core commands 白名单
Core-2：建立 Core tools 白名单
Core-3：新增边界检查脚本
```

完成这三步后，再开始 Teleport / Plugin 等 legacy 删除会更安全，因为 Core 主路径已经不再依赖旧的大 registry 与旧 feature-gated 架构。
