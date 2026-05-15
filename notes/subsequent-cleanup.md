# Phase 0 引用基线报告

> 产出：每个候选目录的 import/require/dynamic import 调用点；删除 / facade / 暂缓 三类清单。
> 来源：`notes/INACTIVE_NOOP_CLEANUP_PLAN.md` Phase 0。
> 扫描命令：`rg "<moduleName>" src packages -g '*.ts' -g '*.tsx'`，排除 `node_modules`、`__tests__`、`__mocks__`。

---

## 1. analytics / telemetry / langfuse

### analytics（438 引用）

**引用文件数**：src/ 内 ~260 个，packages/builtin-tools 内 ~30 个。

**facade 类**（必须保留最小导出）：

- `src/services/analytics/index.ts` — `logEvent`、`isAnalyticsDisabled` 等核心导出
- `src/services/analytics/growthbook.ts` — `getFeatureValue_CACHED_MAY_BE_STALE`、`getDynamicConfig_*`、`checkGate_CACHED_OR_BLOCKING`、`initializeGrowthBook`、`refreshGrowthBookAfterAuthChange`
- `src/services/analytics/metadata.ts` — `sanitizeToolNameForAnalytics`、`AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`
- `src/services/analytics/config.ts` — `isFeedbackSurveyDisabled`
- `src/services/analytics/firstPartyEventLogger.ts` — `logEventTo1P`、`shutdown1PEventLogging`
- `src/services/analytics/datadog.ts` — `shutdownDatadog`
- `src/services/analytics/sink.ts` — `initializeAnalyticsGates`、`initializeAnalyticsSink`
- `src/services/analytics/grove.ts`
- `src/services/analytics/types.ts`

**非 facade 类**（应压缩为 no-op 的实现）：

- `growthbook.ts` 中实际 growthbook 初始化逻辑
- `datadog.ts` 中实际 datadog 上传逻辑
- 所有其他内部文件（`firstPartyEventLogger.ts` 除外）

**策略**：保留上述 facade 文件，将其他实现文件压缩为固定返回值。不可物理删除整个 `analytics/` 目录。

---

### telemetry（中等引用）

**引用文件**：API logging、API claude、REPL、entrypoints/init、compact/postCompactCleanup、telemetry 自身文件等。

**必须保留的 facade 文件**：

- `src/utils/telemetry/events.ts` — `logOTelEvent`
- `src/utils/telemetry/sessionTracing.ts` — `endInteractionSpan`、`getInteractionSpanContext`
- `src/utils/telemetry/betaSessionTracing.ts` — `clearBetaTracingState`、`isBetaTracingEnabled`
- `src/utils/telemetry/instrumentation.ts` — `flushTelemetry`
- `src/utils/telemetry/pluginTelemetry.ts` — `logPluginLoadErrors`、`logPluginsEnabledForSession`、`buildPluginCommandTelemetryFields`
- `src/utils/telemetry/skillLoadedEvent.ts` — `logSkillsLoaded`

**策略**：保留上述 facade 文件，将其余实现压缩为 no-op。不可物理删除整个 `telemetry/` 目录。

---

### langfuse（中引用）

**引用文件**：`src/services/api/openai/index.ts`、`AgentTool/runAgent.ts`、`query.ts`、sideQuery、hooks/skillImprovement、yoloClassifier、permissions 等。

**必须保留的 facade 文件**：

- `src/services/langfuse/index.ts` — `initLangfuse`、`shutdownLangfuse`
- `src/services/langfuse/tracing.ts` — `recordLLMObservation`
- `src/services/langfuse/convert.ts` — 类型转换函数

**策略**：保留上述 facade 文件，将其他实现压缩为 no-op。不可物理删除整个 `langfuse/` 目录。

---

## 2. remoteManagedSettings / extractMemories / PromptSuggestion

### remoteManagedSettings（11 个引用文件）

引用文件：`cli/print.ts`、`commands/login/login.tsx`、`commands/logout/logout.tsx`、`main.tsx`、`utils/settings/settings.ts`、`utils/managedEnv.ts`、`state/AppStateStore.ts`、`memdir/paths.ts`、`memdir/memoryScan.ts`、`tasks/LocalAgentTask.tsx`、`tasks/LocalShellTask.tsx`。

**调用点**：

- `waitForRemoteManagedSettingsToLoad` — `cli/print.ts`
- `refreshRemoteManagedSettings` — `login/login.tsx`、`logout/logout.tsx`
- `clearRemoteManagedSettingsCache` — `logout/logout.tsx`
- `getRemoteManagedSettingsSyncFromCache` — `settings/settings.ts`
- `isRemoteManagedSettingsEligible` — `managedEnv.ts`

**策略**：先保留为最小 no-op facade，后续移除调用点。不可直接删除。

---

### extractMemories（5 个引用文件）

引用文件：`cli/print.ts`、`utils/backgroundHousekeeping.ts`、`services/extractMemories/` 内部。

**调用点**：

- `extractMemories` hook/import — `cli/print.ts`、`backgroundHousekeeping.ts`

**策略**：先保留为 no-op facade，后续移除调用点。

---

### PromptSuggestion（9 个引用文件）

引用文件：`hooks/usePromptSuggestion.ts`、`services/PromptSuggestion/promptSuggestion.ts`、`REPL.tsx`、`query/stopHooks.ts`、`state/AppStateStore.ts`、`cli/print.ts`、`entrypoints/init.ts`、`components/FeedbackSurvey/usePostCompactSurvey.tsx`。

**调用点**：

- `usePromptSuggestion` hook — `REPL.tsx`、`AppStateStore.ts`
- `handleSpeculationAccept` — `REPL.tsx`

**策略**：先保留为 no-op facade，后续移除调用点。

---

## 3. Plugins / Marketplace

**引用文件数**：47 个（src/ + packages/）。

**引用分布**：

| 类型 | 文件 |
|------|------|
| plugin 命令 | 10 个 `src/commands/plugin/*.tsx` |
| MCP/LSP 配置 | `mcp/config.ts`、`lsp/config.ts`、`channelNotification.ts`、`channelAllowlist.ts`、`useManageMCPConnections.ts` |
| main/setup | `main.tsx`、`setup.ts`、`outputStyles/loadOutputStylesDir.ts` |
| REPL/print | `REPL.tsx`、`cli/print.ts`、`constants/outputStyles.ts` |
| services/plugins | `pluginOperations.ts`、`pluginCliCommands.ts`、`PluginInstallationManager.ts` |
| utils/plugins | 12+ 个文件 |
| hooks | 6 个 hook 文件 |
| builtin-tools | `BashTool.tsx`、`GrepTool.ts`、`PowerShellTool.tsx`、`SkillTool.ts`、`AgentTool/loadAgentsDir.ts` |
| components | `LogoV2/ChannelsNotice.tsx`、`thinkback-play` |

**必须保留的兼容层**：

- `utils/plugins/pluginIdentifier.ts` — `parsePluginIdentifier` 被 SkillTool、mcp channel 等多处使用
- `utils/plugins/schemas.ts` — `PluginScope` 类型被多处使用

**Phase 3 目标**：删除 marketplace 命令、plugin hooks/agents/MCP/LSP integration、headless plugin install；保留 `pluginIdentifier` 和 `PluginScope` 类型兼容。

---

## 4. Teleport / Remote cloud commands / workspace API

### Teleport 命令（Phase 2 目标）

待删除命令目录：`teleport`、`schedule`、`vault`、`skill-store`、`memory-stores`、`agents-platform`、`remote-setup`、`remote-env`、`share`、`install-github-app`、`install-slack-app`。

**命令入口**：`commands.ts` 中变量全部 `= personalLocalCommandTrimmed ? null : require(...)`。

### Teleport API（Phase 4 目标）

关键文件：`src/utils/teleport.tsx`、`src/utils/teleport/api.ts`、`src/utils/teleport/environments.ts`。

**引用 Teleport API 的文件**（按 Phase 归属）：

| Phase | 文件 | 用途 |
|-------|------|------|
| Phase 2（删除） | 11 个 cloud command 目录 | 命令本身 |
| Phase 2（删除） | `commands/review/reviewRemote.ts` | teleport remote review |
| Phase 2（删除） | `commands/autofix-pr/launchAutofixPr.ts` | teleportToRemote |
| Phase 2（删除） | `hooks/useTeleportResume.tsx` | teleport resume |
| Phase 3/4（删除） | `services/api/ultrareviewPreflight.ts`、`services/api/ultrareviewQuota.ts` | ultrareview API |
| Phase 4（删除） | `services/api/sessionIngress.ts`、`services/api/referral.ts`、`services/api/adminRequests.ts`、`services/api/overageCreditGrant.ts` | 云端 API |
| Phase 4（保留观察） | `bootstrap/state.ts` teleported session state | teleport session tracking |
| Phase 4（保留观察） | `tasks/RemoteAgentTask/`、`hooks/useRemoteSession.ts`、`hooks/useSSHSession.ts`、`server/directConnectManager.ts` | remote session management |
| Phase 4（保留观察） | `AgentTool.tsx` import `teleportToRemote` | remote agent（需处理） |

**delete-order**：

1. 先删除 `/autofix-pr` 和 `/review` 的 remote teleport 路径（Phase 2 同步清理）
2. 再删除 cloud commands 目录（Phase 2）
3. 再删除 `utils/teleport.tsx`/`utils/teleport/`（Phase 4）
4. 最后处理 API service 文件中的 teleport 引用（Phase 4）

