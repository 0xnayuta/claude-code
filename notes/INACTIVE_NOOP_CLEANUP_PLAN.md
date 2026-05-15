# 后续清理计划：Personal-local 功能边界收敛

> 基于 `notes/FEATURE_STATUS_REPORT.md` 统计结果
> 对应 `PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` 中的后续阶段工作
>
> **策略更新**：Phase 1A/1B 后，后续 cleanup 不再优先按旧架构功能域直接删除，而是切换为 Core Runtime 边界切割式重构。新的顶层迁移计划见 `notes/CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md`；本文档保留作为历史 cleanup 计划和已完成阶段记录。
>
> 前置条件：`bun run typecheck` ✅ / `bun run build` ✅ / `bun test` ✅（4565 pass）
>
> **核心原则**：本轮目标不是最大化物理删除行数，而是把代码库收敛到明确的 personal-local 功能边界：本地 CLI、OAuth/API key、Claude/OpenAI provider、文件/命令工具、MCP 手动配置、权限系统、SessionMemory、LSP、AgentTool。所有 marketplace、teleport、远程 workspace、企业观测、协作/团队、自动更新安装器功能删除或 no-op facade 化。

---

## 1. 背景与目标

### 1.1 前期完成状态

前期已完成以下清理：

- ✅ 物理删除 `src/bridge/`、`src/daemon/`、`src/services/acp/`、`src/buddy/`、`src/assistant/`、`src/coordinator/`、`src/utils/computerUse/`、`src/utils/claudeInChrome/`
- ✅ 删除 `packages/acp-link/`、`packages/remote-control-server/`
- ✅ Provider 精简为 `firstParty` + `openai`
- ✅ 企业观测（Sentry / Langfuse / OpenTelemetry）全部 no-op 化
- ✅ 远程托管设置、MDM、extractMemories、PromptSuggestion 全部 early return / no-op
- ✅ 删除 `lint-staged` 依赖
- ✅ 新增 Phase 8 snapshot 测试（工具列表 / 命令列表）
- ✅ 新增 `docs/personal-local.md` 文档

### 1.2 当前遗留问题

根据 `notes/FEATURE_STATUS_REPORT.md` 统计，`src/` 仍有 **436,562 行**非测试代码，分布如下：

| 状态 | 行数 | 占比 |
|------|------|------|
| **ALWAYS-ON**（核心功能） | ~196,471 | 45% |
| **INACTIVE**（feature-gated，代码残留） | ~63,596 | 15% |
| **NO-OP**（返回 stub） | ~13,938 | 3% |
| **已物理删除**（Phase 1 完成） | ~76,000+ | ~17% |
| 统计误差 / 分散模块 | ~86,000 | ~20% |

核心问题：约 **77,534 行**（INACTIVE + NO-OP）代码物理存在但不执行完整功能。但其中不少模块仍承担“兼容导出层”职责，不能简单按目录物理删除。

### 1.3 后续目标

1. 明确 personal-local 最终功能边界；
2. 删除与该边界冲突的云端、企业、协作、插件市场和自动更新功能；
3. 对被广泛引用的 no-op 服务改为最小 facade；
4. 每个阶段保证 `bun run typecheck` 零错误；
5. 在 `notes/subsequent-cleanup.md` 记录实际删除内容、保留 facade 和暂缓项。

---

## 2. 最终功能边界决策

