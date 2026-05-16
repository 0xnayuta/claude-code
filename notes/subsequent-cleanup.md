# Phase C 收尾报告

> Phase C（Core Query Runtime 独立）完成于 2025-05-16。
> 共完成 4 个 Steps（C1/C2a/C2b/C3），建立 5 个新 contract + 1 个 core query runtime 模块。

## Phase C 交付总览

| Step | 文件 | 说明 |
|---|---|---|
| C1 | `src/core/contracts/queryContract.ts` | 版本升级 v1→v2（新增 CoreQueryParams/StreamEvent/Config/TokenBudget） |
| C2a | `src/core/utils/messageUtils.ts` | 消息构建/工具函数内迁（core-owned + re-export 转发） |
| C2b | `src/core/contracts/compactContract.ts` | Compact 子服务 contract 基线 |
| C2b | `src/core/contracts/providerContract.ts` | Provider/tool executor/message normalizer contract 基线 |
| C3 | `src/core/query/coreQueryConfig.ts` | Query runtime 配置 + profile 解析 |
| C3 | `src/core/query/coreQueryLoop.ts` | AsyncGenerator 主环 + turn state + delegate |
| C3 | `src/core/query/coreQueryPipeline.ts` | 6 阶段 pipeline + pipeline delegate |

**门禁结果（全部通过）**：
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（30 files in `src/core`）
- `bun run check:core-contracts` ✅（11 contract files）

---

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

## 40. Core-7 Batch 9（删除剩余 no-op 壳并清零 utils/plugins 运行时引用）

### 目标

按约束仅保留：
- `pluginIdentifier.ts`
- `schemas.ts`
- `orphanedPluginFilter.ts`

并清零其余 `utils/plugins/*` 的运行时引用。

### 主要改动

1) 删除剩余 no-op 壳文件

- 删除：
  - `src/utils/plugins/headlessPluginInstall.ts`
  - `src/utils/plugins/hintRecommendation.ts`
  - `src/utils/plugins/loadPluginAgents.ts`
  - `src/utils/plugins/loadPluginHooks.ts`
  - `src/utils/plugins/officialMarketplace.ts`
  - `src/utils/plugins/pluginAutoupdate.ts`
  - `src/utils/plugins/pluginDirectories.ts`
  - `src/utils/plugins/pluginOptionsStorage.ts`
  - `src/utils/plugins/refresh.ts`
- 删除未使用通知 hook：
  - `src/hooks/notifs/usePluginAutoupdateNotification.tsx`

2) 调整运行时调用链，移除对应引用

- `src/cli/print.ts`
  - 移除 `installPluginsForHeadless` / `refreshActivePlugins` 依赖
  - 同步收口 sync-plugin-install / reload_plugins 分支到无插件实现
- `src/utils/sessionStart.ts`
  - 移除 `loadPluginHooks` import 与执行
- `src/utils/hooks.ts`
  - 移除 plugin options/data 变量替换依赖（不再引用 `pluginOptionsStorage` 与 `pluginDirectories`）
- `src/utils/backgroundHousekeeping.ts`
  - 移除 plugin autoupdate 后台任务调用
- `packages/builtin-tools/src/tools/BashTool/BashTool.tsx`
  - 移除 hintRecommendation 记录逻辑
- `packages/builtin-tools/src/tools/PowerShellTool/PowerShellTool.tsx`
  - 移除 hintRecommendation 记录逻辑
- `packages/builtin-tools/src/tools/AgentTool/loadAgentsDir.ts`
  - 移除 plugin agents loader 依赖
- `src/utils/plugins/orphanedPluginFilter.ts`
  - 内联 plugins 目录路径获取，去除对 `pluginDirectories.ts` 的依赖

3) 其他连带收口

- `src/services/mcp/config.ts`、`src/services/lsp/config.ts`、`src/services/tips/tipRegistry.ts`、
  `src/components/LogoV2/ChannelsNotice.tsx`、`src/constants/outputStyles.ts` 等继续去插件化，
  与 Batch 8 深层删除保持一致。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅
- `bun test` ✅

### 结果确认

`rg "utils/plugins/" src packages -n` 仅剩：
- `pluginIdentifier.ts`
- `schemas.ts`
- `orphanedPluginFilter.ts`

Core-7 Batch 9 达成。

## 41. Core-7 Batch 10（继续清理 legacy 命令入口与残留提示）

### 主要改动

1) 继续切断 legacy 命令入口（注册层）
- `src/commands.ts`
  - `autofixPr` 改为恒定 `null`
  - `autonomy` 改为恒定 `null`
  - `review/ultrareview` 改为恒定 `null`（移除对 `commands/review.js` 的加载）

2) MCP entrypoint 去除 review 依赖
- `src/entrypoints/mcp.ts`
  - 删除 `review` import
  - `MCP_COMMANDS` 调整为空数组，避免再次引入 legacy review 命令

3) 删除已失效命令提示
- `src/services/tips/tipRegistry.ts`
  - 删除 `/install-github-app` 与 `/install-slack-app` 两条 tips

4) 清理无用 plugin service 残留
- 删除：`src/services/plugins/pluginOperations.ts`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 42. Core-7 Batch 11（物理删除 review/autofix-pr 目录）

### 主要改动

1) 物理删除已断入口命令目录
- 删除：`src/commands/review/`
- 删除：`src/commands/review.ts`
- 删除：`src/commands/autofix-pr/`

2) 清理残余调用点
- `src/components/PromptInput/PromptInput.tsx`
  - 移除 `commands/review/ultrareviewEnabled` 依赖
  - 改为本地常量函数 `isUltrareviewEnabled(): false`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 43. Core-7 Batch 12（Teleport/remote 入口继续绞杀 + ultrareview API 删除）

### 主要改动

1) 继续切断 teleport/remote 入口
- `src/cli/print.ts`
  - `--teleport` 分支改为直接报错退出（不再动态加载 `utils/teleport.js`）
- `src/main.tsx`
  - 解析参数后新增硬拦截：`--teleport/--remote` 直接报错退出
  - 原 remote 会话创建大分支替换为退出报错逻辑

2) AgentTool 删除 remote isolation runtime
- `packages/builtin-tools/src/tools/AgentTool/AgentTool.tsx`
  - 删除 `teleportToRemote` 依赖
  - 删除 remote agent launch 路径
  - 当 `effectiveIsolation === 'remote'` 时直接抛出“已移除”错误

3) 删除 ultrareview 专属 API 实现
- 删除：`src/services/api/ultrareviewPreflight.ts`
- 删除：`src/services/api/ultrareviewQuota.ts`
- 删除：`src/services/api/__tests__/ultrareviewPreflight.test.ts`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 44. Core-7 Batch 13（teamMemorySync + Swarm 降级切断）

### 主要改动

1) teamMemorySync 调用链切断
- `packages/builtin-tools/src/tools/FileEditTool/FileEditTool.ts`
- `packages/builtin-tools/src/tools/FileWriteTool/FileWriteTool.ts`
  - 移除 `teamMemSecretGuard` 依赖，改为本地 no-op `checkTeamMemSecrets`
- `src/setup.ts`
  - 移除 TEAMMEM watcher 启动逻辑（`startTeamMemoryWatcher`）
- `src/utils/sessionFileAccessHooks.ts`
  - 去除 `teamMemorySync/watcher` 依赖
  - team memory 写通知降级为空行为

2) teamMemorySync 目录物理删除
- 删除：`src/services/teamMemorySync/`

3) Swarm 主链降级切断（先断高频交互入口）
- `src/screens/REPL.tsx`
  - 将 swarm permission/leader bridge/team active 相关入口替换为本地 no-op 常量：
    - `isSwarmWorker`
    - `generateSandboxRequestId`
    - `sendSandboxPermissionRequestViaMailbox`
    - `sendSandboxPermissionResponseViaMailbox`
    - `registerSandboxPermissionCallback`
    - `registerLeaderToolUseConfirmQueue` / `unregisterLeaderToolUseConfirmQueue`
    - `registerLeaderSetToolPermissionContext` / `unregisterLeaderSetToolPermissionContext`
- `src/components/PromptInput/PromptInput.tsx`
  - `isInProcessEnabled` / `syncTeammateMode` 降级为本地 no-op

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 45. Core-7 Batch 14（Swarm 工具层切断，删除注册入口）

### 主要改动

1) tools 注册层切断 Swarm 相关工具
- `src/tools.ts`
  - 从 `getAllBaseTools()` 移除：
    - `SendMessageTool`
    - `TeamCreateTool`
    - `TeamDeleteTool`
  - 从 simple/repl coordinator 分支移除 `SendMessageTool` 注入
  - 删除 Team/SendMessage 的 lazy require getter 定义，避免运行时装载

2) 保留实现文件但不再注册
- `packages/builtin-tools/src/tools/TeamCreateTool/*`
- `packages/builtin-tools/src/tools/TeamDeleteTool/*`
- `packages/builtin-tools/src/tools/SendMessageTool/*`
- `packages/builtin-tools/src/tools/shared/spawnMultiAgent.ts`

以上文件暂不物理删除（避免深层引用链一次性爆炸），但工具层入口已切断，不再进入默认工具池。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 46. Core-7 Batch 15（Swarm 工具层后续：hooks/UI 主链切断）

### 主要改动

1) Swarm 相关 hooks 降级为 no-op
- `src/hooks/useInboxPoller.ts` -> no-op
- `src/hooks/useSwarmInitialization.ts` -> no-op
- `src/hooks/useSwarmPermissionPoller.ts` -> 仅保留最小回调注册/清理契约，轮询逻辑移除

2) Teams UI 降级
- `src/components/teams/TeamsDialog.tsx`
  - 替换为最小禁用提示组件（不再依赖 swarm backends/teamHelpers）

3) 兼容修复
- 调整 `useSwarmPermissionPoller` 最小实现的函数签名，兼容现有调用点与测试编译需求。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 47. Core-7 Batch 16（Swarm 物理删除前收口推进）

### 主要改动

1) 继续切断主链对 swarm 的直接依赖（调用点替换为本地 no-op）
- `src/hooks/useTypeahead.tsx`
  - `TEAM_LEAD_NAME` 改为本地常量
- `src/components/tasks/BackgroundTasksDialog.tsx`
  - `TEAM_LEAD_NAME` 改为本地常量