---

## 5. AutoUpdater / nativeInstaller

**引用文件**（13 个）：`commands/install.tsx`、`REPL.tsx`、`setup.ts`、`Notifications.tsx`、`PromptInput.tsx`、`PromptInputFooter.tsx`、`Doctor.tsx`、`nativeInstaller/installer.ts`、`useInstallMessages.tsx`、`backgroundHousekeeping.ts`、`cleanup.ts`、`doctorDiagnostic.ts`、`status.tsx`。

**调用点**：

- `AutoUpdaterResult` 类型 + `autoUpdaterResult` state — `REPL.tsx`、`PromptInput`、`Notifications`
- `getGcsDistTags`、`getNpmDistTags` — `Doctor.tsx`
- `waitForAutoUpdater` — `setup.ts`、`backgroundHousekeeping.ts`
- `installGitHubApp`、`installSlackApp` — `useInstallMessages.tsx`、`status.tsx`

**注意**：`utils/plugins/officialMarketplaceGcs.ts` 也引用了 nativeInstaller，这是 plugins 系统依赖，需要在 Phase 3 同步处理。

**策略**：Phase 7。autoUpdater 改为最小 facade → REPL/PromptInput 传 null → Doctor 改造 → nativeInstaller 删除。

---

## 6. SessionMemory / teamMemorySync / multiStore

### SessionMemory（保留，9 个调用文件）

**调用文件**：`commands/compact/compact.ts`、`commands/summary/index.ts`、`commands/local-memory/launchLocalMemory.tsx`、`services/awaySummary.ts`、`services/compact/autoCompact.ts`、`services/compact/sessionMemoryCompact.ts`、`setup.ts`、`skills/bundled/skillify.ts`、`packages/builtin-tools/src/tools/CtxInspectTool/CtxInspectTool.ts`。

**调用函数**：`setLastSummarizedMessageId`、`getSessionMemoryContent`、`manuallyExtractSessionMemory`、`isSessionMemoryInitialized`、`initSessionMemory`、`getSessionMemoryPath`、`getSessionMemoryConfig`。

**结论**：SessionMemory 是核心能力，保留。

### multiStore（本地 multi-key store）

**引用文件**：`packages/builtin-tools/src/tools/LocalMemoryRecallTool/LocalMemoryRecallTool.ts`（依赖 `multiStore.js`）、`src/commands/local-memory/launchLocalMemory.tsx`（依赖 `multiStore.js`）。

**结论**：`multiStore.ts` 是本地 multi-key session memory store，不是云端 memory store。保留。

### teamMemorySync（删除）

**引用文件**：

- `packages/builtin-tools/src/tools/FileEditTool/FileEditTool.ts` — `checkTeamMemSecrets`
- `packages/builtin-tools/src/tools/FileWriteTool/FileWriteTool.ts` — `checkTeamMemSecrets`
- `src/setup.ts` — 动态导入 `teamMemorySync/watcher.js`
- `src/utils/sessionFileAccessHooks.ts` — 条件 `require('../services/teamMemorySync/watcher.js')`

**delete-order**：

1. 先在 `setup.ts` 和 `sessionFileAccessHooks.ts` 中移除 `teamMemorySync` 引用
2. 再在 FileEditTool / FileWriteTool 中将 `checkTeamMemSecrets` 替换为 no-op
3. 最后删除 `src/services/teamMemorySync/`

---

## 7. Skill Learning / Skill Search / Search Extra Tools

### DiscoverSkillsTool（feature-gated）

**工具注册**：`tools.ts` — `const DiscoverSkillsTool = feature('EXPERIMENTAL_SKILL_SEARCH') ? require(...) : undefined`

**引用文件**（工具相关）：`commands/skill-search/`、`services/skillSearch/`、`packages/builtin-tools/src/tools/DiscoverSkillsTool/`。

**结论**：Phase 1 候选。需确认工具是否 feature-gated 关闭后可删除。

### SearchExtraToolsTool（始终加载）

**工具注册**：`tools.ts` — `...(isSearchExtraToolsEnabledOptimistic() ? [SearchExtraToolsTool] : [])`

**引用文件**：`src/services/searchExtraTools/`、`src/commands/skill-search/`、`src/utils/searchExtraTools.ts`、`src/constants/prompts.ts`、`src/constants/tools.ts`、`packages/builtin-tools/src/tools/SearchExtraToolsTool/`。

**关键发现**：`SearchExtraToolsTool` 不依赖 `skillLearning`/`skillSearch`，是独立工具。

**策略**：需要确认 `SearchExtraToolsTool` 工具是否属于 personal-local 边界。如果是，可以保留工具本身、删除 `skillLearning`/`skillSearch` 相关命令和服务。

### Skill Learning（实验性，删除）

**引用文件**：`src/commands/skill-learning/`、`src/services/skillLearning/`、`src/hooks/useSkillImprovementSurvey.ts`（langfuse 相关）、`src/utils/hooks/skillImprovement.ts`。

**结论**：Phase 1 候选，删除 `skill-learning` 命令和服务。`skillImprovement.ts` 依赖 langfuse，如果 langfuse facade 化后可一并处理。

---

## 8. Swarm / Team / teammate（高风险）

**Swarm 引用文件数**：src/ 内 60+ 个文件，packages/builtin-tools 内 5 个文件。

**关键引用分布**：

| 类型 | 关键文件 |
|------|----------|
| REPL / UI | `REPL.tsx`（useInboxPoller、useSwarmInitialization、swarmBanner、setMemberActive）、`PromptInput/`、TeamsDialog、BackgroundTasksDialog |
| hooks | `useInboxPoller.ts`、`useSwarmInitialization.ts`、`useSwarmPermissionPoller.ts`、`useSwarmBanner.ts` |
| swarm utils | `swarm/teamHelpers.ts`、`swarm/permissionSync.ts`、`swarm/inProcessRunner.ts`、`swarm/spawnInProcess.ts` 等 |
| AgentTool | `AgentTool.tsx`（remote agent） |
| TeamCreateTool / TeamDeleteTool / SendMessageTool | packages/builtin-tools 内的 swarm 工具 |
| main/setup | `main.tsx`（--team-name option）、`setup.ts` |
| task tools | `TaskOutputTool`、`TaskUpdateTool`、`TodoWriteTool` 等 |

**结论**：Swarm 与 AgentTool/TeamCreateTool/TeamDeleteTool/SendMessageTool 强耦合，且被 REPL/UI 广泛引用。本轮暂不作为删除目标（Phase 4 决策矩阵中已标记为"删除"，但需与 AgentTool 协调处理）。暂时标记为**暂缓**。

---

## 9. 低风险 feature-gated 命令

| 模块 | 风险 | 引用文件 |
|------|------|----------|
| `src/commands/voice/` | 低 | `commands.ts`（feature-gated） |
| `src/hooks/useVoiceIntegration.tsx` | 低 | `useVoice.ts`、`REPL.tsx` |
| `src/components/LogoV2/VoiceModeNotice.tsx` | 低 | `LogoV2.tsx` |
| `src/commands/monitor.ts` | 低 | `commands.ts`（feature-gated） |
| `src/commands/workflows/` | 低 | `commands.ts`（feature-gated） |
| `src/commands/autonomy.ts` + `autonomy utils` | 中 | `commands.ts`、`cli/print.ts`、`query.ts`、`main.tsx`（CLI 子命令）、`proactive/useProactive.ts`、多个 hooks |

**voice/monitor/workflows 结论**：可进入 Phase 1，删除风险低。

**autonomy 结论**：引用较多（`query.ts`、`main.tsx` CLI 子命令、`proactive/useProactive.ts`），需要更多分析。暂标为**暂缓**，先分析 autonomy CLI 命令是否仍在用。

---

## 10. 三类清单汇总

### 可删除（低风险）

- `src/commands/voice/` 及相关 voice hook/UI
- `src/commands/monitor.ts`（feature-gated）
- `src/commands/workflows/`
- `src/components/LogoV2/VoiceModeNotice.tsx`

### facade 化（不能直接物理删除）

- `src/services/analytics/` — 保留最小 facade，压缩实现
- `src/utils/telemetry/` — 保留最小 facade，压缩实现
- `src/services/langfuse/` — 保留最小 facade，压缩实现
- `src/services/remoteManagedSettings/` — 保留最小 no-op
- `src/services/extractMemories/` — 保留最小 no-op
- `src/services/PromptSuggestion/` — 保留最小 no-op

### Phase 专项处理（高风险，需分阶段）

| Phase | 模块 | 策略 |
|-------|------|------|
| Phase 1 | `skill-learning`/`skill-search`/`skillLearning`/`skillSearch` | 删除命令和服务；保留 SearchExtraToolsTool 工具本身 |
| Phase 2 | Teleport cloud commands（11 个目录） | 删除目录 + 同步清理入口 |
| Phase 2 | `commands/review/reviewRemote.ts`、`commands/autofix-pr/` | 删除 remote teleport 路径 |
| Phase 3 | Plugins / Marketplace | 删除 marketplace/plugin hooks/MCP/LSP；保留 pluginIdentifier 类型 |
| Phase 4 | `utils/teleport.tsx`、`utils/teleport/` | 删除 after cloud commands |
| Phase 4 | workspace API（ultrareview/sessionIngress/referral 等） | 删除 after teleport |
| Phase 4 | `AgentTool.tsx` teleportToRemote import | 需决定如何处理 remote agent |
| Phase 5 | `teamMemorySync` | 先移除调用点，再删除 |
| Phase 6 | LSP plugin integration | 删除 `lspPluginIntegration.ts` 和相关引用 |
| Phase 7 | autoUpdater / nativeInstaller | facade → Doctor 改造 → 删除 |
| Phase 8 | analytics/telemetry/langfuse | 完整 facade 化 |