| 功能域 | 决策 | 说明 |
|--------|------|------|
| Core CLI / REPL / print mode | 保留 | personal-local 核心入口 |
| Claude first-party provider | 保留 | 默认 provider |
| OpenAI compatible provider | 保留 | 已恢复并作为重要能力 |
| OAuth / API key 登录 | 保留 | 保留 login/logout/token/profile；删除 workspace/organization 云端分支 |
| 文件工具 / Bash / PowerShell | 保留 | 核心工具能力 |
| 权限系统 | 保留 | 核心安全边界 |
| MCP | 保留 | 仅保留手动配置 MCP server |
| Marketplace / Plugins | 删除 | 不保留 plugin-provided MCP/LSP/agents/hooks/commands |
| AgentTool / subagent | 暂时完全保留 | 本轮不拆 AgentTool，不删除 `packages/builtin-tools/src/tools/AgentTool/` |
| LSP | 暂时完全保留 | 保留 LSP core；删除 plugin-provided LSP integration |
| SessionMemory | 保留 | 保留本地 SessionMemory；删除 team memory sync、remote memory stores、云端 memory API |
| Teleport / Remote cloud commands | 删除 | 删除 teleport/schedule/vault/agents-platform 等云端命令 |
| Auto updater / native installer | 删除 | 删除自动更新安装器；保留 doctor 基础检查 |
| Analytics / telemetry / Langfuse / Sentry | facade 化 | 保留最小导出，内部 no-op |
| Swarm / Team / teammate / UDS inbox | 目标删除，本轮暂缓 | Phase 0 发现被 REPL、hooks、Team 工具、AgentTool 广泛引用；需等 AgentTool 本地-only 边界明确后单独处理 |
| Voice / Chrome / Computer Use | 删除 | 非核心自动化能力 |
| PromptSuggestion / ExtractMemories | 删除或 facade 化 | 当前 early return；先保留最小 facade，后续移除调用点 |
| Skill Learning / Skill Search | 删除 | 实验性能力，不属于核心边界 |
| Autonomy / Autofix / Review remote | 目标删除，分阶段处理 | Autofix/Review remote 属于云端能力；Autonomy Phase 0 发现引用较多，本轮暂缓并另行设计 |

---

## 3. 当前代码状态与风险重估

### 3.1 可优先删除的 INACTIVE 功能

| 目录/模块 | 行数 | 风险 | 说明 |
|-----------|------|------|------|
| `src/commands/voice/` | 205 | 低 | feature-gated，非核心 |
| `src/hooks/useVoiceIntegration.tsx` | 679 | 低 | voice 相关 hook |
| `src/components/LogoV2/VoiceModeNotice.tsx` | 51 | 低 | voice UI |
| `src/commands/monitor.ts` | 108 | 低 | feature-gated，非核心 |
| `src/commands/workflows/` | 28 | 低 | feature-gated，非核心 |
| `src/commands/skill-learning/` | 676 | 中低 | 需断 `commands.ts` 和测试引用 |
| `src/services/skillLearning/` | 7,161 | 中低 | 实验性能力 |
| `src/commands/skill-search/` | 185 | 中低 | 需断 `commands.ts` 和工具引用 |
| `src/services/skillSearch/` | 1,629 | 中 | `DiscoverSkillsTool` 可能引用 |
| `src/services/searchExtraTools/` | 877 | 暂缓 | Phase 0 确认 `SearchExtraToolsTool` 是独立工具，暂不随 skill-search 删除 |
| `src/commands/autonomy.ts` + autonomy utils | 2,856 | 暂缓 | Phase 0 发现 `main.tsx` CLI 子命令、`query.ts`、`proactive/useProactive.ts` 等多处引用 |

### 3.2 高风险结构性删除项

| 功能域 | 主要路径 | 风险 | 原因 |
|--------|----------|------|------|
| Plugins / Marketplace | `src/utils/plugins/`, `src/services/plugins/`, `src/commands/plugin/` | 高 | MCP/LSP/REPL/main/cli/工具包广泛引用 |
| Teleport / Cloud commands | `src/utils/teleport*`, 多个 cloud 命令 | 高 | OAuth workspace、review/autofix、print mode 仍引用 |
| OAuth workspace 分支 | `prepareWorkspaceApiRequest`, `getOrganizationUUID` 等 | 中高 | OAuth 本体保留，但 workspace API 要拆 |
| AutoUpdater / nativeInstaller | `src/utils/autoUpdater.ts`, `src/utils/nativeInstaller/` | 中 | REPL/PromptInput/Doctor/install 命令引用 |
| SessionMemory remote/team 分支 | `teamMemorySync`, `memory-stores` | 中 | 本地 SessionMemory 和 `multiStore` 保留；删除远程/团队分支 |
| Swarm / Team / teammate | `src/utils/swarm/`, swarm hooks/UI, Team tools | 高 | Phase 0 发现 60+ 文件引用；本轮暂缓，需与 AgentTool 边界协同 |
| LSP plugin integration | `lspPluginIntegration`, `services/lsp/config.ts` plugin merge | 中 | LSP core 保留，但 plugin-provided LSP 删除 |

### 3.3 需 facade 化而非直接删除的 no-op 服务

