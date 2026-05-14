# 后续清理计划：物理删除 INACTIVE 与 NO-OP 代码

> 基于 `notes/FEATURE_STATUS_REPORT.md` 统计结果
> 对应 `PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` 中的后续阶段工作
>
> 前置条件：`bun run typecheck` ✅ / `bun run build` ✅ / `bun test` ✅（4565 pass）

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

**核心问题**：约 **77,534 行**（INACTIVE + NO-OP）代码物理存在但不执行任何功能，可以物理删除以：

1. 减少 `typecheck` / `build` 的分析范围
2. 降低包体积（bundled 882 files → 更少）
3. 消除潜在的 import 链干扰
4. 提高代码库可维护性

### 1.3 后续目标

通过物理删除 INACTIVE 和 NO-OP 代码，将 `src/` 总行数从 ~436K 降至 **~358K**（减少约 78K 行），同时保持所有门禁通过。

---

## 2. 当前代码状态详情

### 2.1 INACTIVE 代码残骸（feature flag 关闭）

| 目录/模块 | 行数 | 覆盖的 feature flags |
|-----------|------|----------------------|
| `src/utils/swarm/` | 8,835 | `COWORKER_TYPE_TELEMETRY`, `PIPE_IPC`, `TEAMMEM` |
| `src/utils/plugins/` | 20,536 | `HOOK_PROMPTS`, `MCP_SKILLS` |
| `src/commands/plugin/` | 7,462 | `HOOK_PROMPTS`, `MCP_SKILLS` |
| `src/components/agents/` | 3,453 | `FORK_SUBAGENT`, `AGENT_TRIGGERS` |
| `src/services/skillLearning/` | 7,161 | `SKILL_LEARNING`, `SKILL_IMPROVEMENT` |
| `src/services/skillSearch/` | 1,629 | `EXPERIMENTAL_SKILL_SEARCH` |
| `src/services/searchExtraTools/` | 877 | `EXPERIMENTAL_SEARCH_EXTRA_TOOLS` |
| `src/commands/skill-learning/` | 676 | `SKILL_LEARNING` |
| `src/commands/skill-search/` | 185 | `EXPERIMENTAL_SKILL_SEARCH` |
| `src/commands/autofix-pr/` | 1,206 | `AUTOFIX_PR`, `REVIEW_ARTIFACT` |
| `src/commands/monitor.ts` | 108 | `MONITOR_TOOL` |
| `src/commands/review/` | ~500 | `REVIEW_ARTIFACT` |
| `src/commands/voice/` | 205 | `VOICE_MODE` |
| `src/hooks/useVoiceIntegration.tsx` | 679 | `VOICE_MODE` |
| `src/components/LogoV2/VoiceModeNotice.tsx` | 51 | `VOICE_MODE` |
| `src/commands/workflows/` | 28 | `WORKFLOW_SCRIPTS` |
| `src/utils/swarm/backends/TmuxBackend.ts` | 800 | `COWORKER_TYPE_TELEMETRY` |
| `src/commands/{peers,attach,detach,send,pipes,pipe-status}/` | ~1,200 | `UDS_INBOX`, `PIPE_IPC` |
| `packages/builtin-tools/src/tools/AgentTool/` | 7,836 | `FORK_SUBAGENT`, `AGENT_TRIGGERS` |
| **INACTIVE 小计** | **~63,596** | |

### 2.2 NO-OP 代码（函数返回 stub）

| 目录/模块 | 行数 | NO-OP 机制 |
|-----------|------|-----------|
| `src/services/analytics/` | 4,203 | 全部返回 no-op |
| `src/utils/telemetry/` | 2,966 | 全部返回 no-op |
| `src/services/langfuse/` | 705 | 全部返回 no-op |
| `src/utils/sentry.ts` | 31 | no-op facade |
| `src/services/remoteManagedSettings/` | 889 | personal-local early return |
| `src/services/extractMemories/` | 766 | personal-local early return |
| `src/services/PromptSuggestion/` | 1,522 | personal-local early return |
| `src/commands/autonomy.ts` + autonomy utils | 2,856 | stub 为 unavailable |
| **NO-OP 小计** | **~13,938** | |

### 2.3 待确认可删除（需先验证 import 链）

| 目录/模块 | 行数 | 风险级别 |
|-----------|------|----------|
| `src/services/teamMemorySync/` | 2,167 | 中（依赖已删除的 bridge/acp） |
| `src/services/SessionMemory/` | 2,067 | 低（但可能被 core 使用） |
| `src/commands/insights.ts` | 3,205 | 低（可选删除） |
| `src/utils/nativeInstaller/` | 3,015 | 低（非核心） |
| `src/services/lsp/` | 2,625 | 低（feature-gated） |
| `src/services/oauth/` | 1,063 | 低（非核心） |