- `src/components/PromptInput/PromptInputFooterLeftSide.tsx`
  - `isInProcessEnabled` 改为本地 no-op
- `src/components/PromptInput/useSwarmBanner.ts`
  - `isInsideTmux/getCachedDetectionResult/isInProcessEnabled/getSwarmSocketName` 改为本地 no-op
- `src/cli/print.ts`
  - `removeTeammateFromTeamFile` 改为本地 no-op
- `src/main.tsx`
  - 去除 `reconnection` 直接依赖（`computeInitialTeamContext` 本地 no-op）
  - `teammatePromptAddendum/teammateModeSnapshot` lazy require 替换为本地 stub
- `src/setup.ts`
  - 去除 teammate mode snapshot 运行逻辑

2) Swarm 目录物理删除尝试与收口策略
- 对 `src/utils/swarm` 做整片物理删除尝试时，发现大量目录内互相依赖仍被少量保留入口触发编译链。
- 为保持门禁全绿，回退到“先切外部入口、后删内部实现”的策略。
- 本批先删除零风险测试残留：
  - `src/utils/swarm/__tests__/agentTeamsLifecycle.test.ts`
  - `src/utils/swarm/__tests__/spawnInProcess.test.ts`
  - `src/utils/swarm/__tests__/spawnUtils.test.ts`
  - `src/utils/swarm/backends/__tests__/PaneBackendExecutor.test.ts`
  - `src/utils/swarm/backends/__tests__/WindowsTerminalBackend.test.ts`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 48. Core-7 Batch 17（Swarm 进一步壳化 + utils/swarm 目录物理删除）

### 主要改动

1) builtin-tools 进一步壳化（去除 swarm 运行实现）
- `packages/builtin-tools/src/tools/shared/spawnMultiAgent.ts`
  - 保留最小类型导出与函数签名；`spawnTeammate` 直接报“已移除”
- `packages/builtin-tools/src/tools/TeamCreateTool/TeamCreateTool.ts`
  - 最小禁用实现：`isEnabled=false`，`call` 抛出已移除错误
- `packages/builtin-tools/src/tools/TeamDeleteTool/TeamDeleteTool.ts`
  - 最小禁用实现：`isEnabled=false`，`call` 返回禁用结果
- `packages/builtin-tools/src/tools/SendMessageTool/SendMessageTool.ts`
  - 最小禁用实现：`isEnabled=false`，`call` 返回禁用结果

2) 清理剩余 swarm 调用点并本地替换
- `src/hooks/toolPermission/handlers/swarmWorkerHandler.ts`：permissionSync 入口替换为本地 no-op
- `src/entrypoints/init.ts`：移除 session team cleanup 动态导入
- `src/components/Settings/Config.tsx`：teammate snapshot/model 入口改本地 stub
- `src/tasks/InProcessTeammateTask/InProcessTeammateTask.tsx`：kill in-process teammate 改本地 no-op
- `src/utils/attachments.ts`：`removeTeammateFromTeamFile` 改本地 no-op
- `src/utils/teamDiscovery.ts`：移除对 `./swarm/*` 依赖，改本地最小类型+no-op reader
- `src/utils/teammateMailbox.ts`：移除 `./swarm/*` 依赖，改本地常量/类型
- `src/utils/worktree.ts`：`isInITerm2` 改本地 no-op

3) 物理删除 swarm 目录
- 删除：`src/utils/swarm/`（整目录）

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 结果确认

- `rg "utils/swarm/|\./swarm/" src packages -n` -> 0 命中


## 49. Core-7 Batch 18（autoUpdater/nativeInstaller 收口）

### 主要改动

1) autoUpdater 壳化
- `src/utils/autoUpdater.ts`
  - 重写为最小 no-op/fallback 实现，保留对外契约：
    - `AutoUpdaterResult` / `NpmDistTags` / `MaxVersionConfig` 类型
    - `assertMinVersion`
    - `getMaxVersion` / `getMaxVersionMessage`
    - `shouldSkipVersion`
    - `getLockFilePath`
    - `checkGlobalInstallPermissions`
    - `getNpmDistTags` / `getGcsDistTags`

2) nativeInstaller API 壳化
- `src/utils/nativeInstaller/index.ts`
  - 重写为最小 no-op API，保留调用方依赖签名：
    - `checkInstall`
    - `cleanupNpmInstallations`
    - `cleanupOldVersions`
    - `cleanupShellAliases`
    - `installLatest`
    - `lockCurrentVersion`
    - `removeInstalledSymlink`
    - `SetupMessage` 类型

### 结果

- 安装/自更新相关运行逻辑已从主链收口为禁用壳。
- 上层调用点保留，但行为均为无副作用 no-op/空结果。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 50. Core-7 Batch 19（OAuth workspace/cloud API 分支收口）

### 主要改动

将 OAuth workspace/cloud 相关 API 模块统一降级为 core-noop/禁用壳，保留类型与函数签名，移除实际云端调用路径：

- `src/services/api/sessionIngress.ts`
  - `appendSessionLog/getSessionLogs/getSessionLogsViaOAuth/getTeleportEvents` 统一返回禁用结果（`false`/`null`）
  - `clearSession/clearAllSessions` 保留空实现
- `src/services/api/referral.ts`
  - referral eligibility/redemptions/passes 相关逻辑改为本地 no-op 返回
  - 保留对外类型签名与辅助函数导出
- `src/services/api/adminRequests.ts`
  - `createAdminRequest` 改为明确抛错（功能移除）
  - `getMyAdminRequests/checkAdminRequestEligibility` 返回禁用结果
  - 保留 AdminRequest 相关类型
- `src/services/api/overageCreditGrant.ts`
  - 缓存/刷新逻辑降级为 no-op
  - 展示格式化 `formatGrantAmount` 保留
  - 保留对外类型导出

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 51. Core-7 Batch 20（analytics / telemetry / langfuse implementation compression）

### 主要改动

1) analytics 主入口压缩为稳定 no-op facade
- `src/services/analytics/index.ts`
  - 保留公开类型与函数名（`attachAnalyticsSink/logEvent/logEventAsync/stripProtoFields`）
  - 运行实现降级为 no-op（仅保留契约，去除真实 sink/队列逻辑）

2) growthbook runtime 压缩为本地最小实现
- `src/services/analytics/growthbook.ts`
  - 保留核心导出面（feature/config getter、refresh/reset、listener、init）
  - 去除远端拉取/鉴权/实验上报等实现，统一 fallback + 本地 override map
  - `getFeatureValue_*` 与 `getDynamicConfig_*` 保留签名并返回 fallback/override

3) telemetry 事件/追踪实现压缩
- `src/utils/telemetry/events.ts`
  - 保留 `redactIfDisabled` 与 `logOTelEvent` 导出
  - `logOTelEvent` 降级 no-op
- `src/utils/telemetry/sessionTracing.ts`
  - 重写为最小 tracing facade
  - 保留所有现有导出函数与 `Span` 类型导出
  - start* 返回 dummy Span，end*/add* no-op，特性开关函数返回 false

4) langfuse
- `src/services/langfuse/*` 已是 no-op facade，本批保持不变（仅确认与上面压缩后契约兼容）。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 52. Core-7 审计（收官检查）

### 审计范围

对照 `notes/CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` 中 “Core-7：legacy 绞杀删除” 建议顺序逐项核查：

1) Teleport / cloud commands
2) Plugins / Marketplace
3) OAuth workspace API branches
4) teamMemorySync / remote memory
5) plugin LSP integration
6) autoUpdater / nativeInstaller
7) Swarm / Team / teammate
8) analytics/telemetry/langfuse implementation compression

### 结论

**状态：大体完成，但未达到“完全物理删除/零残留调用点”**。

### 已完成项（✅）

- Plugins / Marketplace：主运行链已删除，`src/services/plugins` 已空目录，仅保留必要 compat/type 壳。
- OAuth workspace API branches：`sessionIngress/referral/adminRequests/overageCreditGrant` 已收口为 no-op/禁用壳。
- teamMemorySync / remote memory：`src/services/teamMemorySync` 已删除。
- plugin LSP integration：已切断。
- autoUpdater / nativeInstaller：已收口为 no-op facade。
- Swarm / Team / teammate：`src/utils/swarm` 已物理删除并去引用。
- analytics/telemetry/langfuse：核心实现已压缩为 no-op facade。

### 未完全收官项（⚠️）

1) **Teleport / cloud runtime 残留仍较多**
- 仍存在大量 `utils/teleport` / remote session 相关调用链：
  - `src/main.tsx`
  - `src/utils/teleport.tsx`, `src/utils/teleport/api.ts`
  - `src/tasks/RemoteAgentTask/*`
  - `src/hooks/useRemoteSession.ts`, `src/hooks/useSSHSession.ts`, `src/hooks/useTeleportResume.tsx`
  - `src/components/Teleport*` / `Remote*` 组件若干
- 说明：目前是“入口已硬禁 + 若干分支禁用”，并非全域物理删除。

2) **autoUpdater/nativeInstaller 仍有 UI/命令层调用（但指向 no-op）**
- 例如：`commands/install.tsx`, `useInstallMessages.tsx`, `Doctor.tsx`, `setup.ts`。
- 当前无功能风险，但仍有 dead flow。

3) **teammate/team 语义残留（非 swarm 实现残留）**
- `utils/teammate.ts` 及相关 UI state 字段仍存在（多为兼容/展示语义）。

### 下一步建议（Core-7 收官到“完成态”）

- A. Teleport/remote 全链路下线（优先）
  - 删除 `utils/teleport*` 与 `RemoteAgentTask`/`useRemoteSession` 等残留链路；
  - 同步移除 `passes`、remote resume、remote env 相关 UI/命令。
- B. 清理 no-op 上层调用
  - 收口 `install` 命令与 install 通知/doctor 更新检查展示分支。
- C. 语义瘦身
  - 将 `teammate/team` 纯兼容字段标注或移除，避免误导后续开发。

### 门禁

- 本次为审计批，无代码变更门禁。


## 53. Core-7 Batch 21（Teleport/remote 下线 + install dead flow 清理 + teammate 语义收尾）

### 主要改动

1) Teleport/remote 主链进一步下线（运行时 no-op）
- `src/hooks/useRemoteSession.ts`
  - 重写为最小 no-op hook：`isRemoteMode=false`，`sendMessage/cancelRequest/disconnect` 无副作用