| 模块 | 风险 | 处理方式 |
|------|------|----------|
| `src/services/analytics/` | 高 | 保留最小导出，内部 no-op |
| `src/utils/telemetry/` | 高 | 保留最小导出，内部 no-op |
| `src/services/langfuse/` | 中高 | 保留最小导出，内部 no-op |
| `src/utils/sentry.ts` | 低 | 可保留 no-op facade 或删除引用后删除 |
| `src/services/remoteManagedSettings/` | 中 | 先保留最小 facade，后续移除 login/logout/settings/print 调用点 |
| `src/services/extractMemories/` | 中 | 先保留最小 facade，后续移除 backgroundHousekeeping/print 调用点 |
| `src/services/PromptSuggestion/` | 中 | 先保留最小 facade，后续移除 REPL/print 调用点 |

---

## 4. 清理原则

### 4.1 先按功能域删除，不按目录盲删

删除顺序应由最终功能边界决定。对高耦合模块，先断功能入口和调用点，再考虑物理删除目录。

### 4.2 每个候选项先建立引用基线

不要只使用：

```bash
rg "from.*<目录>|require.*<目录>" src/ --type ts
```

该命令会漏掉动态导入、`src/*` alias、`.js` 后缀、package 层引用、测试 mock、`require.resolve()` 等。

建议组合使用：

```bash
rg "<moduleName>|<path-fragment>" src packages -g '*.ts' -g '*.tsx'
bun run typecheck
bun run check:unused
```

### 4.3 广泛引用的 no-op 模块先 facade 化

`analytics`、`telemetry`、`langfuse`、`remoteManagedSettings`、`extractMemories`、`PromptSuggestion` 不直接整目录删除。先保留兼容导出，压缩内部实现。

### 4.4 AgentTool 本轮不作为删除目标

本轮不删除、不拆分 `packages/builtin-tools/src/tools/AgentTool/`。允许删除的仅限 AgentTool 的可选集成点，例如 plugin agents、Teleport/remote agent 分支、swarm/team 分支，但前提是确认不影响本地 subagent。

---

## 5. 分阶段执行计划

### Phase 0：引用基线 ✅

**目标**：为每个候选删除项生成调用点清单，避免误删。

**建议命令**：

```bash
rg "services/analytics|utils/telemetry|services/langfuse" src packages -g '*.ts' -g '*.tsx'
rg "remoteManagedSettings|extractMemories|PromptSuggestion" src packages -g '*.ts' -g '*.tsx'
rg "utils/plugins|services/plugins|commands/plugin|loadAllPlugins|performStartupChecks" src packages -g '*.ts' -g '*.tsx'
rg "teleport|prepareWorkspaceApiRequest|prepareApiRequest|getOAuthHeaders|getOrganizationUUID" src packages -g '*.ts' -g '*.tsx'
rg "nativeInstaller|autoUpdater" src packages -g '*.ts' -g '*.tsx'
rg "teamMemorySync|memory-stores|SessionMemory|multiStore" src packages -g '*.ts' -g '*.tsx'
rg "skillLearning|skillSearch|searchExtraTools" src packages -g '*.ts' -g '*.tsx'
rg "commands/(voice|monitor|workflows|autonomy|autofix-pr|review)" src packages -g '*.ts' -g '*.tsx'
```

**产出**：

- 每个候选目录的 import/require/dynamic import 调用点；
- 删除、facade、暂缓三类清单；
- 记录到 `notes/subsequent-cleanup.md`，含关键发现：analytics 438 引用、plugins 47 文件、Teleport 依赖链深、Swarm 被 REPL 广泛引用。

---

### Phase 1：删除低风险 feature-gated 命令和实验性服务

**目标**：先清理入口单一、与最终边界明显冲突的功能。Phase 0 后本阶段拆为 1A/1B/1C，避免把高耦合模块误判为低风险。

#### Phase 1A：低风险直接删除 ✅

执行记录见 `notes/subsequent-cleanup.md` 第 12 节。已删除/确认删除：

- `src/commands/voice/`
- `src/hooks/useVoiceIntegration.tsx`
- `src/components/LogoV2/VoiceModeNotice.tsx`
- `src/commands/monitor.ts`
- `src/commands/workflows/`