---

## 3. 清理范围与分类

### 3.1 批次 A：可直接删除（低风险）

**特征**：无复杂 import 链，或 import 链已断。

| 类别 | 删除项 | 预估行数 |
|------|--------|----------|
| **NO-OP 服务** | `src/services/analytics/`、`src/utils/telemetry/`、`src/services/langfuse/`、`src/utils/sentry.ts` | ~7,905 |
| **Early Return 服务** | `src/services/remoteManagedSettings/`、`src/services/extractMemories/`、`src/services/PromptSuggestion/` | ~3,177 |
| **Autonomy stub** | `src/commands/autonomy.ts` + `src/utils/autonomyAuthority.ts` + `src/utils/autonomyFlows.ts` + `src/utils/autonomyRuns.ts` + `src/utils/autonomyPersistence.ts` + `src/utils/autonomyQueueLifecycle.ts` | ~2,856 |
| **Voice 命令/hooks** | `src/commands/voice/`、`src/hooks/useVoiceIntegration.tsx`、`src/components/LogoV2/VoiceModeNotice.tsx` | ~935 |
| **Monitor / Autofix** | `src/commands/autofix-pr/`、`src/commands/monitor.ts`、`src/commands/review/` | ~1,814 |
| **Workflow** | `src/commands/workflows/` | 28 |
| **Skill Learning（已明确计划删除）** | `src/services/skillLearning/`、`src/commands/skill-learning/` | ~7,837 |

**批次 A 预估删除：~24,552 行**

### 3.2 批次 B：需先修复 import 链

**特征**：存在 package-layer imports（`packages/builtin-tools/`、`packages/mcp-client/` 等）。

| 类别 | 删除项 | 预估行数 | 前置工作 |
|------|--------|----------|----------|
| **Swarm** | `src/utils/swarm/`、`src/hooks/toolPermission/handlers/swarmWorkerHandler.ts` | ~8,994 | 修复 `packages/builtin-tools/src/tools/AgentTool/` 等 |
| **Plugins / Marketplace** | `src/utils/plugins/`、`src/commands/plugin/` | ~27,998 | 修复 `packages/builtin-tools/` 的 plugin 相关 imports |
| **AgentTool（packages 层）** | `packages/builtin-tools/src/tools/AgentTool/` | ~7,836 | 修复 forkSubagent / resumeAgent / builtInAgents 等 |
| **Skill Search** | `src/services/skillSearch/`、`src/services/searchExtraTools/`、`src/commands/skill-search/` | ~2,691 | 检查 builtin-tools 有无 import |
| **Agent UI 组件** | `src/components/agents/` | ~3,453 | 修复 AgentTool 引用后 |
| **Peers/Pipes 命令** | `src/commands/{peers,attach,detach,send,pipes,pipe-status}/` | ~1,200 | 确认无 import |

**批次 B 预估删除：~52,172 行**

### 3.3 批次 C：可选删除（视需要）

| 类别 | 删除项 | 预估行数 | 说明 |
|------|--------|----------|------|
| **Team Memory Sync** | `src/services/teamMemorySync/` | 2,167 | 依赖已删除的 bridge/acp |
| **Insights** | `src/commands/insights.ts` | 3,205 | 可选，不影响 core |
| **Native Installer** | `src/utils/nativeInstaller/` | 3,015 | 自动更新，非核心 |
| **OAuth** | `src/services/oauth/` | 1,063 | OAuth 流程，非核心 |
| **LSP** | `src/services/lsp/` | 2,625 | feature-gated，默认关闭 |
| **SessionMemory** | `src/services/SessionMemory/` | 2,067 | 需确认 core 是否依赖 |
| **Teleport** | `src/utils/teleport/` | 1,117 | 可选 |

**批次 C 预估删除：~15,259 行**（可选）

---

## 4. 分阶段执行计划

### 批次 A：清理 NO-OP 和 Early Return 模块（低风险）

**目标**：删除 `analytics`、`telemetry`、`langfuse`、`sentry`、`remoteManagedSettings`、`extractMemories`、`PromptSuggestion`、`autonomy`、`voice`、`monitor`、`autofix`、`skill-learning`

**步骤**：

1. 列出所有待删除目录
2. 对每个目录执行：
   - `rg "from.*<目录>|require.*<目录>" src/ --type ts` 确认无内部 import
   - 检查 `packages/` 层是否有 import
   - 删除目录
   - 运行 `bun run typecheck` + `bun run build` + `bun test`（失败则回退）