### 暂缓（需更多分析）

| 模块 | 原因 |
|------|------|
| Swarm / teammate | 与 AgentTool/TeamCreateTool/REPL 强耦合；需要整体决策 |
| Autonomy | `main.tsx` 有 CLI 子命令；`proactive/useProactive.ts` 引用；需确认是否仍在用 |
| `checkTeamMemSecrets`（FileEdit/FileWrite） | teamMemorySync 的前端 guard；需在 Phase 5 同步处理 |
| `AgentTool.tsx` teleportToRemote | remote agent 能力；需决定是否保留本地-only AgentTool |
| `tasks/RemoteAgentTask/` | remote agent task；需与 AgentTool 决策同步 |

---

## 11. 关键发现汇总

1. **analytics 是最大依赖**（438 引用）：不能物理删除，只能 facade 化。
2. **plugins 影响 MCP/LSP/REPL/BashTool**：Phase 3 是工程量最大阶段。
3. **Teleport 依赖链深**：删除顺序很重要（cloud commands → review/autofix → teleport utils → workspace API）。
4. **Swarm 被 REPL 广泛引用**：暂缓。
5. **AgentTool 依赖 Teleport**：需要单独决定 remote agent 路径。
6. **teamMemorySync 引用在 FileEditTool/FileWriteTool**：需要同步在 Phase 5 处理。
7. **multiStore 是本地功能**：不是云端 memory store，保留。
8. **SearchExtraToolsTool 是独立工具**：不依赖 skillLearning/skillSearch，保留工具本身。

---

## 12. Phase 1A 执行记录

### 实际删除/确认已删除

- `src/commands/voice/index.ts`
- `src/commands/voice/voice.ts`
- `src/hooks/useVoiceIntegration.tsx`
- `src/components/LogoV2/VoiceModeNotice.tsx`
- `src/commands/monitor.ts`
- `src/commands/workflows/index.ts`

### 同步改造

- `src/commands.ts`
  - `voiceCommand = null`
  - `monitorCmd = null`
  - `workflowsCmd = null`
- `src/components/LogoV2/LogoV2.tsx`
  - 移除 `VoiceModeNotice` import 与渲染点
- `src/screens/REPL.tsx`
  - 将 `useVoiceIntegration` / `VoiceKeybindingHandler` 改为本地 no-op shim，避免引用已删除 hook

### 引用检查

以下路径无剩余 import/require：

```bash
rg "from ['\"].*(commands/voice|commands/monitor|commands/workflows|useVoiceIntegration|VoiceModeNotice)|require\(['\"].*(commands/voice|commands/monitor|commands/workflows|useVoiceIntegration|VoiceModeNotice)" src packages -g '*.ts' -g '*.tsx'
```

### 验证结果

- `bun run typecheck` ✅
- `bun run build` ✅（878 bundled files）
- `bun test` ✅（4558 pass）
- `bun run check:unused` ⚠️ 未通过，失败原因是 `knip-bun` 子进程提示 `bun is not installed in %PATH%`，属于当前 shell/PATH 环境问题，不是代码错误。

---

## 13. Phase 1B 执行记录

### 先拆入口/工具注册

- `src/commands.ts`
  - 移除 `/skill-learning`、`/skill-search` 的动态 command 入口。
  - 移除 `skillSearch/localSearch` 的 cache invalidation 依赖。
- `src/tools.ts`
  - 移除 `DiscoverSkillsTool` feature-gated 注册。
- `src/setup.ts`
  - 移除 `initSkillLearning()` 启动 hook。
- `src/services/tools/toolExecution.ts`
  - 移除 skill-learning tool execution wrapper，工具调用恢复为直接执行。
- `src/query.ts` / `src/utils/attachments.ts`
  - 移除 skill discovery prefetch / turn-zero discovery 入口。
- `packages/builtin-tools/src/tools/SkillTool/SkillTool.ts`
  - 移除 remote canonical skill / discovered remote skill 分支。

### 物理删除

- `src/commands/skill-learning/`
- `src/services/skillLearning/`
- `src/commands/skill-search/`
- `src/services/skillSearch/`
- `packages/builtin-tools/src/tools/DiscoverSkillsTool/`

### SearchExtraTools 保留处理

`SearchExtraToolsTool` 按 Phase 1C 决策保留。为避免继续依赖被删除的 `skillSearch` 服务，迁移共享逻辑：

- 新增 `src/services/searchExtraTools/searchMath.ts`
  - `tokenize` / `tokenizeAndStem` / `computeWeightedTf` / `computeIdf` / `cosineSimilarity`
- 新增 `src/services/searchExtraTools/extractQuery.ts`
  - `extractQueryFromMessages`
- 更新 `src/services/searchExtraTools/toolIndex.ts`、`prefetch.ts` 及相关测试引用。

### 验证结果

- `bun run typecheck` ✅
- `bun run build` ✅（835 bundled files）
- `bun test` ✅（4414 pass）
- `bun run lint` ✅
- `bun run check:unused` ⚠️ 未通过，仍为当前 shell/PATH 环境问题：`knip-bun` 子进程提示 `bun is not installed in %PATH%`。

---

## 14. Core-1 / Core-2 / Core-3 执行记录

### Core-1：Core commands 白名单

新增：

- `src/core/commands/coreCommandNames.ts`
- `src/core/commands/coreCommands.ts`

改造：

- `src/commands.ts`
  - personal-local 过滤逻辑改为调用 `filterToCoreCommands()`；
  - `loadAllCommands()` 在 personal-local profile 下直接返回 Core 白名单命令。

### Core-2：Core tools 白名单

新增：

- `src/core/tools/coreToolNames.ts`
- `src/core/tools/coreTools.ts`

改造：

- `src/tools.ts`
  - `getLocalPersonalTools()` 改为调用 `getCoreTools()`，不再在 `tools.ts` 内硬编码列表。

### Core-3：边界检查脚本

新增：

- `scripts/check-core-boundaries.ts`

改造：

- `package.json`
  - 新增脚本：`check:boundaries`

说明：当前脚本检查 `src/core/**/*.{ts,tsx}` 是否 import/require/dynamic import 到禁止的 legacy 功能域。

---

## 15. check:unused 环境与未使用文件处理

### 环境修复

`check:unused` 已从 `knip-bun` 可执行包装改为直接调用：

```bash
bun node_modules/knip/bin/knip-bun.js ...
```

避免了 `knip-bun.exe` 在当前 shell 下误判 `%PATH%` 缺少 `bun.exe` 的问题。

### 本轮处理的 4 个 unused

按文档边界计划处理：

- 删除 voice 相关残留（Phase 1A 已删除 voice 命令/入口后继续清理）
  - `src/hooks/useVoice.ts`
  - `src/services/doubaoSTT.ts`
  - `src/services/voiceKeyterms.ts`
- `src/core/tools/coreToolNames.ts` 保留并接入
  - 在 `src/core/tools/coreTools.ts` 中引入 `CORE_TOOL_NAMES`，新增 `getCoreToolNames()` 导出，避免孤立文件。

### 验证

- `bun run typecheck` ✅
- `bun run check:unused` ✅
- `bun run lint` ✅
- `bun run build` ✅

---

## 16. Core-4 执行记录（Core Runtime profile 壳）

### 新增 Runtime 壳

- `src/core/runtime/types.ts`
  - 定义 `RuntimeProfile`（`core-local` / `legacy-full`）
  - 定义 `CoreRuntimeShell` 结构（profile、command/tool names、provider allowlist）
- `src/core/runtime/createCoreRuntime.ts`
  - `resolveRuntimeProfile()`
  - `isCoreLocalRuntimeProfile()`
  - `createCoreRuntime()`
  - `CORE_RUNTIME_PROVIDERS`（`firstParty` + `openai`）

### 接入点改造

- `src/commands.ts`
  - 使用 `createCoreRuntime()` 生成 runtime 壳
  - `personalLocalCommandTrimmed` 改为基于 `coreRuntime.isCoreLocal`
- `src/tools.ts`
  - 使用 `isCoreLocalRuntimeProfile()` 判断 core-local 主路径
  - `getAllBaseTools()` / `getTools()` 的 personal-local 判定改为 runtime profile 判定

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（src/core 6 files checked）
- `bun run build` ✅
- `bun test` ✅（4414 pass）
- `bun run check:unused` ✅
- `bun run lint` ✅

---

## 17. Core-5 执行记录（切换 personal-local REPL/query 主路径）

### 新增 runtime pools 适配层

新增：

- `src/core/runtime/pools.ts`
  - `getRuntimeCommands(cwd)`
  - `getRuntimeTools(permissionContext)`

行为：