#### Phase 1B：需先拆工具/入口后删除 ✅

执行记录见 `notes/subsequent-cleanup.md` 第 13 节。已删除/确认删除：

- `src/commands/skill-learning/`
- `src/services/skillLearning/`
- `src/commands/skill-search/`
- `src/services/skillSearch/`
- `packages/builtin-tools/src/tools/DiscoverSkillsTool/`

已先移除 `commands.ts`、`tools.ts`、`setup.ts`、`query.ts`、`SkillTool`、`toolExecution` 等入口/集成点，再执行物理删除。`SearchExtraToolsTool` 保留，其复用的查询抽取和 TF-IDF 工具函数已迁移到 `src/services/searchExtraTools/` 内。

#### Phase 1C：暂缓

- `src/services/searchExtraTools/`
- `packages/builtin-tools/src/tools/SearchExtraToolsTool/`
- `src/commands/autonomy.ts`
- `src/utils/autonomy*.ts`

暂缓原因：Phase 0 确认 `SearchExtraToolsTool` 是独立工具；`autonomy` 被 `main.tsx` CLI 子命令、`query.ts`、`proactive/useProactive.ts` 等多处引用。

**步骤**：

1. 先执行 Phase 1A，逐项删除并验证；
2. 再处理 Phase 1B，先拆 `tools.ts` / `commands.ts` / tests/snapshots 入口；
3. Phase 1C 不计入本阶段完成条件，需另行设计；
4. 每个小批次后运行门禁。

**验证命令**：

```bash
bun run typecheck
bun run build
bun test
bun run check:unused
```

---

### Phase 2：删除 Teleport / Remote cloud commands

**目标**：移除远程 workspace、云端任务、云端资源管理相关命令。

**删除命令**：

- `src/commands/teleport/`
- `src/commands/schedule/`
- `src/commands/vault/`
- `src/commands/skill-store/`
- `src/commands/memory-stores/`
- `src/commands/agents-platform/`
- `src/commands/remote-setup/`
- `src/commands/remote-env/`
- `src/commands/share/`
- `src/commands/install-github-app/`
- `src/commands/install-slack-app/`

**同步清理**：

- `src/commands.ts` 中对应 command 变量；
- `src/main.tsx` 中相关 commander subcommands/options；
- `src/cli/print.ts` 中 `options.teleport` 和 teleport resume 逻辑；
- `src/utils/teleport.tsx`；
- `src/utils/teleport/`；
- `src/bootstrap/state.ts` 中 teleported session state；
- `src/services/api/sessionIngress.ts`；
- `src/server/directConnectManager.ts` 中 teleport 类型引用；
- review/autofix 中 remote teleport 路径；
- 对应测试和 mock。

**注意**：

- 删除 cloud commands 前，先删除或 no-op 依赖 Teleport 的 review/autofix/ultrareview 远程路径，避免残留 `teleportToRemote` import。
- `packages/builtin-tools/src/tools/AgentTool/AgentTool.tsx` 当前仍引用 `teleportToRemote`。由于 AgentTool/subagent 本轮保留，删除 Teleport 时必须移除或 no-op AgentTool 中 remote agent / teleport 分支，同时保留本地 subagent 能力。

---

### Phase 3：删除 Marketplace / Plugin integrations

**目标**：删除 Marketplace 和 plugin 系统，不保留 plugin-provided MCP/LSP/agents/hooks/commands；保留手动 MCP config。

**最终状态**：

- 删除 `/plugin` 命令；
- 删除 marketplace 安装/更新/信任/策略/缓存；
- 删除 plugin hooks；
- 删除 plugin commands；
- 删除 plugin agents；
- 删除 plugin-provided MCP；
- 删除 plugin-provided LSP；
- 保留手动 MCP config。

**必须改造点**：