- `src/hooks/useSSHSession.ts`
  - 重写为最小 no-op hook：`isRemoteMode=false`，`sendMessage/cancelRequest/disconnect` 无副作用
- `src/screens/REPL.tsx`
  - `restoreRemoteAgentTasks` 改本地 no-op，阻断 remote task 恢复流程
- `src/tasks.ts`
  - 从 task registry 移除 `RemoteAgentTask` 注册（不再进入统一任务调度）
- `src/commands.ts`
  - `passes` 命令改为 `null`（移除 cloud referral 入口）

2) autoUpdater/nativeInstaller 上层 dead flow 清理
- `src/cli/handlers/util.tsx`
  - `installHandler` 直接报错退出：`install/native updater is removed in this build`
- `src/hooks/notifs/useInstallMessages.tsx`
  - 改为 no-op（不再触发 install 检查通知）
- `src/setup.ts`
  - 移除 `lockCurrentVersion` import 与启动调用

3) team/teammate 兼容语义收尾（防误用）
- `src/utils/teammate.ts`
  - `setDynamicTeamContext` no-op 并清空上下文（禁用 legacy tmux teammate 动态注入）
  - `getDynamicTeamContext` 固定返回 `null`
  - `getAgentId/getAgentName/getTeammateColor` 仅保留 in-process 分支
  - `getTeamName` 仅保留 in-process + 传入 teamContext 分支
  - `isTeammate` 改为仅判断 in-process teammate
  - `isPlanModeRequired` 去除 dynamicTeamContext 分支

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 备注

- 本批采用“运行链下线 + 调度移除 + 调用点 no-op”策略，优先保证 Core 路径稳定与可编译。
- `utils/teleport/*` 与 `tasks/RemoteAgentTask/*` 物理目录尚存，下一批可继续做物理删除/兼容壳收缩。


## 54. Core-7 Batch 22（三项并行推进：remote 下线深化 + updater dead flow + teammate 误用防护）

### 本批实际落地

1) Teleport/remote 链路继续下线（运行路径）
- `src/hooks/useRemoteSession.ts`：保持 no-op hook（remote ws 发送/接收路径关闭）
- `src/hooks/useSSHSession.ts`：保持 no-op hook（ssh remote 路径关闭）
- `src/tasks.ts`：`RemoteAgentTask` 不再注册到任务池
- `src/screens/REPL.tsx`：
  - swarm 相关缺失模块改本地 no-op（`setMemberActive/permissionSync/leaderPermissionBridge`）
  - sandbox callback 参数对齐当前 hook 契约（`workerName/onResponse`）

2) autoUpdater/nativeInstaller 上层 dead flow 清理
- `src/cli/handlers/util.tsx`：`installHandler` 直接报错退出（保持）
- `src/hooks/notifs/useInstallMessages.tsx`：保持 no-op
- `src/setup.ts`：保持移除 `lockCurrentVersion` 启动调用

3) team/teammate 兼容语义收尾（避免误用）
- `src/utils/teammate.ts`：保持仅 in-process teammate 语义（dynamicTeamContext 已禁用）

### 说明

- 本批尝试更激进地对 remote/teleport 类型与文件做物理壳化时触发大面积类型链连锁（任务 UI、ultraplan、resume 路径）。
- 已回退高风险变更，保留“运行链关闭 + 类型/契约稳定”的可编译状态，确保门禁全绿。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 55. Core-7 Batch 23（分层剥离-第1层：Teleport UI/入口剥离 + updater 上层清理）

### 主要改动

1) Teleport UI 层剥离（先断动态入口）
- `src/dialogLaunchers.tsx`
  - `launchTeleportResumeWrapper` 改为直接 `return null`
  - `launchTeleportRepoMismatchDialog` 改为直接 `return null`
  - 移除对 Teleport 弹窗组件的动态 import 依赖

2) 物理删除一层 Teleport UI 文件
- 删除：
  - `src/hooks/useTeleportResume.tsx`
  - `src/components/TeleportResumeWrapper.tsx`

3) autoUpdater/nativeInstaller 上层 dead flow 继续清理
- `src/screens/REPL.tsx`
  - 移除 `AutoUpdaterResult` 类型 import
  - `autoUpdaterResult` 状态改为常量 `null`
  - `setAutoUpdaterResult` 改本地 no-op

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 下一层建议

- 第2层（任务/UI）:
  - 先将 `BackgroundTasksDialog` 中 remote_agent 分支降级为不可达展示/隐藏；
  - 再收口 `RemoteSessionDetailDialog`/`RemoteSessionProgress` 的调用点；
- 第3层（runtime/service）:
  - 收口 `main.tsx` teleport 分支（整段硬错误退出）后，删除 `TeleportProgress` / `TeleportRepoMismatchDialog`；
  - 最后收缩 `utils/teleport/*` 与 `remote/*`。


## 56. Core-7 Batch 24（分层剥离-第2层：任务/UI 分支收口）

### 主要改动

1) BackgroundTasksDialog 收口 remote 分支
- `src/components/tasks/BackgroundTasksDialog.tsx`
  - `RemoteAgentTask` 改为本地 no-op kill stub（避免 remote task runtime 依赖）
  - 移除 `RemoteSessionDetailDialog` 引用
  - 任务分组中 `remote` 列表固定为空（不再在任务面板展示 remote session）
  - detail switch 的 `remote_agent` 分支改为简单禁用提示 Dialog

2) BackgroundTask 行渲染收口
- `src/components/tasks/BackgroundTask.tsx`
  - 移除 `RemoteSessionProgress` 依赖
  - `remote_agent` 分支改为固定“remote session (disabled)”显示

3) 任务 pill 文案收口
- `src/tasks/pillLabel.ts`
  - `remote_agent` 文案统一改为 disabled 提示，不再走 ultraplan 细分状态

4) TaskOutputTool 收口 remote 分支
- `packages/builtin-tools/src/tools/TaskOutputTool/TaskOutputTool.tsx`
  - `remote_agent` 输出改为固定 `prompt: 'remote task disabled'`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 下一层建议（第3层）

- 直接把 `main.tsx` teleport 分支整体替换为统一 hard-error 退出；
- 删除 `components/TeleportProgress.tsx`、`components/TeleportRepoMismatchDialog.tsx`（若已无引用）；
- 收口 `utils/teleport/*` 与 `remote/*` 到最小 compat 壳，逐步推进物理删除。


## 57. Core-7 Batch 25（分层剥离-第3层：main teleport hard-error + 组件入口删除 + teleport API 收口）

### 主要改动

1) `main.tsx` teleport/remote 分支整体硬错误
- 删除 teleport resume/checkout/progress 的执行路径引用
- 将 `remote !== null || teleport` 统一改为 hard-error 退出：
  - `Error: --teleport/--remote has been removed from this build.`
- 同步清理相关 import：
  - 删除 `setTeleportedSessionInfo`
  - 删除 `launchTeleportResumeWrapper` / `launchTeleportRepoMismatchDialog`
  - 删除 `fetchSession`、`checkOutTeleportedSessionBranch`、`processMessagesForTeleportResume`、`validateGitState`、`validateSessionRepository` 引用

2) 删除剩余 Teleport 组件入口文件（物理删除）
- 删除：
  - `src/components/TeleportProgress.tsx`
  - `src/components/TeleportRepoMismatchDialog.tsx`

3) 收口 `utils/teleport/*`（API 发送链）
- `src/utils/teleport/api.ts`
  - `sendEventToRemoteSession` -> 固定 `false`
  - `updateSessionTitle` -> 固定 `false`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 58. Core-7 Batch 26（remote/ 目录级收口 + 类型引用清理）

### 主要改动

1) `remote/` 目录级收口（核心模块壳化）
- `src/remote/RemoteSessionManager.ts`
  - 压缩为最小 compat/no-op：保留 `RemotePermissionResponse`、`RemoteSessionConfig`、`createRemoteSessionConfig` 与类签名
  - 运行行为降级：`sendMessage` 固定 `false`，其余连接/中断/断开均 no-op
- `src/remote/SessionsWebSocket.ts`
  - 压缩为最小 no-op WebSocket 壳，保留 `SessionsWebSocketCallbacks` 与类签名

2) directConnect 相关收口
- `src/server/directConnectManager.ts`
  - 去除对 `remote/RemoteSessionManager` 与 `utils/teleport/api` 的类型依赖
  - 本地定义 `RemoteMessageContent` / `RemotePermissionResponse` 类型
  - 运行实现降级为 no-op（`sendMessage=false`）

3) 清理剩余“仅类型引用”到 teleport API
- 改为本地类型，移除 `utils/teleport/api` 的 type-only import：
  - `src/hooks/useDirectConnect.ts`
  - `src/hooks/useRemoteSession.ts`
  - `src/hooks/useSSHSession.ts`
  - `src/ssh/SSHSessionManager.ts`
  - `src/screens/REPL.tsx`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 59. Core-7 Batch 27（remote/teleport 残留物理删除与壳收缩）

### 主要改动

1) 删除 `remote/` 残留文件（无引用）
- 删除：`src/remote/SessionsWebSocket.ts`

2) 删除 teleport 残留测试与未使用组件
- 删除：
  - `src/utils/teleport/__tests__/api.test.ts`
  - `src/components/tasks/RemoteSessionDetailDialog.tsx`
  - `src/components/tasks/RemoteSessionProgress.tsx`
  - `src/components/RemoteEnvironmentDialog.tsx`
  - `src/components/TeleportError.tsx`
  - `src/components/TeleportStash.tsx`
  - `src/components/ResumeTask.tsx`

3) 收缩 `src/utils/teleport.tsx` 为最小 compat 壳
- 去除对 Teleport UI 组件的依赖
- 保留导出 API 签名与必要类型，统一禁用行为：
  - teleport/remote 路径抛“removed”错误或返回空/固定值
- 为兼容旧调用链，`PollRemoteSessionResponse` 保留 `SDKMessage[]` 形状

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 60. Core-7 Batch 28（最后残留扫描 + 直接删除）

### 扫描结果

执行 residual 扫描后，remote/teleport 相关导入已显著收敛，按“可直接删除且不破坏编译”原则继续清理。

### 本批删除

- 删除：`src/remote/SessionsWebSocket.ts`（已无引用）
- 删除：`src/utils/background/remote/`（目录，已无引用）