- `legacy-full`：透传现有 `getCommands` / `getTools`
- `core-local`：
  - commands 经过 `filterToCoreCommands`
  - tools 经过 `CORE_TOOL_NAMES` 白名单过滤

### 接入点改造

- `src/main.tsx`
  - `getTools()` -> `getRuntimeTools()`
  - `getCommands()` -> `getRuntimeCommands()`（startup 并行加载与后续 join 均替换）
- `src/screens/REPL.tsx`
  - `localTools` 改为通过 `getRuntimeTools()` 获取
- `src/cli/print.ts`
  - headless/print 路径的命令重载与命令获取改为 `getRuntimeCommands()`

### 结果

personal-local 的 REPL 与 query（interactive + print/headless）主路径已经不再直接调用旧 `getCommands/getTools` 入口，而由 runtime pool adapter 统一路由。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（src/core 7 files checked）
- `bun run build` ✅
- `bun test` ✅（4414 pass）
- `bun run check:unused` ✅
- `bun run lint` ✅

---

## 18. Core-6 执行记录（第一批：auth/providers/mcp service adapters）

### 新增 core service adapters

- `src/core/auth/coreAuth.ts`
  - 收敛 Core 路径使用的 auth 能力导出（账户信息、订阅判断、OAuth token 读取、云凭据预取等）。
- `src/core/providers/coreProviders.ts`
  - 提供 `CoreAPIProvider` / `getCoreAPIProvider()`（firstParty + openai）和 `isFirstPartyAnthropicBaseUrl`。
- `src/core/mcp/coreMcpClient.ts`
  - 收敛 MCP client 侧核心导出（connect/cache/reconnect/tools fetch/setup）。
- `src/core/mcp/coreMcpConfig.ts`
  - 收敛 MCP config 侧核心导出（读取/解析/策略过滤/启停/enterprise gating）。

### 第一批调用点切换（Core 入口优先）

- `src/commands.ts`
  - auth/provider 基础判断改为从 `core/auth`、`core/providers` 引入。
- `src/main.tsx`
  - auth 导入改为 `core/auth`；
  - mcp client/config 导入改为 `core/mcp` adapters；
  - 动态 token 读取导入切到 `core/auth`。
- `src/cli/print.ts`
  - `getAccountInformation`、`getAPIProvider`、MCP client/config 调用改为 `core/*` adapters。
- `src/core/runtime/types.ts`
  - `CoreRuntimeProvider` 类型改为依赖 `core/providers` 的 `CoreAPIProvider`，避免 runtime 类型层回连 legacy provider 类型。

### 说明

- 本批是“先建边界 + 切 Core 入口”的 service layering 第一步，底层实现仍由 legacy 模块承载（通过 adapter 单向转发）。
- `query.ts` 与 `services/api/claude.ts` 暂不切到 provider/auth adapter，以避免影响 legacy-full 下的完整 provider 联合类型判定（bedrock/vertex/foundry/gemini/grok）。

### 验证

- `bun run typecheck` ✅

---

## 19. Core-6 执行记录（第二批：query/api 路径切换到 runtime-aware adapters）

### 变更目标

在不破坏 `legacy-full` provider 联合类型判定（如 bedrock 分支）的前提下，将 `query.ts` 与 `services/api/claude.ts` 从 legacy 直连切到 `src/core/*` adapter。

### 关键改造

- `src/core/providers/coreProviders.ts`
  - 新增 `getRuntimeAPIProvider()`，返回完整 `APIProvider` 联合（runtime-aware passthrough）。
  - 保留 `getCoreAPIProvider()`（core-local 窄联合：firstParty/openai）。
- `src/query.ts`
  - provider 获取改为 `getRuntimeAPIProvider`（经 `core/providers` 入口）。
- `src/services/api/claude.ts`
  - provider 导入改为 `core/providers`（使用 runtime-aware 版本）。
  - auth 导入改为 `core/auth`（`getOauthAccountInfo`、`isClaudeAISubscriber`）。

### 结果

- query/API 主路径已通过 core adapters 进入 provider/auth 子域；
- 仍保持 legacy-full 场景下的完整 provider 类型分支可用；
- 未引入新的类型回归。

### 验证

- `bun run typecheck` ✅

---

## 20. Core-6 执行记录（第三批：MCP 调用面继续收口）

### 目标

将 `main/print` 之外仍直接依赖 `services/mcp/client|config` 的调用点继续收口到 `src/core/mcp/*` adapters。

### adapter 扩展

- `src/core/mcp/coreMcpClient.ts`
  - 新增导出：`getMcpServerConnectionBatchSize`、`callIdeRpc`
  - 新增类型导出：`MCPResultType`
- `src/core/mcp/coreMcpConfig.ts`
  - 新增导出：`addMcpConfig`、`removeMcpConfig`、`getMcpConfigsByScope`

### 调用点切换（第三批）

- `src/utils/api.ts`
- `src/utils/ide.ts`
- `src/utils/mcpOutputStorage.ts`
- `src/services/diagnosticTracking.ts`
- `src/components/TrustDialog/TrustDialog.tsx`
- `src/components/MCPServerDesktopImportDialog.tsx`
- `src/components/mcp/MCPStdioServerMenu.tsx`
- `src/components/mcp/MCPRemoteServerMenu.tsx`
- `src/components/mcp/McpParsingWarnings.tsx`
- `src/components/LogoV2/ChannelsNotice.tsx`
- `src/utils/settings/allErrors.ts`
- `src/commands/ide/ide.tsx`
- `src/cli/handlers/mcp.tsx`
- `src/commands/mcp/addCommand.ts`

以上文件已改为通过 `core/mcp/coreMcpClient` 或 `core/mcp/coreMcpConfig` 访问 MCP 能力。

### 当前状态

`src/` 内对 `services/mcp/client|config` 的直接引用已收敛为：

- `src/core/mcp/*` adapters（预期）
- `src/services/mcp/useManageMCPConnections.ts`（MCP service 内部实现，暂保留）

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

---

## 21. Core-6 执行记录（第四批：MCP 外部调用面再压一层）

### 目标

- 清理 `src/services/mcp/useManageMCPConnections.ts` 的非必要“自引用绝对路径”入口；
- 将 MCP 的外部调用面从 `services/mcp/*` 进一步收口到 `src/core/mcp/*` adapters（不仅限 client/config，也覆盖 auth/utils/claudeai/string-utils 相关能力）。

### 关键改造

1) `useManageMCPConnections` 内部入口清理

- `src/services/mcp/useManageMCPConnections.ts`
  - 将 `from 'src/services/mcp/config.js'` 改为 `from './config.js'`，避免 service 内部绕行绝对路径，保持域内依赖清晰。

2) 新增/扩展 core MCP adapters

- 新增：`src/core/mcp/coreMcpAuth.ts`
  - 统一导出 MCP auth 能力（OAuth flow、token revoke、client config / secret 管理等）。
- 新增：`src/core/mcp/coreMcpUtils.ts`
  - 统一导出 MCP utils + mcpStringUtils 常用能力（server 过滤、scope/path 描述、tool 名解析、permission 相关等）。
- 新增：`src/core/mcp/coreMcpClaudeai.ts`
  - 统一导出 claude.ai MCP 配置相关能力。
- 扩展：`src/core/mcp/coreMcpClient.ts`
  - 补齐 `callIdeRpc` / `getMcpServerConnectionBatchSize` / `MCPResultType` 导出。
- 扩展：`src/core/mcp/coreMcpConfig.ts`
  - 补齐 `addMcpConfig/removeMcpConfig/getMcpConfigsByScope` 等导出。

3) 外部调用面切换到 core adapters（第四批）

- CLI/commands:
  - `src/cli/handlers/mcp.tsx`
  - `src/commands/mcp/addCommand.ts`
  - `src/main.tsx`
  - `src/cli/print.ts`
- MCP UI/components:
  - `src/components/mcp/MCPSettings.tsx`
  - `src/components/mcp/MCPRemoteServerMenu.tsx`
  - `src/components/mcp/MCPAgentServerMenu.tsx`
  - `src/components/mcp/MCPStdioServerMenu.tsx`
  - `src/components/mcp/MCPListPanel.tsx`
  - `src/components/mcp/MCPToolListView.tsx`
  - `src/components/mcp/MCPToolDetailView.tsx`
  - `src/components/mcp/McpParsingWarnings.tsx`
- 其他外部消费点:
  - `src/hooks/notifs/useMcpConnectivityStatus.tsx`
  - `src/utils/toolPool.ts`
  - `src/components/agents/ToolSelector.tsx`
  - `src/utils/attachments.ts`
  - `src/utils/settings/permissionValidation.ts`
  - `src/utils/permissions/permissions.ts`
  - `src/commands/plugin/ManagePlugins.tsx`

### 当前状态

`src/` 内 `services/mcp/(client|config|auth|utils|mcpStringUtils|claudeai)` 的直接引用已基本收敛到：

- `src/core/mcp/*` adapters（预期）
- `src/services/mcp/*` 域内实现文件（预期）

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

---

## 22. Core-6 执行记录（第五批：MCP adapters 轻度 runtime-aware facade）

### 目标

将 `core/mcp` 从“纯转发导出”推进到“轻度 runtime-aware facade”，先在不破坏 legacy-full 的前提下，把 core-local 的 MCP 边界策略前置到 adapter 层。

### 关键改造

1) `coreMcpConfig` 增加 runtime-aware 入口