- `src/main.tsx`：移除 plugin startup/cache/scopes；
- `src/commands.ts`：移除 `/plugin` 和 plugin commands loading；
- `src/cli/print.ts`：移除 headless plugin install/hooks/plugin command source；
- `src/screens/REPL.tsx`：移除 `performStartupChecks`；
- `src/QueryEngine.ts`：移除 `loadAllPluginsCacheOnly()` 预加载；
- `src/services/mcp/config.ts`：移除 plugin MCP merge；
- `src/services/lsp/config.ts`：移除 plugin LSP merge；
- `packages/builtin-tools/src/tools/AgentTool/loadAgentsDir.ts`：移除 plugin agents；
- `packages/builtin-tools/src/tools/BashTool/*`、`PowerShellTool`：plugin hint 改 no-op 或删除；
- `src/constants/outputStyles.ts`：移除 plugin output styles；
- `src/hooks/useManagePlugins.ts` 和 plugin notification/recommendation hooks：删除或断引用；
- `src/services/tips/tipRegistry.ts`：移除 official marketplace tips。

**兼容保留**：

- 保留极小 `src/utils/plugins/pluginIdentifier.ts` / `parsePluginIdentifier` 兼容层；
- 保留极小 `src/utils/plugins/schemas.ts` / `PluginScope` 类型兼容层；
- 这些兼容层仅用于 SkillTool、slash command metadata、MCP channel 旧字段解析，不保留 plugin runtime / marketplace / hooks / commands / agents / MCP/LSP integration。

---

### Phase 4：OAuth 保留，但移除 workspace API 分支

**目标**：保留认证能力，删除远程 workspace / organization API 能力。

**保留**：

- `src/services/oauth/`；
- login/logout；
- OAuth token refresh；
- API key auth；
- basic profile 获取。

**删除或 no-op**：

- `getOrganizationUUID()` 的 workspace 用途；
- `prepareWorkspaceApiRequest()`；
- workspace API key 获取；
- cloud command API helpers；
- login UI 中 `/vault` / `/agents-platform` / `/memory-stores` 引导文案。

**注意**：不要删除 `src/services/oauth/` 目录本身。

---

### Phase 5：SessionMemory 保留，但删除 team/remote memory

**目标**：保留本地 SessionMemory，删除团队/云端 memory 能力。

**保留**：

- `src/services/SessionMemory/`；
- `src/services/compact/sessionMemoryCompact.ts`；
- `/summary`；
- `/compact` 中 SessionMemory compaction；
- `/local-memory`。

**删除**：

- `src/services/teamMemorySync/`；
- `src/commands/memory-stores/`；
- remote memory store API；
- workspace memory API。

**已确认**：

- `src/services/SessionMemory/multiStore.ts` 是本地 multi-key SessionMemory，被 `/local-memory` 和 `LocalMemoryRecallTool` 使用，不属于云端 memory store，保留。

**teamMemorySync 删除步骤**：

1. 移除 `src/setup.ts` 中 `teamMemorySync/watcher.js` 动态导入；
2. 移除 `src/utils/sessionFileAccessHooks.ts` 中对 `teamMemorySync/watcher.js` 的条件 `require`；
3. 将 `packages/builtin-tools/src/tools/FileEditTool/FileEditTool.ts` 与 `FileWriteTool/FileWriteTool.ts` 中的 `checkTeamMemSecrets` 检查替换为 no-op 或删除；
4. 再删除 `src/services/teamMemorySync/`。

---

### Phase 6：LSP 保留，但删除 plugin LSP integration

**目标**：保留 LSP core，删除 plugin-provided LSP。

**保留**：

- `src/services/lsp/`；
- LSP manager；
- diagnostics；
- `/clear` 中安全的 LSP cache reset。

**删除/改造**：

- `src/utils/plugins/lspPluginIntegration.ts`；
- `src/services/lsp/config.ts` 中 `getPluginLspServers()` / `loadAllPluginsCacheOnly()` 逻辑；
- LSP plugin recommendation hooks。

---

### Phase 7：删除 autoUpdater / nativeInstaller，保留 doctor 基础检查

**目标**：删除自动更新安装器和网络版本策略，但保留本地环境诊断。

**处理顺序**：

1. 将 `src/utils/autoUpdater.ts` 改为最小 facade，返回“无更新”；
2. 移除 REPL/PromptInput 的更新通知 UI，或始终传 `null`；
3. 改造 `src/screens/Doctor.tsx`，删除 dist tag / native installer / pid lock 检查；
4. 删除 `src/utils/nativeInstaller/`；
5. 删除或改造 `/install` 命令，使其仅提示文档安装方式；
6. 删除对应测试或改为 facade 行为测试。

**保留**：

- doctor 的本地环境检查；
- shell/path/权限等基础提示。

---