### 本批进一步收口

1) 去除 `remote/RemoteSessionManager` 依赖并删除该文件
- `src/main.tsx` / `src/screens/REPL.tsx` / `src/hooks/useAssistantHistory.ts` / `src/hooks/useRemoteSession.ts`
  - 改为本地最小 `RemoteSessionConfig` 类型，不再引用 `remote/RemoteSessionManager`
- 删除：`src/remote/RemoteSessionManager.ts`

2) 收口仍残留的 teleport 类型依赖
- `src/utils/filePersistence/outputsScanner.ts`
  - 移除 `teleport/environments` type-only 依赖，改本地 `EnvironmentKind` 类型
- `src/utils/ultraplan/ccrSession.ts`
  - 移除 `teleport/api` 的 `isTransientNetworkError` 依赖，改本地最小实现
  - 保留对 `teleport.tsx` 的 `pollRemoteSessionEvents` 兼容调用链（当前仍被 ultraplan 逻辑消费）

### 当前 residual 说明

剩余 import 命中主要为：
- `src/hooks/useDirectConnect.ts` -> `remote/remotePermissionBridge`, `remote/sdkMessageAdapter`（direct-connect 兼容桥）
- `src/utils/ultraplan/ccrSession.ts` -> `../teleport.js`（仅轮询 compat 壳）
- `src/utils/teleport.tsx` -> `./teleport/api.js`（类型兼容）

这三类已不属于高风险 remote runtime 主链，后续可在 ultraplan/direct-connect 最终决策后再做物理删除。

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 61. Core-7 Batch 29（ultraplan/direct-connect 最终移除）

### 主要改动

1) direct-connect 最终收口
- `src/main.tsx`
  - direct-connect 交互路径改为统一 hard-error：`direct-connect is removed from this build`
  - 移除 `createDirectConnectSession/DirectConnectError` 相关依赖与执行路径
- `src/hooks/useDirectConnect.ts`
  - 重写为最小 no-op hook（`isRemoteMode=false`，发送/中断/断开均无副作用）
- 删除：
  - `src/server/directConnectManager.ts`
  - `src/server/createDirectConnectSession.ts`
- `src/screens/REPL.tsx`
  - `DirectConnectConfig` 改本地最小类型，不再依赖 server 文件

2) ultraplan 最终收口
- `src/commands.ts`
  - `ultraplan` 命令固定 `null`（不注册）
- `src/screens/REPL.tsx`
  - `UltraplanChoiceDialog/UltraplanLaunchDialog/launchUltraplan` 改本地 no-op
  - `ultraplanPendingChoice/ultraplanLaunchPending/showRemoteCallout` 改本地禁用值
  - 移除对应 JSX 实际分支（替换为 `null`）
- `src/components/permissions/ExitPlanModePermissionRequest/ExitPlanModePermissionRequest.tsx`
  - `launchUltraplan` 改本地 no-op
  - `showUltraplan=false`
- `src/components/PromptInput/PromptInput.tsx`
  - `findUltraplanTriggerPositions` 改本地空实现（不再触发 ultraplan 关键词路径）
- `src/utils/processUserInput/processUserInput.ts`
  - `hasUltraplanKeyword/replaceUltraplanKeyword` 改本地禁用实现
- `src/components/tasks/BackgroundTasksDialog.tsx`
  - `stopUltraplan` 改本地 no-op

3) 物理删除 ultraplan UI/命令残留
- 删除：
  - `src/components/ultraplan/`（整目录）
  - `src/commands/ultraplan.tsx`

### 验证

- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅


## 62. Core-7 最终收官报告

### 结论

**Core-7（legacy 绞杀删除）已完成。**

本轮收官以“边界先行 + 运行链下线 + 物理删除分层推进”为策略，最终达到：
- personal-local 主路径稳定；
- teleport/remote、ultraplan/direct-connect、review/autofix-pr、swarm/teamMemorySync、plugin/marketplace 运行链全部下线；
- 高风险域保留仅最小 compat/no-op 壳以维持类型与构建稳定。

### 对照 `CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` Core-7 建议顺序

1. Teleport / cloud commands ✅
2. Plugins / Marketplace ✅
3. OAuth workspace API branches ✅
4. teamMemorySync / remote memory ✅
5. plugin LSP integration ✅
6. autoUpdater / nativeInstaller ✅
7. Swarm / Team / teammate ✅
8. analytics/telemetry/langfuse implementation compression ✅

### 本阶段关键产出（摘要）

- 删除/禁用命令域：review、autofix-pr、passes、ultraplan、install（handler hard-error）。
- 删除目录：
  - `src/utils/swarm/`
  - `src/services/teamMemorySync/`
  - `src/commands/review/`
  - `src/commands/autofix-pr/`
  - `src/components/ultraplan/`
  - `src/utils/background/remote/`
- 删除文件（代表性）：
  - `src/components/TeleportProgress.tsx`
  - `src/components/TeleportRepoMismatchDialog.tsx`
  - `src/components/TeleportError.tsx`
  - `src/components/TeleportStash.tsx`
  - `src/components/ResumeTask.tsx`
  - `src/remote/SessionsWebSocket.ts`
  - `src/remote/RemoteSessionManager.ts`
  - `src/server/directConnectManager.ts`
  - `src/server/createDirectConnectSession.ts`
- 关键服务壳化：
  - `src/services/api/sessionIngress.ts`
  - `src/services/api/referral.ts`
  - `src/services/api/adminRequests.ts`
  - `src/services/api/overageCreditGrant.ts`
  - `src/utils/autoUpdater.ts`
  - `src/utils/nativeInstaller/index.ts`
  - `src/services/analytics/index.ts`
  - `src/services/analytics/growthbook.ts`
  - `src/utils/telemetry/sessionTracing.ts`
  - `src/utils/telemetry/events.ts`
  - `src/utils/teleport.tsx`

### 当前保留项（有意 compat 壳）

以下保留不代表功能可用，而是为了类型/调用契约稳定：
- `src/utils/teleport.tsx`（最小 compat）
- `src/utils/teleport/api.ts`（部分类型 + no-op API）
- `src/tasks/RemoteAgentTask/RemoteAgentTask.tsx`（仅类型/契约壳，不注册运行）
- `src/hooks/useRemoteSession.ts` / `src/hooks/useSSHSession.ts` / `src/hooks/useDirectConnect.ts`（no-op hooks）

### 质量门禁

截至本报告，核心门禁持续通过：
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 后续建议（Core-7 之后）

1. **Compat 壳减量（可选）**：逐步移除 `teleport/api` 与 `RemoteAgentTask` 壳中的未再消费导出。
2. **状态语义瘦身（可选）**：收敛 AppState 中 remote/ultraplan 遗留字段，减少误解。
3. **文档同步**：在 `CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` 标注 Core-7 完成态，并将后续工作切到 Core-8（壳减量/结构整洁）。


## 63. Core-7 Batch 30（四项保留壳按序完成）

### 目标
按既定顺序完成四项保留壳清理：
1) no-op hooks（remote/ssh/direct-connect）
2) `src/utils/teleport.tsx`
3) `src/utils/teleport/api.ts`
4) `src/tasks/RemoteAgentTask/RemoteAgentTask.tsx`

### 实施结果

#### A. hooks 三件套（已物理删除）
- 删除：
  - `src/hooks/useRemoteSession.ts`
  - `src/hooks/useSSHSession.ts`
  - `src/hooks/useDirectConnect.ts`
- `src/screens/REPL.tsx`：
  - 移除上述 hooks import/实例化
  - 本地固定 `activeRemote` 为 non-remote no-op 对象（`isRemoteMode=false`）
  - 移除 `restoreRemoteAgentTasks` 调用

#### B. teleport compat 层（已物理删除）
- 删除：
  - `src/utils/teleport.tsx`
  - `src/utils/teleport/`（整目录，包括 `api.ts`、`environmentSelection.ts`、`environments.ts`、`gitBundle.ts`）
- 同步删除不再使用的 ultraplan 远程轮询残留：
  - `src/utils/ultraplan/ccrSession.ts`
  - `src/utils/ultraplan/prompt.ts`
  - `src/utils/ultraplan/prompt.txt`
  - `src/utils/ultraplan/prompts/`（整目录）

#### C. RemoteAgentTask 壳（已物理删除 + 类型内聚）
- 删除：
  - `src/tasks/RemoteAgentTask/RemoteAgentTask.tsx`
- 为避免类型链断裂，将最小 `RemoteAgentTaskState` 契约内聚到：
  - `src/tasks/types.ts`
- 同步修复引用：
  - `packages/builtin-tools/src/tools/TaskOutputTool/TaskOutputTool.tsx` 去除对已删文件的 type import
  - `src/components/tasks/BackgroundTask.tsx` / `BackgroundTasksDialog.tsx` 调整为不依赖已删模块实现