- `src/core/mcp/coreMcpConfig.ts`
  - 新增 `getRuntimeAllMcpConfigs()`：
    - `core-local`：走 `getClaudeCodeMcpConfigs()`（本地/手动 MCP 主路径）
    - `legacy-full`：走 `getAllMcpConfigs()`（保留完整历史行为）

2) `coreMcpClaudeai` 增加 runtime-aware 入口

- `src/core/mcp/coreMcpClaudeai.ts`
  - 新增 `fetchRuntimeClaudeAIMcpConfigsIfEligible()`：
    - `core-local`：直接返回 `{}`（跳过远端 claude.ai connector 发现）
    - `legacy-full`：透传原有 `fetchClaudeAIMcpConfigsIfEligible()`

3) 调用点切换到 runtime-aware facade

- `src/main.tsx`
  - claude.ai MCP connector 预取改为 `fetchRuntimeClaudeAIMcpConfigsIfEligible()`
- `src/cli/print.ts`
  - SDK MCP server 刷新路径改为 `getRuntimeAllMcpConfigs()`

### 结果

- `core/mcp` 已开始承载 profile-aware 策略，不再只是被动 re-export；
- core-local 路径对远端 connector 的依赖进一步收敛；
- legacy-full 行为保持不变。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

---

## 23. Core-6 执行记录（第六批：useManageMCPConnections 与 runtime profile 对齐）

### 目标

将 `useManageMCPConnections` 的 MCP 加载流程接入 runtime-aware adapter，使连接管理行为与 runtime profile（core-local / legacy-full）一致。

### 改造点

1) Hook 引入 runtime profile 判定

- `src/services/mcp/useManageMCPConnections.ts`
  - 引入 `isCoreLocalRuntimeProfile()`，在 hook 内计算 `isCoreLocalProfile`。

2) claude.ai connector 加载分支 runtime-aware 化

- 旧逻辑：在非 strict / 非 enterprise 时总是走 `fetchClaudeAIMcpConfigsIfEligible()`。
- 新逻辑：
  - `core-local`：直接将 `claudeaiPromise` 置为 `{}`（跳过远端 connector 加载）
  - 其他 profile：走 `fetchRuntimeClaudeAIMcpConfigsIfEligible()`

3) Phase-2 连接流程与 profile 对齐

- `if (!isStrictMcpConfig)` 分支改为 `if (!isStrictMcpConfig && !isCoreLocalProfile)`。
- 结果：core-local 下不再执行 claude.ai connector 的 policy filter / dedup / pending 注入 / connect 逻辑。

4) 依赖项同步

- 将 `isCoreLocalProfile` 加入相关 effect dependency，保证 profile 变化时流程重算。

### 结果

- `useManageMCPConnections` 已与 runtime-aware MCP 策略闭环：
  - core-local：仅本地/手动 MCP 主路径；
  - legacy-full：保持原两阶段（Claude Code + claude.ai connector）行为。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

---

## 24. Core-6 执行记录（第七批：MCPConnectionManager 调用链 runtime-aware 对齐）

### 目标

在第六批 `useManageMCPConnections` 已 profile-aware 的基础上，将 `MCPConnectionManager` 及其外部调用链统一收口到 `src/core/mcp/*` 入口，完成连接管理链路的 Core 化对齐。

### 关键改造

1) 新增 core adapter：connection manager 入口

- `src/core/mcp/coreMcpConnectionManager.ts`
  - 导出：`MCPConnectionManager` / `useMcpReconnect` / `useMcpToggleEnabled`
  - 由 core 入口统一转发到 `services/mcp/MCPConnectionManager`。

2) MCPConnectionManager 调用链改为走 core 入口

- `src/screens/REPL.tsx`
- `src/cli/handlers/util.tsx`
- `src/components/mcp/MCPRemoteServerMenu.tsx`
- `src/components/mcp/MCPStdioServerMenu.tsx`
- `src/components/mcp/MCPReconnect.tsx`
- `src/commands/mcp/mcp.tsx`
- `src/commands/plugin/ManagePlugins.tsx`

上述文件中的 `services/mcp/MCPConnectionManager` 依赖已切换为 `core/mcp/coreMcpConnectionManager`。

3) 与第六批形成闭环

- 第六批已将 `useManageMCPConnections` 的 claude.ai connector 加载流程变为 runtime-aware；
- 本批将其调用链入口（manager + hooks）统一 Core 化，确保 UI 侧重连/启停/连接管理路径与 runtime profile 策略保持一致。

### 当前状态

- `src/` 外部调用面已不再直接 import `services/mcp/MCPConnectionManager`；
- 唯一保留引用位于 `src/core/mcp/coreMcpConnectionManager.ts`（预期）。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

---

## 25. Core-6 收尾清单（P0/P1）

> 目标：在不扩大风险的前提下，完成 Core-6 的“可收口范围”。
> 判定口径：优先保证 **core-local 主路径** 完整走 `src/core/*`；对明确将于后续 Legacy 阶段删除的路径不做过度迁移。

### 完成判定（当前）

- ✅ core-local 主路径（main/query/print/REPL + MCP manager 调用链）已基本收口到 `src/core/{auth,providers,mcp}/*`。
- ✅ `check:boundaries` 持续通过。
- ⚠️ 全仓库仍有大量 `utils/auth` / `utils/model/providers` 直连，主要分布在 legacy/cloud/enterprise/plugin 及外围模块。

---

### P0（Core-6 必收尾）

这些项应继续迁移到 `src/core/*` adapter，确保核心运行路径和高频本地交互路径不回流到 legacy 入口。

1) 交互/入口周边（高优先）

- `src/cli/handlers/auth.ts`
- `src/cli/handlers/util.tsx`（除已切 MCP manager 外的 auth 依赖）
- `src/hooks/useApiKeyVerification.ts`
- `src/hooks/notifs/useRateLimitWarningNotification.tsx`
- `src/hooks/notifs/useCanSwitchToExistingSubscription.tsx`
- `src/components/Settings/Usage.tsx`
- `src/components/PromptInput/Notifications.tsx`
- `src/components/messages/RateLimitMessage.tsx`
- `src/components/ConsoleOAuthFlow.tsx`

2) 核心 API 与策略周边（高优先）

- `src/services/api/client.ts`
- `src/services/api/bootstrap.ts`
- `src/services/api/errors.ts`
- `src/services/api/withRetry.ts`
- `src/services/api/usage.ts`
- `src/services/policyLimits/index.ts`
- `src/services/rateLimitMessages.ts`
- `src/services/tokenEstimation.ts`
- `src/services/claudeAiLimits.ts`

3) 核心命令（保留域内）

- `src/commands/provider.ts`
- `src/commands/login/*`（保留的本地登录路径）
- `src/commands/logout/logout.tsx`
- `src/commands/upgrade/*`（若仍属保留能力）
- `src/commands/extra-usage/*`（若仍属保留能力）
- `src/commands/rate-limit-options/*`（若仍属保留能力）

4) MCP 邻接仍可收口点

- `src/services/mcp/channelNotification.ts`（订阅信息读取）
- 与 core-local 强相关的 MCP 展示/权限辅助路径，继续优先走 `core/mcp/*` facade

---

### P1（Core-6 建议收尾）

这些项建议在 P0 完成后推进；若对应功能将在 Legacy 绞杀阶段删除，可降级为“延后删除”。

1) migrations（低运行频率但应统一入口）

- `src/migrations/resetProToOpusDefault.ts`
- `src/migrations/migrateSonnet45ToSonnet46.ts`
- `src/migrations/migrateLegacyOpusToCurrent.ts`

2) 边缘服务/体验模块

- `src/services/tips/tipRegistry.ts`
- `src/services/awaySummary.ts`
- `src/components/EffortCallout.tsx`
- `src/state/onChangeAppState.ts`

3) OAuth service 内部耦合整理（谨慎）

- `src/services/oauth/client.ts`
- `src/services/oauth/getOauthProfile.ts`

> 说明：OAuth 内核涉及 token refresh / lock / keychain / CI / bare mode，属于高耦合区域。P1 阶段以“入口收口”为主，不做大规模语义改写。

---

### 明确不纳入 Core-6 收尾（进入 Legacy 阶段处理）

以下路径以“后续删除/绞杀”为主，不在 Core-6 做全面迁移，避免无效工程量：

- Teleport / Workspace cloud / remote env / agents-platform / share / schedule / vault / memory-stores / skill-store
- Plugin / Marketplace 深度路径（含 plugin runtime 市场逻辑）
- teamMemorySync / swarm / teammate / remote review / autonomy 云分支
- install-github-app / install-slack-app / nativeInstaller / autoUpdater

---

### 收尾验收标准（Core-6 关闭前）

1) 质量门禁

- `bun run typecheck` ✅
- `bun run build` ✅
- `bun test` ✅
- `bun run check:boundaries` ✅

2) 入口收口检查

- `rg "utils/auth\.js|utils/model/providers\.js" src/core src/main.tsx src/query.ts src/cli/print.ts src/screens/REPL.tsx -n`
  - 期望：核心入口与 core 目录不再出现 legacy 直连（core adapter 内转发除外）

3) MCP 收口检查

- `rg "services/mcp/(client|config|auth|utils|mcpStringUtils|claudeai|MCPConnectionManager)\.js" src -n`
  - 期望：外部调用面仅保留 `src/core/mcp/*`；`services/mcp/*` 仅域内实现或 core adapter 转发。