### Phase 8：no-op 服务 facade 化

**目标**：压缩实现复杂度，同时保留稳定导出。

#### 8.1 Analytics facade

保留必要导出文件，例如：

- `src/services/analytics/index.ts`
- `src/services/analytics/growthbook.ts`
- `src/services/analytics/metadata.ts`
- `src/services/analytics/config.ts`
- `src/services/analytics/firstPartyEventLogger.ts`
- `src/services/analytics/datadog.ts`
- `src/services/analytics/sink.ts`

内部实现固定返回值/no-op。

#### 8.2 Telemetry facade

保留必要导出文件，例如：

- `src/utils/telemetry/events.ts`
- `src/utils/telemetry/sessionTracing.ts`
- `src/utils/telemetry/betaSessionTracing.ts`
- `src/utils/telemetry/instrumentation.ts`
- `src/utils/telemetry/perfettoTracing.ts`
- `src/utils/telemetry/pluginTelemetry.ts`

内部实现 no-op。

#### 8.3 Langfuse facade

保留必要导出文件，例如：

- `src/services/langfuse/index.ts`
- `src/services/langfuse/tracing.ts`
- `src/services/langfuse/convert.ts`

OpenAI provider、AgentTool、sideQuery 仍可能依赖这些导出。

#### 8.4 Early-return 服务

`remoteManagedSettings`、`extractMemories`、`PromptSuggestion` 先保留最小 facade：

- `remoteManagedSettings`：login/logout/settings/print 仍可能引用；
- `extractMemories`：backgroundHousekeeping/print 仍可能引用；
- `PromptSuggestion`：REPL/print 仍可能引用。

---

### Phase 9：回归测试与状态文档更新

**目标**：完成阶段性清理后更新状态文档和快照。

**检查项**：

```bash
bun run typecheck
bun run build
bun run check:unused
bun test
```

**文档更新**：

- 新增/更新 `notes/subsequent-cleanup.md`：记录实际删除内容、保留 facade、暂缓项；
- 更新 `notes/FEATURE_STATUS_REPORT.md`：反映清理后状态；
- 如命令/工具列表变化，更新 snapshot 测试。

---

## 6. 推荐执行顺序总览

```text
Phase 0：引用基线 ✅
  ├── 已生成每个候选功能域调用点清单
  └── 已分类：删除 / facade / 保留 / 暂缓（见 notes/subsequent-cleanup.md）

Phase 1：低风险 feature-gated 命令
  ├── Phase 1A：voice / monitor / workflows
  ├── Phase 1B：skill-learning / skill-search（先拆工具/入口）
  └── Phase 1C：searchExtraTools / autonomy 暂缓

Phase 2：Teleport / Remote cloud commands
  ├── teleport / schedule / vault
  ├── skill-store / memory-stores / agents-platform
  ├── remote-setup / remote-env / share
  └── install-github-app / install-slack-app

Phase 3：Marketplace / Plugins
  ├── /plugin 命令
  ├── plugin hooks / commands / agents
  ├── plugin MCP integration
  └── plugin LSP integration

Phase 4：OAuth workspace 分支
  ├── 保留 OAuth/API key
  └── 删除 workspace API / organization cloud 分支

Phase 5：SessionMemory remote/team 分支
  ├── 保留本地 SessionMemory
  └── 删除 teamMemorySync / remote memory stores

Phase 6：LSP plugin integration
  ├── 保留 LSP core
  └── 删除 plugin-provided LSP

Phase 7：Auto updater / native installer
  ├── autoUpdater facade
  ├── Doctor 改造
  └── 删除 nativeInstaller

Phase 8：Observability / early-return facade
  ├── analytics / telemetry / langfuse
  └── remoteManagedSettings / extractMemories / PromptSuggestion

Phase 9：回归验证与文档更新
```

---

## 7. 风险与应对

### 7.1 TypeScript strict 连锁错误

**风险**：删除模块后 import/type 引用残留导致类型错误。

**应对**：

- 每个功能域先建立引用基线；
- 小批量修改，每次 1-3 个目录；
- 每步后运行 `bun run typecheck`；
- 失败立即回退或补齐 facade 导出。

### 7.2 package-layer imports 未修复

**风险**：`packages/builtin-tools/` 引用已删除模块。

**应对**：