3. 同步更新 `knip.json`（如有需要 ignore 的路径）

**验证命令**：

```bash
bun run typecheck
bun run build
bun test
bun run check:unused
```

---

### 批次 B：清理 Swarm / Plugins / AgentTool（中风险）

**目标**：删除 `swarm`、`plugins`、`commands/plugin`、`components/agents`、`AgentTool`（packages 层）

**步骤**：

1. **先处理 AgentTool（packages 层）**
   - 检查 `forkSubagent.ts`、`resumeAgent.ts`、`builtInAgents.ts` 等文件的 import
   - 替换/删除对 `src/utils/swarm/`、`src/coordinator/` 等的引用
   - 删除 `AgentTool` 目录或替换为 stub
   - 运行 typecheck

2. **再处理 Swarm**
   - `rg "from.*swarm|require.*swarm" src/` 确认无 import
   - 删除 `src/utils/swarm/`
   - 删除 `src/hooks/toolPermission/handlers/swarmWorkerHandler.ts`
   - 运行 typecheck

3. **再处理 Plugins / Marketplace**
   - `rg "from.*plugins|require.*plugins" src/` 确认无 import
   - 检查 `packages/mcp-client/` 有无 plugin 相关 imports
   - 删除 `src/utils/plugins/`、`src/commands/plugin/`
   - 运行 typecheck

4. **处理 Agents UI 组件**
   - `rg "from.*components/agents|require.*agents" src/` 确认无 import
   - 删除 `src/components/agents/`
   - 运行 typecheck

5. **处理 Skill Search**
   - `rg "from.*skillSearch|require.*skillSearch" src/` 确认无 import
   - 删除 `src/services/skillSearch/`、`src/services/searchExtraTools/`、`src/commands/skill-search/`
   - 运行 typecheck

6. **处理 Peers/Pipes 命令**
   - `rg "from.*commands/peers|from.*commands/attach|from.*commands/detach" src/` 确认无 import
   - 删除相关目录
   - 运行 typecheck

**验证命令**：

```bash
bun run typecheck
bun run build
bun test
bun run check:unused
```

---

### 批次 C：可选清理（视需要）

**目标**：删除 `teamMemorySync`、`insights`、`nativeInstaller`、`oauth`、`lsp`、`SessionMemory`、`teleport`

**步骤**：

1. 逐个验证每个模块是否被 core 依赖
2. 确认后删除
3. 运行门禁验证

---

## 5. 执行顺序总览

```
批次 A（~24,552 行，低风险）
    ↓
  NO-OP 服务
    ├── src/services/analytics/
    ├── src/utils/telemetry/
    ├── src/services/langfuse/
    └── src/utils/sentry.ts

  Early Return 服务
    ├── src/services/remoteManagedSettings/
    ├── src/services/extractMemories/
    └── src/services/PromptSuggestion/

  Autonomy stub
    ├── src/commands/autonomy.ts
    └── src/utils/autonomy*.ts（6 个文件）

  Voice / Monitor / Autofix / Workflow
    ├── src/commands/voice/
    ├── src/commands/monitor.ts
    ├── src/commands/autofix-pr/
    ├── src/commands/review/
    └── src/commands/workflows/

  Skill Learning
    ├── src/services/skillLearning/
    └── src/commands/skill-learning/
    ↓
批次 B（~52,172 行，中风险）
    ↓
  AgentTool（packages 层）
    └── packages/builtin-tools/src/tools/AgentTool/

  Swarm
    ├── src/utils/swarm/
    └── src/hooks/toolPermission/handlers/swarmWorkerHandler.ts

  Plugins / Marketplace
    ├── src/utils/plugins/
    └── src/commands/plugin/

  Agents UI
    └── src/components/agents/

  Skill Search
    ├── src/services/skillSearch/
    ├── src/services/searchExtraTools/
    └── src/commands/skill-search/

  Peers/Pipes 命令
    └── src/commands/{peers,attach,detach,send,pipes,pipe-status}/
    ↓
批次 C（~15,259 行，可选）
    ↓
  Team Memory Sync
    └── src/services/teamMemorySync/

  Insights
    └── src/commands/insights.ts

  Native Installer
    └── src/utils/nativeInstaller/

  OAuth
    └── src/services/oauth/

  LSP
    └── src/services/lsp/

  Session Memory
    └── src/services/SessionMemory/

  Teleport
    └── src/utils/teleport/
```

---

## 6. 风险与应对

### 6.1 TypeScript strict 连锁错误

**风险**：删除模块后 import/type 引用残留导致类型错误。