---

### 执行建议

- 按 P0 分 2~3 个小批次完成（每批跑门禁并记录）
- P1 视 Legacy 删除顺序决定“迁移”还是“直接等待删除”
- 每次批次完成后更新本文件对应章节与通过结果

---

## 26. Core-6 P0 推进记录（批次 A：auth/providers 入口收口）

### 本批目标

按 P0 收尾清单先处理“核心交互/入口周边”的低风险入口收口，将 auth/providers 的外部消费优先切到 `src/core/*`。

### 本批改动

1) 扩展 core auth facade

- `src/core/auth/coreAuth.ts`
  - 新增导出：
    - `isAnthropicAuthEnabled`
    - `getAnthropicApiKeyWithSource`
    - `getApiKeyFromApiKeyHelper`
    - `getAuthTokenSource`
    - `saveOAuthTokensIfNeeded`
    - `clearOAuthTokenCache`
  - 使 auth 相关入口可在不回连 `utils/auth` 的前提下迁移。

2) 调用点迁移到 core adapters

- `src/cli/handlers/auth.ts`
  - auth 导入：`utils/auth` → `core/auth/coreAuth`
  - provider 导入：`utils/model/providers` → `core/providers/coreProviders`（runtime-aware）
- `src/hooks/useApiKeyVerification.ts`
  - auth 导入切到 `core/auth/coreAuth`
- `src/hooks/notifs/useRateLimitWarningNotification.tsx`
  - `getSubscriptionType` 导入切到 `core/auth/coreAuth`
- `src/hooks/notifs/useCanSwitchToExistingSubscription.tsx`
  - `isClaudeAISubscriber` 导入切到 `core/auth/coreAuth`
- `src/components/Settings/Usage.tsx`
  - `getSubscriptionType` 导入切到 `core/auth/coreAuth`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

### 下一批建议（P0 批次 B）

继续推进 P0 清单中的核心 API/策略周边：

- `src/services/api/client.ts`
- `src/services/api/bootstrap.ts`
- `src/services/api/errors.ts`
- `src/services/api/withRetry.ts`
- `src/services/api/usage.ts`
- `src/services/policyLimits/index.ts`
- `src/services/rateLimitMessages.ts`
- `src/services/tokenEstimation.ts`
- `src/services/claudeAiLimits.ts`

---

## 27. Core-6 P0 推进记录（批次 B：核心 API/策略周边收口）

### 本批目标

推进 P0 清单中“核心 API 与策略周边”模块的 auth/providers 入口迁移，降低核心服务对 `utils/auth` 与 `utils/model/providers` 的直接依赖。

### 本批改动

1) 扩展 core adapters 能力

- `src/core/auth/coreAuth.ts`
  - 新增导出：
    - `checkAndRefreshOAuthTokenIfNeeded`
    - `clearApiKeyHelperCache`
    - `clearAwsCredentialsCache`
    - `clearGcpCredentialsCache`
    - `getAnthropicApiKey`
    - `hasProfileScope`
    - `isEnterpriseSubscriber`
    - `isOverageProvisioningAllowed`
    - `handleOAuth401Error`
- `src/core/providers/coreProviders.ts`
  - 新增导出：`getAPIProviderForStatsig`

2) 核心 API/策略文件迁移

- `src/services/api/client.ts`
  - auth -> `core/auth`
  - provider -> `core/providers`（runtime-aware）
- `src/services/api/bootstrap.ts`
  - auth -> `core/auth`
  - provider -> `core/providers`（runtime-aware）
- `src/services/api/errors.ts`
  - auth -> `core/auth`
  - provider -> `core/providers`（runtime-aware）
- `src/services/api/withRetry.ts`
  - auth -> `core/auth`
  - provider -> `core/providers`（runtime-aware + statsig helper）
- `src/services/api/usage.ts`
  - auth -> `core/auth`
- `src/services/policyLimits/index.ts`
  - auth -> `core/auth`
  - provider -> `core/providers`（runtime-aware）
- `src/services/rateLimitMessages.ts`
  - auth -> `core/auth`
- `src/services/tokenEstimation.ts`
  - provider -> `core/providers`（runtime-aware）
- `src/services/claudeAiLimits.ts`
  - auth -> `core/auth`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

### 下一批建议（P0 批次 C）

继续推进 P0 清单剩余“核心命令 + 交互周边”：

- `src/components/PromptInput/Notifications.tsx`
- `src/components/messages/RateLimitMessage.tsx`
- `src/components/ConsoleOAuthFlow.tsx`
- `src/commands/provider.ts`
- `src/commands/login/*`
- `src/commands/logout/logout.tsx`
- `src/commands/upgrade/*`
- `src/commands/extra-usage/*`
- `src/commands/rate-limit-options/*`

---

## 28. Core-6 P0 推进记录（批次 C：核心命令 + 交互周边收口）

### 本批目标

推进 P0 清单剩余“核心命令与交互周边”模块，将 auth/providers 依赖迁移到 `src/core/*` facade。

### 本批改动

1) 扩展 core auth facade（补齐命令/交互所需能力）

- `src/core/auth/coreAuth.ts`
  - 新增导出：
    - `getApiKeyHelperElapsedMs`
    - `getConfiguredApiKeyHelper`
    - `getRateLimitTier`
    - `hasAnthropicApiKeyAuth`
    - `removeApiKey`

2) 交互组件迁移

- `src/components/PromptInput/Notifications.tsx`
- `src/components/messages/RateLimitMessage.tsx`
- `src/components/ConsoleOAuthFlow.tsx`

以上文件的 auth 导入均已改为 `src/core/auth/coreAuth`。

3) 核心命令迁移

- `src/commands/provider.ts`
  - provider 导入改为 `core/providers`（runtime-aware）
- `src/commands/login/index.ts`
- `src/commands/login/getAuthStatus.ts`
- `src/commands/logout/logout.tsx`
- `src/commands/upgrade/index.ts`
- `src/commands/upgrade/upgrade.tsx`
- `src/commands/extra-usage/index.ts`
- `src/commands/extra-usage/extra-usage-core.ts`
- `src/commands/rate-limit-options/index.ts`
- `src/commands/rate-limit-options/rate-limit-options.tsx`

以上命令文件的 auth/provider 导入均已迁移到 `src/core/*` facade。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

### P0 状态更新

P0 批次 A/B/C 已连续完成。下一步建议做一次聚合核查（入口收口 grep + MCP 收口 grep + build/test），并更新 Core-6 关闭判定。

---

## 29. Core-6 收尾记录（严格完成 P0 + P1 剩余项）

### 本批目标

按“严格完成 P0 + P1”要求，清理收尾清单中的所有剩余 auth/providers 直连点，并继续将 MCP 邻接点收口到 core facade。

### 本批改动

1) 扩展 core auth facade（补齐 P1 模块所需导出）

- `src/core/auth/coreAuth.ts`
  - 新增导出：
    - `is1PApiCustomer`
    - `isMaxSubscriber`
    - `isProSubscriber`
    - `isTeamPremiumSubscriber`
    - `isTeamSubscriber`
    - `saveApiKey`

2) 完成 P0 剩余

- `src/cli/handlers/util.tsx`
  - `isAnthropicAuthEnabled` 导入迁移到 `src/core/auth/coreAuth`
- `src/services/mcp/channelNotification.ts`
  - `getSubscriptionType` 导入迁移到 `src/core/auth/coreAuth`

3) 完成 P1 剩余

- migrations
  - `src/migrations/resetProToOpusDefault.ts`
    - auth/provider 导入迁移到 `src/core/auth` / `src/core/providers`
  - `src/migrations/migrateSonnet45ToSonnet46.ts`
    - auth/provider 导入迁移到 `src/core/auth` / `src/core/providers`
  - `src/migrations/migrateLegacyOpusToCurrent.ts`
    - provider 导入迁移到 `src/core/providers`
- 边缘服务/体验模块
  - `src/services/tips/tipRegistry.ts`（auth -> core/auth）
  - `src/services/awaySummary.ts`（provider -> core/providers runtime-aware）
  - `src/components/EffortCallout.tsx`（auth -> core/auth）
  - `src/state/onChangeAppState.ts`（auth -> core/auth）
- OAuth service 内部耦合整理（入口收口）
  - `src/services/oauth/client.ts`（auth -> core/auth）
  - `src/services/oauth/getOauthProfile.ts`（auth -> core/auth）

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 收口核查（P0/P1目标文件）

对以下范围执行：

- `src/cli/handlers/util.tsx`
- `src/services/mcp/channelNotification.ts`
- `src/migrations/*`（P1 三个文件）
- `src/services/tips/tipRegistry.ts`
- `src/services/awaySummary.ts`
- `src/components/EffortCallout.tsx`
- `src/state/onChangeAppState.ts`
- `src/services/oauth/client.ts`
- `src/services/oauth/getOauthProfile.ts`

`rg "utils/auth\.js|utils/model/providers\.js" ...` 结果为 0 命中（目标范围内）。

### 结论

按“严格 P0 + P1”口径，Core-6 清单已全部完成，可进入 Core-6 关闭判定与后续 Legacy 绞杀阶段。

---

## 30. Core-7 Batch 1（Teleport/cloud）- A段：入口绞杀（先断注册）