- 删除 `src/` 目录前先搜索 `packages/`；
- AgentTool 本轮保留；
- BashTool/PowerShellTool plugin hint 改 no-op 或删除；
- package 层依赖未清完前，不物理删除对应 `src/` 模块。

### 7.3 command 入口残留

**风险**：删除命令目录后，`src/commands.ts` 或其他入口仍 `require()` / `import()`。

**应对**：

- 全仓搜索命令路径；
- 同步更新 `src/commands.ts`、`src/main.tsx`、`src/entrypoints/*`、`src/cli/*`、相关组件；
- 删除或更新测试和 snapshot。

### 7.4 OAuth 与 workspace API 混淆

**风险**：误删 OAuth 基础登录能力。

**应对**：

- 明确保留 `src/services/oauth/`；
- 只删除 workspace API / organization cloud 分支；
- login/logout/API key 流程必须回归测试。

### 7.5 AgentTool 误删

**风险**：误删 AgentTool 依赖导致 SkillTool、TaskOutputTool、subagent 失败。

**应对**：

- 本轮禁止删除 `packages/builtin-tools/src/tools/AgentTool/`；
- 如需清理，只删除 plugin agents/remote teleport/swarm team 可选集成点；
- 每次改动后运行 AgentTool/SkillTool 相关测试。

---

## 8. 完成标准

当以下条件满足时，认为本轮清理完成：

- [x] Phase 0 引用基线完成并记录；
- [x] Phase 1A 低风险 feature-gated 命令清理完成（typecheck/build/test 通过；check:unused 因 PATH 环境问题未运行成功）；
- [x] Phase 1B skill-learning / skill-search 在拆除工具/入口后清理完成（typecheck/build/test/lint 通过；check:unused 因 PATH 环境问题未运行成功）；
- [x] Phase 1C searchExtraTools / autonomy 已明确暂缓，不计入 Phase 1 完成条件；
- [ ] Phase 2 Teleport / Remote cloud commands 删除完成或明确暂缓项；
- [ ] Phase 3 Marketplace / Plugin integrations 删除完成，手动 MCP config 仍可用；
- [ ] Phase 4 OAuth 保留，workspace API 分支删除；
- [ ] Phase 5 本地 SessionMemory 保留，team/remote memory 删除；
- [ ] Phase 6 LSP core 保留，plugin LSP integration 删除；
- [ ] Phase 7 autoUpdater/nativeInstaller 删除或 facade 化，doctor 基础检查保留；
- [ ] Phase 8 no-op 服务 facade 化完成；
- [ ] `bun run typecheck` / `bun run build` / `bun run check:unused` / `bun test` 全部通过；
- [ ] 新增/更新 `notes/subsequent-cleanup.md`；
- [ ] 更新 `notes/FEATURE_STATUS_REPORT.md`。

---

## 9. 注意事项

1. **不要一次性删除所有目录**：每批删除后运行门禁验证，失败则回退。
2. **不要直接删除广泛引用的 no-op 模块**：先 facade 化，再逐步移除调用点。
3. **AgentTool 暂时完全保留**：本轮不删除、不拆分 AgentTool 核心；删除 Teleport 时仅移除 remote agent / teleport 分支，保留本地 subagent。
4. **保留 MCP 客户端**：`src/services/mcp/` 是 personal-local 的核心能力；仅删除 plugin-provided MCP integration。
5. **保留 LSP core**：仅删除 plugin-provided LSP integration。
6. **保留 OAuth/API key 登录**：只删除 workspace/organization 云端分支。
7. **保留权限系统**：`src/utils/permissions/` 是核心安全边界。
8. **保留 Bash/PowerShell 解析**：核心工具能力。
9. **保持 `parseSSEFrames` 真实**：`src/cli/transports/SSETransport.ts` 保留 `parseSSEFrames()` 导出，tests 和 stream 解析依赖它。

---

## 10. 参考文档

- `notes/FEATURE_STATUS_REPORT.md` — 当前功能状态统计
- `notes/PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` — 原始精简计划（第 13 节“推荐最终目录状态”定义了删除范围）
- `notes/baseline-check.md` — 基线记录
- `notes/phase-7-dependency-cleanup.md` — 前期依赖清理记录
- `docs/personal-local.md` — 个人本地版文档