**应对**：
- 每删除一个目录前，先运行 `rg "from.*<dir>|require.*<dir>" src/ --type ts` 确认无内部 import
- 检查 `packages/` 层：`rg "from.*src/|require.*src/" packages/builtin-tools/ --type ts`
- 每步后运行 `bun run typecheck`，失败则回退
- 小批量删除（每次 1-3 个目录），不一次性删除大量

### 6.2 package-layer imports 未修复

**风险**：`packages/builtin-tools/src/tools/AgentTool/` 等文件 import 已删除的 `src/utils/swarm/`、`src/coordinator/` 等。

**应对**：
- 批次 B 先处理 packages 层，在删除 src/ 目录前修复所有 package imports
- 具体修复模式参考前期经验：
  - `forkSubagent.ts` → 替换为本地 stub `isCoordinatorMode = () => false`
  - `builtInAgents.ts` → 删除 lazy require
  - `AgentTool.tsx` → 删除 `isCoordinatorMode` import
  - `win32.ts` → 添加本地 stub 函数

### 6.3 command 入口残留

**风险**：删除命令目录后，`src/commands.ts` 中的 `require()` 引用导致运行时错误。

**应对**：
- 批次 A 中删除 `autonomy.ts`、`voice/`、`monitor.ts`、`autofix-pr/`、`skill-learning/` 等命令前，先在 `src/commands.ts` 中将对应变量设为 `null`：
  ```ts
  // 原来
  const autonomy = personalLocalCommandTrimmed
    ? require('./commands/autonomy.js').default
    : null

  // 改为
  const autonomy = null  // 已删除
  ```
- 同理处理 `skillSearch`、`autofix`、`monitor`、`voice`、`workflows` 等

### 6.4 builtInCommandNames memoization 干扰

**风险**：删除命令后，`builtInCommandNames` 缓存可能包含已删除的命令名。

**应对**：
- `clearCommandMemoizationCaches()` 在测试和删除后调用
- 删除命令后手动测试 `bun run dev --help` 确认命令列表正确

---

## 7. 预期结果

### 7.1 代码量变化

| 阶段 | 删除行数 | src/ 总行数（估算） |
|------|----------|---------------------|
| 批次 A | ~24,552 | ~412,010 |
| 批次 B | ~52,172 | ~359,838 |
| 批次 C（可选） | ~15,259 | ~344,579 |

**目标：批次 A + 批次 B 完成后，src/ 总行数从 ~436K 降至 ~360K，减少约 17%。**

### 7.2 包体积变化

当前：`dist/cli.js` + 882 bundled files

预期：清理完成后 bundle 文件数减少（预估 820-850 files）。

### 7.3 门禁验证

每阶段完成后必须通过：

```bash
bun run typecheck     # 必须零错误
bun run build         # 必须通过
bun run check:unused  # 必须通过（可能有新增 unused files 待 knip ignore）
bun test             # 必须全部通过（4565+ pass）
```

---

## 8. 完成标准

当以下条件全部满足时，认为本轮清理完成：

- [ ] 批次 A 全部删除，4 个门禁通过
- [ ] 批次 B 全部删除，4 个门禁通过
- [ ] `src/` 总行数降至 ~360K 以下
- [ ] `bun run build` bundle 文件数降至 850 以下
- [ ] `bun run test` 全量通过
- [ ] 新增 `notes/subsequent-cleanup.md` 记录实际删除内容
- [ ] 更新 `notes/FEATURE_STATUS_REPORT.md` 反映清理后的状态

---

## 9. 注意事项

1. **不要一次性删除所有目录**：每批删除后运行门禁验证，失败则回退。
2. **先修复 package-layer imports 再删除 src/ 目录**：避免类型错误连锁反应。
3. **保持 `parseSSEFrames` 真实**：`src/cli/transports/SSETransport.ts` 保留 `parseSSEFrames()` 导出，tests 和 stream 解析依赖它。
4. **保留 MCP 客户端**：`src/services/mcp/` 是 personal-local 的核心能力，保留但可精简（如移除未使用的 auth flow）。
5. **保留权限系统**：`src/utils/permissions/` 是核心安全边界，保留。
6. **保留 Bash/PowerShell 解析**：核心工具能力，保留。
7. **保留 MCP 客户端**：个人版仍然支持 MCP server 连接，保留完整 client。

---

## 10. 参考文档

- `notes/FEATURE_STATUS_REPORT.md` — 当前功能状态统计
- `notes/PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` — 原始精简计划（第 13 节"推荐最终目录状态"定义了删除范围）
- `notes/baseline-check.md` — 基线记录
- `notes/phase-7-dependency-cleanup.md` — 前期依赖清理记录
- `docs/personal-local.md` — 个人本地版文档