### 本批目标

先执行 legacy 绞杀的“入口切断”步骤：在命令注册层移除 Teleport/cloud 相关命令，确保运行时不再暴露这些能力。

### 本批改动

- 文件：`src/commands.ts`
- 移除以下命令的 lazy require 与注册注入：
  - `remote-setup` (`webCmd`)
  - `desktop`
  - `install-github-app`
  - `install-slack-app`
  - `mobile`
  - `share`
  - `teleport`
  - `schedule` (`triggers`)
  - `memory-stores`
  - `skill-store`
  - `vault`
  - `agents-platform`
  - `remote-env`
- 同步清理 `REMOTE_SAFE_COMMANDS` 中的 `mobile` 项。

> 说明：本批是 Core-7 的入口绞杀 A 段，先“移除对外入口”，目录物理删除放在后续 B 段执行（以降低一次性破坏面）。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 下一步（Batch 1 B段）

- 对本批已断入口的命令目录进行物理删除与引用清理：
  - `src/commands/teleport/`
  - `src/commands/remote-setup/`
  - `src/commands/remote-env/`
  - `src/commands/agents-platform/`
  - `src/commands/schedule/`
  - `src/commands/memory-stores/`
  - `src/commands/skill-store/`
  - `src/commands/vault/`
  - `src/commands/install-github-app/`
  - `src/commands/install-slack-app/`
  - `src/commands/mobile/`
  - `src/commands/desktop/`
  - `src/commands/share/`
- 同步清理对应测试与残余文案引用。

## 31. Core-7 Batch 1（Teleport/cloud）- B段：物理删除目录 + 引用清理

### 本批目标

在 Batch 1 A段完成“入口断开”后，执行物理删除与最小必要引用修复，完成 Teleport/cloud 命令域的第一轮绞杀。

### 物理删除目录

已删除：

- `src/commands/teleport/`
- `src/commands/remote-setup/`
- `src/commands/remote-env/`
- `src/commands/agents-platform/`
- `src/commands/schedule/`
- `src/commands/memory-stores/`
- `src/commands/skill-store/`
- `src/commands/vault/`
- `src/commands/install-github-app/`
- `src/commands/install-slack-app/`
- `src/commands/mobile/`
- `src/commands/desktop/`
- `src/commands/share/`

### 引用清理（本批最小修复）

- `src/components/WorkflowMultiselectDialog.tsx`
  - 删除对已删路径 `../commands/install-github-app/types.js` 的类型依赖。
  - 本地内联 `Workflow` 联合类型：`'claude' | 'claude-review'`。

> 说明：其余 teleport utils / remote review 相关引用仍存在于 legacy 其他域（review/autofix/remote session 路径），不在 Batch 1 范围内，留待 Core-7 后续批次（按依赖图逐段绞杀）。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Core-7 Batch 1（Teleport/cloud）A+B 已完成：
- 外部命令入口已移除；
- 对应命令目录已物理删除；
- 项目门禁通过。

## 32. Core-7 Batch 2（Plugins/Marketplace）- A段：入口切断

### 本批目标

先切断 Plugins/Marketplace 的命令入口与运行期命令注入入口，避免 legacy plugin surface 再次进入主命令集。

### 本批改动

- 文件：`src/commands.ts`

1) 命令入口切断

- `plugin` 命令改为恒定 `null`（不再根据 profile 懒加载）
- `reload-plugins` 命令改为恒定 `null`

2) 运行期命令注入切断

- `getSkills()`：去掉 plugin 相关加载与返回
  - 删除 `loadPluginCommands` 动态导入
  - 删除 `getPluginSkills()` 路径
  - 删除 `builtinPlugins.getBuiltinPluginSkillCommands()` 路径
  - 返回值从 `{ skillDirCommands, pluginSkills, bundledSkills, builtinPluginSkills }`
    收敛为 `{ skillDirCommands, bundledSkills }`
- `loadAllCommands()`：去掉 plugin 命令注入
  - 删除 `getPluginCommands()` 加载与拼接
  - 删除 `pluginSkills` / `builtinPluginSkills` 拼接
  - 仅保留 `bundledSkills + skillDirCommands + workflowCommands + COMMANDS()`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Batch 2 A段已完成：
- /plugin 与 /reload-plugins 不再暴露；
- plugin/marketplace 相关命令注入路径已在 commands 聚合层切断。

下一步进入 Batch 2 B段：物理删除 plugin/marketplace 命令目录与残余引用清理（按编译错误与引用图分批收口）。

## 33. Core-7 Batch 2（Plugins/Marketplace）- B段：物理删除目录 + 残余引用清理

### 本批目标

在 Batch 2 A 段完成入口切断后，删除 plugin 命令域目录，并修复由删除带来的编译引用。

### 物理删除目录

已删除：

- `src/commands/plugin/`
- `src/commands/reload-plugins/`

### 残余引用清理（本批最小修复）

- `src/commands/mcp/mcp.tsx`
  - 删除：`import { PluginSettings } from '../plugin/PluginSettings.js'`
  - 删除 ant 用户 `/mcp` → `/plugin manage` 的重定向分支
  - 统一回退为 `MCPSettings` 入口

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Core-7 Batch 2（Plugins/Marketplace）A+B 已完成：
- 命令入口与命令注入路径已切断；
- plugin/reload-plugins 命令目录已物理删除；
- 删除后编译链已收敛并通过门禁。

> 说明：仓内仍存在 plugin/marketplace 基础设施（`utils/plugins/*`, `services/plugins/*`, CLI plugin 子命令等）与若干文案引用，属于后续 Batch（更深层 legacy 绞杀）处理范围，不在本批“命令域删除”范围内。

## 34. Core-7 Batch 3（Plugins/Marketplace 深层运行时绞杀）- A段：CLI 子命令入口切断

### 本批目标

从 `main.tsx` 层切断 Plugin/Marketplace 的 CLI 子命令入口，避免通过非 slash-command 路径进入 plugin runtime。

### 本批改动

- 文件：`src/main.tsx`

1) 删除 plugin CLI scope 常量依赖

- 删除导入：
  - `VALID_INSTALLABLE_SCOPES`
  - `VALID_UPDATE_SCOPES`
  - 来源：`./services/plugins/pluginCliCommands.js`

2) 删除 plugin/marketplace CLI 子命令注册块

- 删除 `program.command('plugin')` 全量子树，包括：
  - `plugin validate`
  - `plugin list`
  - `plugin marketplace add/list/remove/update`
  - `plugin install`
  - `plugin uninstall`
  - `plugin enable`
  - `plugin disable`
  - `plugin update`
- 同步删除 `coworkOption` 本地 helper（仅服务上述命令）

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Batch 3 A段完成：
- Plugin/Marketplace 的 Commander CLI 子命令入口已从主入口移除；
- 与前两批形成闭环：slash command + command registry + CLI 子命令三层入口均已切断。

## 35. Core-7 Batch 4（Plugin runtime 主链一锅端）

### 本批目标

把 plugin runtime 从主链上整体拔掉：不再加载插件、不过载插件命令/agent/hook/MCP/LSP，不再执行后台安装或刷新链路。

### 本批改动（大范围）

1) 让插件加载与刷新链路退化为 no-op

- `src/utils/plugins/pluginLoader.ts`
  - `loadAllPlugins()` → 返回空插件集
  - `loadAllPluginsCacheOnly()` → 返回空插件集
- `src/utils/plugins/refresh.ts`
  - `refreshActivePlugins()` → 仅清空 AppState.plugin 相关槽位并返回空结果
- `src/utils/plugins/headlessPluginInstall.ts`
  - `installPluginsForHeadless()` → 直接返回 `false`
- `src/utils/plugins/cacheUtils.ts`
  - `cleanupOrphanedPluginVersionsInBackground()` → no-op
- `src/utils/plugins/installedPluginsManager.ts`
  - `initializeVersionedPlugins()` → no-op
- `src/services/plugins/PluginInstallationManager.ts`
  - `performBackgroundPluginInstallations()` → no-op
- `src/utils/plugins/performStartupChecks.tsx`
  - no-op
- `src/hooks/useManagePlugins.ts`
  - no-op

2) 切断 REPL / QueryEngine 主链上的插件挂钩

- `src/screens/REPL.tsx`
  - 移除 plugin startup checks / plugin management hooks
  - 删除插件命令融合来源（仅保留 local + MCP）
- `src/QueryEngine.ts`
  - 移除对 cache-only plugin load 的依赖
  - headless 系统消息不再携带插件结果

3) 插件注入终点自然归零

- `src/services/lsp/config.ts`、`src/services/mcp/config.ts`
  - 仍可调用 cache-only loader，但由于 loader 已空返回，插件侧集成实际归零

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Batch 4 已把 plugin runtime 的主链功能整体降为无操作/空结果：
- 不再加载插件结果；
- 不再执行后台安装/刷新；
- 不再把插件命令并入 REPL/Query 主链；
- 主构建与测试全部通过。

## 36. Core-7 Batch 5（plugin/marketplace 基础设施物理清理）

### 批次目标

在 Batch 4 主链 no-op 的基础上，继续做基础设施层物理清理：
- 删除已无引用的 plugin CLI handler / services 入口文件；
- 抽空仍被少量遗留调用引用的 plugin service 实现；
- 切除 `main.tsx` 启动阶段的 plugin marketplace 维护链路与 telemetry 注入。