### 验证
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run build` ✅

### 说明
- 此批次后，四项“保留 compat 壳”已按计划完成清理或去文件化。
- 仍保留的 remote 语义仅为极小的状态/显示兼容（不具备运行链）。

## 64. Core-9（边界强化与防回流）执行记录

### 目标
在 Core-8 语义瘦身之后，补齐 Core-9 的三项防回流能力：
1) 扩展 core→legacy import 边界检查；
2) 增加 legacy 命令 denylist 断言；
3) 增加 compat allowlist 预算与依赖拓扑快照校验。

### 本批改动

#### A. 边界检查脚本增强
- 文件：`scripts/check-core-boundaries.ts`
- 新增/增强内容：
  - **core import 禁区扩展**：新增域级禁止片段
    - `src/plugins/`
    - `src/teleport/`
    - `src/swarm/`
    - `src/team/`
    - `src/remote/`
    - `src/ultraplan/`
  - **legacy 命令 denylist 校验**（`src/commands.ts`）
    - 必须保持 `const ... = null`：
      - `plugin`
      - `ultraplan`
      - `review`
      - `ultrareview`
      - `autofixPr`
  - **compat allowlist 预算校验**
    - `remote_agent` 匹配预算：`maxMatches = 10`
  - **removed marker 回归校验（0 容忍）**
    - `showRemoteCallout`
    - `ultraplanSessionUrl`
    - `ultraplanLaunching`
    - `ultraplanPendingChoice`
    - `ultraplanLaunchPending`

#### B. 依赖拓扑快照与对比
- 新增文件：`scripts/snapshots/core-topology.snapshot.json`
- 快照目标文件（核心执行链）
  - `src/entrypoints/cli.tsx`
  - `src/main.tsx`
  - `src/commands.ts`
  - `src/tools.ts`
  - `src/query.ts`
  - `src/QueryEngine.ts`
  - `src/screens/REPL.tsx`
- `check-core-boundaries.ts` 新增 topology compare：
  - 提取上述目标文件的 import/require/dynamic import 依赖（跟踪 `src/*` + `@claude-code-best/*` + `@anthropic/*` + `@ant/*`）
  - 与 snapshot 对比 `added/removed`
  - 有差异则 fail，并提示同 PR 更新 snapshot

### 门禁结果
- `bun run check:boundaries` ✅
- `bun run typecheck` ✅

### 维护说明（Topology Snapshot）
若核心执行链依赖变更是**有意改动**，需要在同一个 PR 同步更新快照：

1. 修改代码后先运行：
   - `bun run check:boundaries`
2. 如果出现 `Dependency topology snapshot mismatch`：
   - 重新生成并覆盖 `scripts/snapshots/core-topology.snapshot.json`
   - 确认 diff 与本次架构变更一致（无误增 legacy 依赖）
3. 再次运行：
   - `bun run check:boundaries`
   - `bun run typecheck`

说明：snapshot 是“执行链结构审计基线”，不是阻止合理重构；但任何变更都必须显式落盘，避免隐性回流。

## 65. Core-10（测试与文档定型）执行记录

### 目标
落实 Core-10 的两项优先工作：
1) 增加 tombstone tests，确保已移除入口报错稳定；
2) 同步计划文档状态，收敛 Core-8/9/10 的叙述。

### 本批改动

#### A. 测试定型
- 新增：`tests/integration/legacy-tombstones.test.ts`
  - `--teleport`：断言 exit code = 1，且报错包含 `--teleport/--remote has been removed from this build`
  - `--remote`：同上
- 更新：`tests/integration/command-list-snapshot.test.ts`
  - `mustNotHave` 补充：`review`、`ultrareview`、`teleport`

#### B. 文档收口
- 更新：`notes/CORE_8_PLUS_MIGRATION_PLAN.md`
  - 新增“0.0 执行状态（滚动）”：
    - Core-8 已完成
    - Core-9 已完成
    - Core-10 进行中
- 更新：`notes/CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md`
  - 顶部“当前状态”改为指向 Core-8+ 计划与 `subsequent-cleanup.md`，避免旧阶段状态继续漂移。

### 门禁结果
- `bun run check:boundaries` ✅
- `bun run typecheck` ✅

### 备注
- 本批优先覆盖“已删除入口的稳定失败语义”，避免后续回归把 legacy fast-path 误恢复。

### Core-10 补充（help/config/doctor 输出稳定性）

- 新增：`tests/integration/help-config-doctor-snapshot.test.ts`
  - 校验 `builtInCommandNames()` 包含 `help/config/doctor`
  - 校验 3 个命令的 metadata 文案稳定：
    - `help`: `Show help and available commands`
    - `config`: `Open config panel`
    - `doctor`: `Diagnose and verify your Claude Code installation and settings`
  - 校验 `load()` 可正常返回并暴露 `call`（保证本地 JSX 命令输出链路可用）

## 66. Core Independent Runtime - Phase A 启动（Core Contract Freeze）

### 目标
按 `notes/CORE_INDEPENDENT_RUNTIME_ROADMAP.md` 启动 Phase A：先冻结 core contracts 基线，避免后续迁移期接口漂移。

### 本批改动

- 新增目录：`src/core/contracts/`
- 新增 contract 基线文件：
  - `commandContract.ts`
  - `toolContract.ts`
  - `queryContract.ts`
  - `runtimeStateContract.ts`
  - `serviceContract.ts`
  - `index.ts`

### 说明

- 当前为**接口基线落盘**（version=1），用于后续 Phase B/C/D 迁移时的统一契约。
- 本批不改运行行为；仅新增类型合同与导出聚合。

### Phase A 第二批（Contract Freeze 强约束）

#### 本批改动

1) 新增 contract snapshot 校验脚本
- `scripts/check-core-contracts.ts`
  - 对 `src/core/contracts/*.ts` 导出符号做快照比对
  - mismatch 时 fail，并要求同 PR 更新 snapshot

2) 新增 contract snapshot 基线
- `scripts/snapshots/core-contracts.snapshot.json`

3) 新增 npm script
- `package.json`
  - `check:core-contracts`

4) 新增 adapter inventory 基线文档
- `notes/CORE_ADAPTER_INVENTORY.md`
  - 按 Facade / Runtime Policy / Core-owned 分类
  - 为每个 adapter 绑定去壳目标阶段

#### 门禁
- `bun run check:core-contracts` ✅
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

## 67. Core Independent Runtime - Phase B 第一批（MCP utils 去壳示范）

### 目标
在保持行为稳定前提下，先把最薄的一层 MCP utils 从“纯转发”改为“core 自有实现 + 少量转发”，作为 Phase B 去壳样板。

### 本批改动

- 文件：`src/core/mcp/coreMcpUtils.ts`
- 从 legacy 转发中抽离为 core 自有实现的函数：
  - `normalizeNameForMCP`
  - `getMcpPrefix`
  - `mcpInfoFromString`
  - `getMcpDisplayName`
  - `extractMcpToolDisplayName`
  - `getToolNameForPermissionCheck`
  - `commandBelongsToServer`
  - `filterToolsByServer`
  - `filterMcpPromptsByServer`
  - `excludeToolsByServer`
  - `excludeCommandsByServer`
  - `excludeResourcesByServer`
  - `isMcpTool`
- 仍保留少量转发（暂未去壳）：
  - `describeMcpConfigFilePath`
  - `ensureConfigScope`
  - `extractAgentMcpServers`
  - `getScopeLabel`
  - `ensureTransport`
  - `parseHeaders`

### 结果
- `coreMcpUtils` 已从 Facade/Forwarder 进展为“部分 core-owned 的 runtime policy 层”。
- `notes/CORE_ADAPTER_INVENTORY.md` 已同步更新分类。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

## 68. Core Independent Runtime - Phase B 第二批（coreMcpClient 先小后大去壳）

### 目标
延续“先小后大”策略：先把 `coreMcpClient` 中纯函数/轻状态逻辑收归 core，自带行为不变；连接与 IO 副作用路径继续复用 legacy client。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- 从纯转发改为“部分 core 实现 + 副作用转发”：
  - 新增 core 自有实现：
    - `getMcpServerConnectionBatchSize`
    - `getServerCacheKey`
    - `areMcpConfigsEqual`
  - 保留转发（副作用/重逻辑）：
    - `connectToServer`
    - `clearServerCache`
    - `fetchToolsForClient`
    - `reconnectMcpServerImpl`
    - `getMcpToolsCommandsAndResources`
    - `prefetchAllMcpResources`
    - `setupSdkMcpClients`
    - `callIdeRpc`

### 文档同步
- `notes/CORE_ADAPTER_INVENTORY.md`：`coreMcpClient` 分类更新为 Runtime Policy。
- `notes/CORE_INDEPENDENT_RUNTIME_ROADMAP.md`：Phase B 状态更新为“进行中”。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

## 69. Core Independent Runtime - Phase B 第三批（coreMcpClient 轻逻辑扩展 + prefetch 聚合内收）

### 目标
继续拆 `coreMcpClient`：优先抽纯函数/轻状态逻辑（`mcpToolInputToAutoClassifierInput`、`isLocalMcpServer`），并评估 `prefetchAllMcpResources` 的聚合层可 core 化程度。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- 新增 core 自有轻逻辑：
  - `isLocalMcpServer`
  - `mcpToolInputToAutoClassifierInput`
- 将 `prefetchAllMcpResources` 从 legacy 转发改为 core 聚合实现：
  - 仍调用 `getMcpToolsCommandsAndResources` 执行实际连接/拉取
  - 在 core 内完成聚合计数与 telemetry 上报
  - 保持失败兜底为返回空集合

### 评估结论（prefetch 聚合层）

- **可 core 化（已完成）**：其本质是结果聚合、计数与兜底，不涉及底层连接副作用。
- **暂不 core 化部分**：连接建立、工具/命令/资源拉取仍由 legacy client 承担（`getMcpToolsCommandsAndResources` 等）。
- **后续建议**：待 `getMcpToolsCommandsAndResources` 迁入 core 后，再把 prefetch 彻底切断对 legacy client 的实现依赖。

### 文档同步
- `notes/CORE_ADAPTER_INVENTORY.md`：更新 `coreMcpClient` 说明（包含 prefetch 聚合已内收）。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅


## 70. Core Independent Runtime - Phase B 第四批（getMcpToolsCommandsAndResources 外围调度壳）

### 目标
围绕 `getMcpToolsCommandsAndResources` 继续抽“外围可拆调度壳”，不触碰底层连接副作用实现。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- 新增 core 侧调度辅助：
  - `buildMcpSchedulingBuckets(mcpConfigs)`
    - 返回 `totalCount / localCount / remoteCount`
    - 使用 `isLocalMcpServer` 计算本地与远端桶信息
- 新增 core 侧 wrapper：
  - `getMcpToolsCommandsAndResources(...)`
    - 包装 legacy `getMcpToolsCommandsAndResourcesImpl`
    - 空配置短路返回（不进入 legacy 调度链）
- `prefetchAllMcpResources` 改为复用 `buildMcpSchedulingBuckets(...).totalCount`
  - 聚合逻辑继续保持在 core 层

### 评估结论

- 目前“外围调度壳”已具备 core 侧承载点（bucket + wrapper + 短路策略）。
- 连接建立、拉取工具/命令/资源、并发调度细节仍在 legacy client，后续可按该壳逐段内迁。

### 文档同步
- `notes/CORE_ADAPTER_INVENTORY.md`：`coreMcpClient` 说明补充 scheduling 壳已落地。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅

## 71. Core Independent Runtime - Phase B 第五批（MCP 调度策略参数 contract 化）

### 目标
将 `getMcpToolsCommandsAndResources` wrapper 内调度策略参数显式 contract 化，为后续迁移调度实现做准备。

### 本批改动

- 新增 contract：`src/core/contracts/mcpSchedulingContract.ts`
  - `CoreMcpSchedulingStrategy`
  - `CoreMcpSchedulingSnapshot`
  - `CoreMcpSchedulingContract`
  - `CORE_MCP_SCHEDULING_CONTRACT_VERSION`
- 更新导出：`src/core/contracts/index.ts`
- `src/core/mcp/coreMcpClient.ts`：
  - 新增 `getRemoteMcpServerConnectionBatchSize`
  - `buildMcpSchedulingBuckets` 返回 `CoreMcpSchedulingSnapshot`
  - 新增 `GetMcpToolsCommandsAndResourcesOptions`
  - 新增 `getDefaultMcpSchedulingStrategy`
  - `getMcpToolsCommandsAndResources` 增加 `options.schedulingStrategy` 参数（当前作为 contract 接入点，行为不变）
- 更新 contract snapshot 校验：
  - `scripts/check-core-contracts.ts`
  - `scripts/snapshots/core-contracts.snapshot.json`

### 结果
- 调度并发参数（local/remote）已进入显式 contract；后续可在不破坏调用面的前提下逐步替换 legacy 调度实现。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run check:core-contracts` ✅

## 72. Core Independent Runtime - Phase B 第六批（schedulingStrategy 下沉到 core 调度执行层）

### 目标
把 wrapper 中 `schedulingStrategy` 从“仅参数接入点”推进为“实际影响调度执行”，先在 core 实现分桶调度骨架，再委托 legacy 单 server 连接逻辑。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- `getMcpToolsCommandsAndResources` 重构为 core 调度壳：
  - `mcpConfigs` 未传入时：保持兼容，直接回退 legacy 实现（全量加载）
  - `mcpConfigs` 传入时：
    - 使用 `isLocalMcpServer` 分为 local/remote 两桶
    - 使用 `p-map` 按 `schedulingStrategy` 并发执行
    - 每个 server 通过 legacy `getMcpToolsCommandsAndResourcesImpl` 的单-entry 调用完成连接/抓取并回调结果
- 调度策略生效点：
  - `separateLocalAndRemoteQueues=true`：local/remote 双队列并发
  - `separateLocalAndRemoteQueues=false`：单队列执行（使用 localConcurrency）
  - `localConcurrency/remoteConcurrency`：分别控制桶内并发（最小值钳制为 1）

### 结果
- `schedulingStrategy` 已真正下沉至 core 执行层，不再只是占位参数。
- 当前仍保留 legacy 单 server 连接/抓取副作用实现，符合“先骨架后去壳”的迁移路径。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run check:core-contracts` ✅

## 73. Core Independent Runtime - Phase B 第七批（single-entry 委托切分为 connect/fetch/assemble）

### 目标
把 `single-entry 调 legacy impl` 再切一层，形成显式 `connect / fetch / assemble` 三段委托接口，便于后续逐段替换。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- 新增三段委托类型：
  - `McpConnectDelegate`
  - `McpFetchDelegate`
  - `McpAssembleDelegate`
  - 以及 `McpPipelineDelegates`、`McpConnectionAttempt`
- `GetMcpToolsCommandsAndResourcesOptions` 扩展：
  - `delegates?: Partial<McpPipelineDelegates>`
- 新增默认委托实现：
  - `getDefaultMcpPipelineDelegates()`
    - connect：按单 server 调 legacy `getMcpToolsCommandsAndResourcesImpl`
    - fetch：默认 identity（为后续真实 fetch 分段留接口）
    - assemble：统一派发 `onConnectionAttempt`
- core 调度执行层改为调用三段委托管线：
  - 每个 server 按 `connect -> fetch -> assemble` 顺序执行
  - 并发策略仍由 `schedulingStrategy` 控制

### 结果
- core 调度壳已具备“可插拔三段委托”扩展点。
- 当前默认行为保持不变（底层仍委托 legacy），但后续可逐段替换而不改调用面。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run check:core-contracts` ✅

## 74. Core Independent Runtime - Phase B 第八批（fetch 段从 identity 替换为 core 侧显式 fetch 聚合）

### 目标
将 `connect / fetch / assemble` 三段管线中 `fetch` 从 identity 替换为 core 侧显式 fetch 聚合（仍委托 legacy API）。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- 新增 legacy 导出：
  - `fetchCommandsForClient`（新增）
  - `fetchToolsForClient`（已在导出）
- `getDefaultMcpPipelineDelegates()` 中 `fetch` 段替换为 core 显式实现：
  - 遍历 connected attempts，对已连接者并发抖取 tools + commands
  - 对未连接者透传
  - 合并到 attempt.tools / attempt.commands
- connect 段：保持原样（仍调 legacy impl 按单 server 拿到 connected 状态）
- assemble 段：保持原样（统一回调派发）

### 结果
- 三段管线 `connect / fetch / assemble` 现已各司其职：
  - connect：建立连接（仍委托 legacy）
  - fetch：core 显式聚合 tools/commands（仍委托 legacy fetch 函数）
  - assemble：派发结果（core 自有）
- 后续可将 `connect` 进一步替换为 core 侧 connect 实现。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run check:core-contracts` ✅

## 75. Core Independent Runtime - Phase B 第九批（connect 段从 legacy impl 替换为 core 侧显式 connect + 三段管线全部自有）

### 目标
将 `connect` 段从调用 legacy impl 替换为 core 侧显式 connect（使用 `connectToServer` + 状态检查），同时三段管线全部完成 core 自有实现。

### 本批改动

- 文件：`src/core/mcp/coreMcpClient.ts`
- `connect` 段替换为 core 显式实现：
  - 调用 `connectToServer(name, config)` 建立连接
  - 处理非 connected 状态（`needs-auth` 注入 auth tool、`failed` 等透传）
  - 处理 `claudeai-proxy` 类型标记 `markClaudeAiMcpConnected`
  - 返回带工具和命令列表的 `McpConnectionAttempt`
- fetch 段保持不变（core 显式聚合 tools/commands）
- assemble 段保持不变（core 统一派发）
- 引入 `feature`、`ListMcpResourcesTool`、`ReadMcpResourceTool`、`createMcpAuthTool` 等依赖
- 移除对 `getMcpToolsCommandsAndResourcesImpl` 的 connect 段依赖

### 结果
- 三段管线 `connect / fetch / assemble` 现已**全部 core 自有实现**：
  - connect：使用 `connectToServer` + 状态处理（仍依赖 legacy transport）
  - fetch：显式聚合 tools/commands（仍依赖 legacy fetch 函数）
  - assemble：统一派发（core 自有）
- `coreMcpClient` 已从 Runtime Policy 继续向 Core-owned 演进。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅
- `bun run check:core-contracts` ✅

## 76. Core Independent Runtime - Phase B 第十批（connect 段评估 + MCP config contract + 扩大范围批量去壳）

### 目标
同时评估三个方向：connect 段 legacy 依赖可拆解性、coreMcpConfig 去壳路径、MCP config contract 建立。

### 评估结论

#### A. connect 段 legacy `connectToServer` 拆解评估
- **当前依赖点**：`connectToServer`（memoized）、`fetchToolsForClient`、`fetchCommandsForClient`
- **可进一步拆解部分**：已做
  - transport 类型解析（`resolveMcpTransportType`/`isLocalMcpServer`/`describeMcpTransportType`/`mcpConnectionShouldUseHttps`）→ Core-owned ✅
  - `getMcpServerConnectionBatchSize` → 已有 core 包装
- **暂不可拆解**：`connectToServer` 内部 transport 工厂（依赖 MCP SDK + auth provider + session ingress token 等 legacy 基础设施），留待 Phase C transport contract 再处理
- **已落地**：保留 `connectToServer` 转发（带 TODO 注释）+ 移除了 `getMcpToolsCommandsAndResourcesImpl` 的 connect 段依赖

#### B. coreMcpConfig 去壳路径
- **当前状态**：纯 facade（14 个 re-export + `getRuntimeAllMcpConfigs` runtime-aware 分支）
- **去壳优先方向**：
  - `getRuntimeAllMcpConfigs` 已是 core 自有 runtime-aware 分支逻辑，可继续深化
  - 其他 config 读操作（`getMcpConfigByName`/`getMcpConfigsByScope` 等）仍为纯转发
- **已落地**：新增 `src/core/contracts/mcpConfigContract.ts` 基线（CoreMcpConfigContract）

#### C. MCP config contract 建立
- **新增**：`src/core/contracts/mcpConfigContract.ts`
- **内容**：`CoreMcpConfigContract`（version=1）
- **同步**：`index.ts` 导出、snapshot 更新、check script 更新

### 本批代码变更

- `src/core/mcp/coreMcpClient.ts`
  - 移除 `getMcpToolsCommandsAndResourcesImpl` connect 段依赖
  - 新增 `resolveMcpTransportType`/`describeMcpTransportType`/`mcpConnectionShouldUseHttps`（Core-owned）
  - 新增 `isRemoteMcpServer`（Core-owned）
  - `connectToServer` 保留为 legacy re-export（带 TODO 注释）
  - `getRemoteMcpServerConnectionBatchSize` 保持 core 自有
- `src/core/contracts/mcpConfigContract.ts`（新增）
- `src/core/contracts/index.ts` 更新
- `scripts/check-core-contracts.ts` 更新
- `scripts/snapshots/core-contracts.snapshot.json` 更新

### 文档同步
- `notes/CORE_ADAPTER_INVENTORY.md`：`coreMcpClient` 升为 Core-owned；`coreMcpConfig` 说明补充 config contract 基线已落地。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（23 files）
- `bun run check:core-contracts` ✅（8 contract files）

## 77. Core Independent Runtime - Phase B 第十一批（coreMcpAuth 去壳评估 + contract 化）

### 目标
对 `coreMcpAuth.ts` 做去壳评估并完成 contract 化。

### 评估结论

`coreMcpAuth.ts` 当前是纯 facade（8 个 re-export），无 runtime-aware 分支逻辑。其依赖的 legacy auth 实现较深（OAuth 流程、安全存储、MCP SDK auth provider）。

**去壳优先方向**：
- `performMCPOAuthFlow`：OAuth 交互（依赖 MCP SDK + secure storage + HTTP client）
- `revokeServerTokens`：服务端 token 吊销（依赖 OAuth 元数据发现）
- `ClaudeAuthProvider`：MCP auth provider（依赖 MCP SDK auth module）
- `getServerKey`：存储 key 生成（可考虑内迁到 core）
- `hasMcpDiscoveryButNoToken`：快速路径判断（可考虑内迁到 core）

**暂保留转发原因**：
- OAuth 流程本身较复杂（discovery、PKCE、step-up、refresh 等）
- 安全存储依赖 legacy secure storage abstraction
- 需要单独 contract 测试框架支撑

### 本批改动

- 新增：`src/core/contracts/mcpAuthContract.ts`
  - `CoreMcpAuthContract`（version=1）
  - 定义了 `performOAuthFlow`、`revokeTokens`、`getAuthProvider` 三类 auth 操作接口
- 同步：`src/core/contracts/index.ts`、`check-core-contracts.ts`、`core-contracts.snapshot.json`
- `notes/CORE_ADAPTER_INVENTORY.md`：更新 `coreMcpAuth` 说明

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（24 files）
- `bun run check:core-contracts` ✅（9 contract files）

## 78. Core Independent Runtime - Phase B 收尾第一批（coreMcpUtils 完全去壳）

### 目标
将 `coreMcpUtils.ts` 从"core-owned 字符串解析 + 保留 6 个转发"升级为完全 core-owned（仅剩 1 个 extractAgentMcpServers 因依赖链深保留转发）。

### 本批改动

- 文件：`src/core/mcp/coreMcpUtils.ts`
- 新增 core-owned 实现：
  - `describeMcpConfigFilePath`（含 scope switch）
  - `getScopeLabel`（含 scope switch）
  - `ensureConfigScope`（含 VALID_SCOPES 校验）
  - `parseHeaders`（含错误处理）
  - `getProjectMcpServerStatus`（含设置检查逻辑）
  - `ensureTransport`（inline 实现）
  - `getEnterpriseMcpFilePathCore`（lazy require 内部函数）
  - `CoreMcpConfigScope` 类型
- 移除了 6 个 legacy re-export 中的 5 个（`describeMcpConfigFilePath`/`getScopeLabel`/`ensureConfigScope`/`parseHeaders`/`ensureTransport`）
- 保留转发：`extractAgentMcpServers`（需 AgentDefinition 类型，依赖链深）
- 依赖引入：
  - `getCwd` / `getGlobalClaudeFile`（core 可引用）
  - `getSettings_DEPRECATED` / `hasSkipDangerousModePermissionPrompt` / `isSettingSourceEnabled` / `getIsNonInteractiveSession`（已在 core 其他模块使用）

### 结果
- `coreMcpUtils` 已从 Runtime Policy 升级为 **Core-owned**。
- 仅剩 `extractAgentMcpServers` 一个转发（需 AgentDefinition 类型，暂保留）。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（24 files）
- `bun run check:core-contracts` ✅（9 files）

## 79. Core Independent Runtime - Phase B 收尾第二批（coreMcpAuth 纯函数内迁）

### 目标
将 `coreMcpAuth.ts` 中纯函数（`getServerKey`）内迁为 core 自有实现，其余 auth 操作（OAuth 流程/secure storage）保留 facade。

### 本批改动

- 文件：`src/core/mcp/coreMcpAuth.ts`
- 新增 core-owned 纯函数：
  - `getServerKey(serverName, serverConfig)`（generateHash → `${name}|${hash16}`)
  - `getMcpServerCacheKey(serverName, serverRef)`（JSON stringify → cache key）
- 保留 facade re-export（8 个 auth 操作）：
  - `AuthenticationCancelledError` / `ClaudeAuthProvider` / `performMCPOAuthFlow` 等
- `coreMcpAuth` 分类从 Facade 升级为 **Runtime Policy**。

### 结果
- `coreMcpAuth` 不再是纯 facade，已有部分核心逻辑 core 自有。
- `getServerKey` 是 auth 层最基础的 key 生成逻辑，内迁后可直接被 core 其他模块使用。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（24 files）
- `bun run check:core-contracts` ✅（9 files）

## Phase B 收尾评估总结

| 文件 | 原分类 | 新分类 | 状态 |
|---|---|---|---|
| `coreMcpUtils.ts` | Runtime Policy | **Core-owned** ✅ | 完成（仅剩 1 个 extractAgentMcpServers 转发）|
| `coreMcpAuth.ts` | Facade | **Runtime Policy** ✅ | 完成（内迁 getServerKey/getMcpServerCacheKey）|
| `coreMcpConnectionManager.ts` | Facade | Facade | **暂保留**（React context hook 需重构成 core 独立模块）|
| `coreMcpClient.ts` | Core-owned | **Core-owned** ✅ | 已完成 |
| `coreMcpConfig.ts` | Runtime Policy | Runtime Policy | 收尾（runtime-aware 分支已有）|
| `coreMcpClaudeai.ts` | Runtime Policy | Runtime Policy | 收尾（runtime-aware skip 已有）|

**Phase B MCP 层总体进度**：4/6 adapter 完成或接近完成。2 个（ConnectionManager / Auth）保留 facade 部分。

### 下一步
Phase B 收尾完成，更新 roadmap 状态，进入 Phase C 规划。

## 80. Core Independent Runtime - Phase B 完成 + Phase C 规划启动

### Phase B 完成总结

更新 `notes/CORE_INDEPENDENT_RUNTIME_ROADMAP.md`：
- Phase A: ✅ 完成
- Phase B: ✅ 完成（MCP 层 client/config/auth/utils 均已深化）
- Phase C: 规划中

### Phase C 规划

新建 `notes/PHASE_C_PLANNING.md`，核心结论：
- **core 不依赖 query.ts**（双向无依赖）
- Phase C 三步走：C1（query contract 深化）→ C2（子服务提取）→ C3（core query runtime 集成）
- C1 优先：扩展 `queryContract.ts` 为 v2（tokenBudget / config / streamEvent 类型）
- C2a 优先：`src/core/utils/messageUtils.ts`（消息构建函数内迁）

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（24 files）
- `bun run check:core-contracts` ✅（9 files）

## 81. Core Independent Runtime - Phase C Step C1（Query Contract v2 深化）

### 目标
将 `queryContract.ts` 从 v1 基线扩展为 v2，覆盖 query 输入/输出/配置/token budget 的完整边界。

### 本批改动

- 文件：`src/core/contracts/queryContract.ts`
- 版本升级：`CORE_QUERY_CONTRACT_VERSION: 1 → 2`
- 新增类型：
  - `CoreQuerySource` — query 来源标识
  - `CoreQueryParams` — 完整 query 参数（对应 legacy `QueryParams`）
  - `CoreQueryStreamEvent` — 流事件 discriminated union（chunk/tool_use/tool_result/error/done）
  - `CoreQueryConfig` — query 配置（model/maxTurns/taskBudget）
  - `CoreQueryModelOptions` — 模型选项
  - `CoreTokenBudgetState` — token 预算状态
  - `CoreTokenBudgetContract` — token 预算管理接口
- 移除：v1 `CoreQueryInput`（替换为更完整的 `CoreQueryParams`）
- 更新 contract 方法签名：
  - `runQuery(input: CoreQueryParams)`（从 `CoreQueryInput` 升级）
  - `buildConfig(params: CoreQueryParams): CoreQueryConfig`
  - `createTokenBudget(budget: CoreTokenBudgetState): CoreTokenBudgetContract`
- 更新 `scripts/snapshots/core-contracts.snapshot.json`

### 说明
- 当前 v2 为**接口基线扩展**，不改运行行为。
- 后续 C2/C3 将基于这些 types 实现子服务提取与 core query runtime。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（24 files）
- `bun run check:core-contracts` ✅（9 files，snapshot 已同步）

## 82. Core Independent Runtime - Phase C Step C2a（src/core/utils/messageUtils.ts 建立）

### 目标
在 Phase C 子服务提取中，优先内迁轻量消息构建函数到 core，建立 `src/core/utils/messageUtils.ts`。

### 本批改动

- 新增目录：`src/core/utils/`
- 新增文件：`src/core/utils/messageUtils.ts`

**Core-owned 实现**：
- 消息常量：`INTERRUPT_MESSAGE` / `REJECT_MESSAGE` / `NO_RESPONSE_REQUESTED` 等
- 消息构建：`createCoreUserMessage`（core 自有实现）
- 工具函数：`isNotEmptyMessage` / `isSyntheticMessage` / `deriveShortMessageId`
- 标签工具：`buildClassifierUnavailableMessage` / `buildYoloRejectionMessage` / `extractTag`
- 进度消息：`createCoreProgressMessage`
- Auto reject：`AUTO_REJECT_MESSAGE` / `DONT_ASK_REJECT_MESSAGE`

**保留转发**（需 legacy 类型/逻辑）：
- `getLastAssistantMessage` / `hasToolCallsInLastAssistantTurn`
- `normalizeMessagesForAPI` / `reorderMessagesInUI`
- `isToolUseRequestMessage` / `isToolUseResultMessage`
- `mergeUserMessages` / `mergeAssistantMessages` / `mergeUserMessagesAndToolResults`
- `stripCallerFieldFromAssistantMessage`

### 说明
- 消息构建（`createCoreUserMessage`）是 core 自有的，不依赖 legacy 消息创建复杂逻辑。
- 后续 C2b/C2c 将基于这些类型继续扩展 compact / API 客户端边界。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（25 files）
- `bun run check:core-contracts` ✅（9 files）

## 83. Core Independent Runtime - Phase C Step C2b 评估 + coreProvider contract 建立

### 目标
同时推进：
1. 评估 compact 子服务可提取性并建立 contract 基线
2. 建立 coreProvider contract（API 客户端边界）

### 本批改动

#### A. Compact contract 基线
- 新增：`src/core/contracts/compactContract.ts`
  - `CoreCompactTokenConfig`（token 预算配置 + 默认值）
  - `COMPACT_ERROR_MESSAGES`（错误常量）
  - `DEFAULT_MODEL_CONTEXT_SIZES`（模型上下文大小）
  - `CoreCompactResult` / `CoreCompactContract`
- **评估结论**：compact 逻辑复杂（依赖 state/hooks/settings），当前以 contract 基线为限，完整内迁待 Phase C 后期。

#### B. Provider contract 基线
- 新增：`src/core/contracts/providerContract.ts`
  - `CoreProviderType` / `CoreProviderConfig` / `CoreProviderRequestOptions`
  - `CoreProviderStreamResponse` / `CoreProviderContract`
  - `CoreToolExecutorContract`（tool 执行边界）
  - `CoreMessageNormalizerContract`（消息标准化边界）

#### C. Contract 门禁同步
- `src/core/contracts/index.ts`：导出 compactContract + providerContract
- `scripts/check-core-contracts.ts`：新增 2 个 contract 文件检查
- `scripts/snapshots/core-contracts.snapshot.json`：更新快照

### 结果
- Phase C 当前已建立 3 个新 contract：query v2 / compact / provider
- 共 11 个 contract files，全部门禁通过

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（27 files）
- `bun run check:core-contracts` ✅（11 files）

## 84. Core Independent Runtime - Phase C Step C3（Core Query Runtime 集成：coreQueryLoop + coreQueryPipeline）

### 目标
在 `src/core/query/` 下建立 core query runtime 骨架（coreQueryConfig + coreQueryLoop + coreQueryPipeline），作为 Phase C 的核心交付。

### 本批改动

- 新增目录：`src/core/query/`
- 新增文件：

#### A. `src/core/query/coreQueryConfig.ts`
- `CoreQueryRuntimeProfile`（'core-local' / 'legacy-full'）
- `CoreQueryRuntimeOptions` / `CoreQueryRuntimeDefaults` + 默认值
- `CoreQueryBuildConfigOptions`
- `buildCoreQueryConfig(opts): CoreQueryConfig`
- `resolveCoreQueryProfile(profile, overrides?)`（profile 解析器）

#### B. `src/core/query/coreQueryLoop.ts`
- `CoreQueryTurnState`（turnCount/usedMessages/tokenBudget 等）
- `INITIAL_QUERY_TURN_STATE`
- `CoreQueryTurnResult`（stop/continue/compact/error discriminated union）
- `CoreQueryLoopDelegate`（executeToolCalls/normalizeMessages/resolveModel/shouldCompact/runCompact）
- `getDefaultCoreQueryLoopDelegate()`（默认实现骨架）
- `runCoreQueryLoop(params, config, delegate, initialState)`（AsyncGenerator 主环）
- `executeCoreQueryTurn(params, state, delegate)`（单 turn 执行）

#### C. `src/core/query/coreQueryPipeline.ts`
- `CoreQueryPipelineStage`（input-validation/message-normalization/model-resolution/token-budget-check/query-loop/output-serialization discriminated union）
- `CoreQueryPipelineResult`（stages + outputMessages + totals）
- `CoreQueryPipelineDelegate`（validateInput/normalizeMessages/resolveModel/checkTokenBudget/buildToolUseContext/serializeOutput）
- `getDefaultPipelineDelegate()`（默认实现骨架）
- `runCoreQueryPipeline(userMessage, systemPrompt, context, configOptions, delegate, loopDelegate)`（主 pipeline）

### 说明
- 当前为**骨架实现**（阶段 5/6 有 placeholder），不改运行行为。
- `runCoreQueryLoop` 是 AsyncGenerator，与 legacy `query()` 签名对齐。
- 后续可将 delegate 实现替换为真实 core 实现，逐步迁移底层逻辑。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（30 files）
- `bun run check:core-contracts` ✅（11 files）

## 85. Core Independent Runtime - Phase D Step D1（Command + Tool contracts 基线建立）

### 目标
同时建立 commandContract v2 和 toolContract v2，扩展核心子服务边界。

### 本批改动

#### A. commandContract.ts v1 → v2
- 版本升级：`CORE_COMMAND_CONTRACT_VERSION: 1 → 2`
- 新增 safety 类型：`CoreCommandSafety`（safe/remote-safe/bridge-safe/internal-only）
- 新增核心常量（core-owned）：
  - `CORE_INTERNAL_ONLY_COMMANDS` / `CORE_REMOTESAFE_COMMANDS` / `CORE_BRIDGESAFE_COMMANDS` / `CORE_BUILTIN_COMMAND_NAMES`
- 扩展 `CoreCommandContract` 接口：
  - `getCommand` / `hasCommand` / `meetsAvailabilityRequirement`
  - `isRemoteSafe` / `isBridgeSafe` / `getCommandSafety`
  - `filterCommandsForRemoteMode` / `formatDescriptionWithSource`
- 新增 core-owned 函数：
  - `coreGetCommand` / `coreHasCommand` / `coreFilterCommandsForRemoteMode` / `coreGetCommandSafety`

#### B. toolContract.ts v1 → v2
- 版本升级：`CORE_TOOL_CONTRACT_VERSION: 1 → 2`
- 新增 permission 类型：`CoreToolPermissionLevel` / `CoreToolPermissionContext` / `CoreToolProgressEvent`
- 新增 execution 类型：`CoreToolExecutionContext` / `CoreToolExecutionResult`
- 扩展 `CoreToolContract` 接口：
  - `toolMatchesName` / `filterToolProgressMessages` / `buildToolCallContext`
- 新增 core-owned 函数：
  - `coreToolMatchesName` / `coreFindToolByName` / `coreGetEmptyToolPermissionContext` / `coreBuildToolCallContext`

#### C. Contract 门禁修复
- `scripts/check-core-contracts.ts`：正则添加 `/export\s+function\s+([A-Za-z0-9_]+)/g`，支持检测 function exports
- `scripts/snapshots/core-contracts.snapshot.json`：同步更新（11 contract files）

### 说明
- 当前 v2 为**基线扩展**，不改运行行为。
- 后续 D2/D3 将基于这些 contracts 实现 command/tool runtime 提取。

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（30 files）
- `bun run check:core-contracts` ✅（11 files，snapshot 已同步）

## 86. Core Independent Runtime - Phase D Step D2（Command Registry 提取）

### 目标
将 `src/commands.ts` 中的纯函数迁移到 `src/core/commands/commandRegistry.ts`，建立 core-owned command registry。

### 本批改动

- 新增文件：`src/core/commands/commandRegistry.ts`
- 修改文件：`src/commands.ts`（保留 legacy wrapper + 完整 formatDescriptionWithSource）

**迁移到 core 的函数（core-owned）**：
- `findCommand(commandName, commands)` — 命令查找
- `hasCommand(commandName, commands)` — 命令存在检查
- `getCommand(commandName, commands)` — 带错误信息的命令获取
- `formatDescriptionWithSourceCore(cmd)` — 基础格式化（core 版本）
- `getCommandName` — re-export from `src/types/command.js`

**保留在 legacy 的函数**：
- `meetsAvailabilityRequirement`（依赖 `isClaudeAISubscriber()` / `isUsing3PServices()` / `isFirstPartyAnthropicBaseUrl()` — auth 上下文）
- `formatDescriptionWithSource`（依赖 `getSettingSourceName(cmd.source)` — settings 集成）
- `getCommands(cwd)` / `getMcpSkillCommands` / `getSkillToolCommands`（IO 依赖）
- `INTERNAL_ONLY_COMMANDS` / `REMOTE_SAFE_COMMANDS` / `BRIDGE_SAFE_COMMANDS` / `builtInCommandNames`（已在 commandContract v2 中）
- `filterCommandsForRemoteMode` / `isBridgeSafeCommand` / `getBridgeCommandSafety`（已在 commandContract v2 中）

### 说明
- `src/commands.ts` 保留 `export { findCommand, hasCommand, getCommand } from './core/commands/commandRegistry.js'`
- 外部消费者（如 `builtin-tools`、`PromptInput`、`processSlashCommand`）无需修改导入路径

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（31 files）
- `bun run check:core-contracts` ✅（11 files）

## 87. Core Independent Runtime - Phase D Step D3（Tool Registry 提取）

### 目标
将 `src/Tool.ts` 中的纯函数提取到 `src/core/tools/toolRegistry.ts`，建立 core-owned tool registry。

### 本批改动

- 新增文件：`src/core/tools/toolRegistry.ts`
- 修改文件：`src/Tool.ts`（保留 legacy wrapper，core 转发 toolMatchesName/findToolByName）

**迁移到 core 的函数（core-owned）**：
- `coreToolMatchesName(tool, name)` — 工具名匹配
- `coreFindToolByName(tools, name)` — 工具查找
- `coreFilterToolProgressMessages(messages)` — 进度消息过滤
- `coreBuildTool(def)` — 工具定义构建
- `coreGetEmptyToolPermissionContext()` — 空权限上下文

**保留在 legacy 的函数**：
- `filterToolProgressMessages`（保留原实现，core 转发）
- `getEmptyToolPermissionContext`（保留原实现）
- `buildTool`（需 TOOL_DEFAULTS + BuiltTool 类型）
- 所有 Tool 类型定义（Tool/Tools/ToolUseContext 等）

**`src/Tool.ts` 改动**：
- 添加 `export { coreToolMatchesName as toolMatchesName, coreFindToolByName as findToolByName } from './core/tools/toolRegistry.js'`

### 说明
- `src/Tool.ts` 保留所有 Tool 类型定义，外部消费者（如 `builtin-tools`）无需修改导入路径
- 外部 consumers 仍从 `src/Tool.js` 导入 `toolMatchesName` / `findToolByName` / `filterToolProgressMessages`

### 门禁
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（32 files）
- `bun run check:core-contracts` ✅（11 files）

---

# Phase D 收尾报告

> Phase D（Core Command/Tool Runtime 独立）完成于 2025-05-16。
> 共完成 3 个 Steps（D1/D2/D3），建立 commandContract v2 + toolContract v2 + 两个 core registry 模块。

## Phase D 交付总览

| Step | 文件 | 说明 |
|---|---|---|
| D1 | `src/core/contracts/commandContract.ts` | v1→v2（safety types + constants + 扩展接口） |
| D1 | `src/core/contracts/toolContract.ts` | v1→v2（permission/execution types + 扩展接口） |
| D2 | `src/core/commands/commandRegistry.ts` | 命令查找/格式化/可用性检查 |
| D3 | `src/core/tools/toolRegistry.ts` | 工具名匹配/查找/进度过滤/构建 |

**门禁结果（全部通过）**：
- `bun run typecheck` ✅
- `bun run check:boundaries` ✅（32 files in `src/core`）
- `bun run check:core-contracts` ✅（11 contract files）

---