### 变更内容

1) 删除无引用文件

- 删除 `src/cli/handlers/plugins.ts`
- 删除 `src/services/plugins/pluginCliCommands.ts`
- 删除 `src/services/plugins/PluginInstallationManager.ts`

2) 抽空 plugin services（保留最小导出契约，避免大面积调用点连锁爆炸）

- `src/services/plugins/pluginOperations.ts`
  - `installPluginOp / uninstallPluginOp / enablePluginOp / disablePluginOp / updatePluginOp`
  - 统一返回“core-local 已移除 plugin runtime”语义的 no-op 结果
- `src/utils/plugins/pluginAutoupdate.ts`
  - `onPluginsAutoUpdated` 返回空 unregister
  - `getAutoUpdatedPluginNames` 返回 `[]`
  - `updatePluginsForMarketplaces` 返回 `[]`
  - `autoUpdateMarketplacesAndPluginsInBackground` no-op

3) 清理 main 启动路径中的 plugin 基础设施挂钩

- `src/main.tsx`
  - 移除 plugin 初始化/GC/排除缓存相关 imports 与执行：
    - `initializeVersionedPlugins`
    - `cleanupOrphanedPluginVersionsInBackground`
    - `getGlobExclusionsForPluginCache`
  - 移除 plugin telemetry 注入：
    - `loadAllPluginsCacheOnly`
    - `getManagedPluginNames`
    - `getPluginSeedDirs`
    - `logPluginsEnabledForSession`
    - `logPluginLoadErrors`
  - `logSessionTelemetry()` 仅保留 skills telemetry

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果

Core-7 Batch 5 完成后：
- plugin/marketplace 基础设施的 CLI/service 入口进一步物理收缩；
- main 启动链路不再执行 plugin marketplace 维护与 plugin telemetry 注入；
- 遗留调用点通过最小 no-op 契约稳定过渡，后续可继续做彻底删除（Batch 6）。

## 37. Core-7 Batch 6（utils/plugins 大块遗留模块清理）

### 批次目标

继续对 plugin/marketplace 遗留基础设施做“大块切除”：
- 对 `marketplaceManager / loadPlugin* / recommendation / installCounts` 等模块去运行时化；
- 修正上层调用，使主链保持可编译、可构建、可测试；
- 在不破坏现有 Core Runtime 的前提下完成历史兼容壳收口。

### 主要变更

1) 大块模块 no-op 化（保留最小导出契约）

- `src/utils/plugins/marketplaceManager.ts`
- `src/utils/plugins/loadPluginCommands.ts`
- `src/utils/plugins/loadPluginHooks.ts`
- `src/utils/plugins/loadPluginOutputStyles.ts`
- `src/utils/plugins/loadPluginAgents.ts`
- `src/utils/plugins/lspRecommendation.ts`
- `src/utils/plugins/hintRecommendation.ts`
- `src/utils/plugins/installCounts.ts`
- `src/utils/plugins/marketplaceHelpers.ts`
- `src/utils/plugins/pluginInstallationHelpers.ts`
- `src/utils/plugins/pluginStartupCheck.ts`
- `src/utils/plugins/officialMarketplaceStartupCheck.ts`

以上模块统一调整为：
- 返回空列表/空映射/`null`/`false`；
- 或提供明确“runtime removed”语义的失败结果；
- 保留调用方需要的符号和类型入口，避免链式爆炸。

2) 上层调用面修正（推荐链路彻底下线）

- `src/hooks/useLspPluginRecommendation.tsx` → no-op hook
- `src/hooks/useClaudeCodeHintRecommendation.tsx` → no-op hook

结合 Batch 4 对 REPL 主链的改动，plugin recommendation UI/安装链路在运行时已彻底失活。

### 结果

- plugin/marketplace 大块遗留模块已从“真实功能实现”降级为“兼容壳 + 空实现”；
- 主链不再依赖这些模块提供任何运行时能力；
- 后续可以继续做 Batch 7 的“物理删除 + 引用彻底清零”。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

## 38. Core-7 Batch 7（物理删除 + 剩余 import 清零收口）

### 本批目标

按“直接收口”执行：
- 物理删除 thinkback / plugin hint 相关历史残留；
- 清理 REPL/setup/commands 里的剩余入口挂钩；
- 对仍被深层链路引用的 `utils/plugins/*` 保留最小兼容壳（空实现），以确保一次性通过全量 gates。

### 变更摘要

1) 物理删除

- 删除目录：
  - `src/commands/thinkback/`
  - `src/commands/thinkback-play/`
- 删除 hooks：
  - `src/hooks/useOfficialMarketplaceNotification.tsx`
  - `src/hooks/usePluginRecommendationBase.tsx`
  - `src/hooks/useClaudeCodeHintRecommendation.tsx`
  - `src/hooks/useLspPluginRecommendation.tsx`

2) 入口与调用链清理

- `src/commands.ts`
  - 移除 thinkback / thinkback-play 命令注册
  - `clearCommandsCache()` 不再触发 plugin command/skills 清缓存
- `src/screens/REPL.tsx`
  - 移除 `useOfficialMarketplaceNotification` import + 调用
- `src/setup.ts`
  - 移除 plugin hooks 预加载与 hot-reload 注册逻辑

3) 兼容壳回填（避免深层非主链文件连锁爆炸）

> 在尝试直接物理删掉下列模块后，发现仍被 `pluginLoader/installedPluginsManager/cacheUtils` 及 builtin-tools 少量路径引用。为维持 Batch 7 的“一次过门禁”，回填最小 no-op 壳：

- `src/utils/plugins/marketplaceManager.ts`
- `src/utils/plugins/marketplaceHelpers.ts`
- `src/utils/plugins/loadPluginCommands.ts`
- `src/utils/plugins/loadPluginHooks.ts`
- `src/utils/plugins/loadPluginOutputStyles.ts`
- `src/utils/plugins/loadPluginAgents.ts`
- `src/utils/plugins/hintRecommendation.ts`
- `src/utils/plugins/pluginInstallationHelpers.ts`
- `src/utils/plugins/pluginStartupCheck.ts`
- `src/utils/plugins/officialMarketplaceStartupCheck.ts`

这些壳仅保留类型/符号契约，全部空行为或禁用语义，不再提供可用 plugin runtime。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结论

Batch 7 已完成“用户可见入口与历史残留”的物理清理；
plugin runtime 主链已无实质功能。

后续若继续做 Batch 8，可进一步对 `pluginLoader / installedPluginsManager / cacheUtils / mcpPluginIntegration / lspPluginIntegration` 做整片删除（需配套改写其上游引用）。

## 39. Core-7 Batch 8（plugin 深层基础设施整片物理删除）

### 本批目标

执行真正的深层删除：
- 物理删除 plugin runtime 的核心基础设施文件（loader/installed/cache/mcp-lsp integration 等）；
- 清理主链与服务层对这些模块的直接依赖；
- 将必要能力收敛到极小的残留兼容文件（仅 parser/类型/少量 no-op 钩子）。

### 物理删除（整片）

从 `src/utils/plugins/` 删除了大量历史文件，重点包含：
- `pluginLoader.ts`
- `installedPluginsManager.ts`
- `cacheUtils.ts`
- `mcpPluginIntegration.ts`
- `lspPluginIntegration.ts`
- 以及 marketplace/reconciler/zip-cache/plugin-installation 等一整组关联实现。

### 调用链清理与改写

- `src/main.tsx`
  - 移除 `clearPluginCache` 依赖及调用。
- `src/cli/print.ts`
  - `reload_plugins` 响应路径不再读取 plugin loader 结果，plugins 固定为空集合。
- `src/services/mcp/config.ts`
  - 移除 plugin MCP 服务器加载逻辑；保留空的 pluginMcpServers/mcpErrors。
- `src/services/lsp/config.ts`
  - 改为直接返回空 LSP servers。
- `src/services/tips/tipRegistry.ts`
  - 去除官方 marketplace 安装/插件安装状态探测依赖，相关提示文案改为静态 slug。
- `src/components/LogoV2/ChannelsNotice.tsx`
  - 去掉 installed plugins 文件读取依赖，仅基于 builtin plugin source 做最小匹配。
- `src/setup.ts`, `src/commands.ts`, `src/screens/REPL.tsx`
  - 延续前批次收口，确保不存在 plugin 深层基础设施启动挂钩。
- `src/constants/outputStyles.ts`, `src/outputStyles/loadOutputStylesDir.ts`
  - 去除 plugin output styles 依赖。

### 保留的最小残留（非深层 runtime）

为兼容现存上游调用，保留了少量轻量文件：
- `pluginIdentifier.ts`（解析/标识工具）
- `schemas.ts`（类型/校验常量）
- `orphanedPluginFilter.ts`（供 grep tool exclusion）
- `loadPluginHooks.ts` / `loadPluginAgents.ts` / `hintRecommendation.ts` / `pluginOptionsStorage.ts`（最小 no-op 壳）
- `headlessPluginInstall.ts` / `refresh.ts` / `pluginAutoupdate.ts`（no-op）

这些文件不再承载 plugin runtime 能力，仅用于编译与接口契约稳定。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结论

Batch 8 已完成“深层基础设施的真实物理删除”，plugin runtime 已从主链与核心服务链路中移除。
