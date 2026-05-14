# 代码现状统计与功能列表

> 最后更新：2026-05-15
>
> 基于 `bun run typecheck` + `bun run build` 通过，`bun test` 4565 pass 的状态。

---

## 总览

| 指标 | 数值 |
|------|------|
| `src/` 总行数（非测试代码） | **436,562 行** |
| `src/` 文件数 | 2,096 个 |
| 功能模块数（feature flags） | **85 个** |
| 默认开启（ACTIVE） | **3 个** |
| 默认关闭（INACTIVE） | **82 个** |
| 实际运行时参与计算的核心代码 | **~196,000 行** |

---

## 一、Feature Flag 系统

代码使用 `feature('NAME')` 函数控制功能开关：

```ts
// scripts/defines.ts
export const DEFAULT_BUILD_FEATURES = [
  'PROMPT_CACHE_BREAK_DETECTION', // 默认开启
  'TOKEN_BUDGET',                 // 默认开启
  'POOR',                         // 默认开启
] as const

export function feature(name: string): boolean {
  if (DEFAULT_BUILD_FEATURES.includes(name as any)) return true
  return isEnvTruthy(process.env[`FEATURE_${name}`])
}
```

开启方式：`FEATURE_<NAME>=1`（环境变量）或在 `DEFAULT_BUILD_FEATURES` 中声明。

---

## 二、禁用功能的方式（六种）

代码库中有六种"关闭/禁用功能"的机制：

| 方式 | 说明 | 典型位置 |
|------|------|----------|
| **Feature Flag** | `feature('X')` 返回 false，代码路径不执行 | 遍布各模块 |
| **NO-OP Stub** | 函数直接空返回，调用无效果 | `src/utils/sentry.ts` |
| **命令过滤** | `PERSONAL_LOCAL_COMMAND_NAMES` 不包含命令名，`/help` 不显示 | `src/commands.ts` |
| **Early Return** | 函数开头 `isPersonalLocalProfileEnabled()` 检查，直接 return | 遍布各模块 |
| **Conditional Require** | `feature('X') ? require(...) : null`，模块不加载 | `src/commands.ts` 顶部 |
| **Memoization 缓存** | `builtInCommandNames` 等在模块初始化时固定结果 | `src/commands.ts` |

---

## 三、保留且开启的功能（ACTIVE）

共 **3 个**，全部通过 `DEFAULT_BUILD_FEATURES` 默认启用：

| 功能 | Flag | 说明 |
|------|------|------|
| Prompt Cache 破坏检测 | `PROMPT_CACHE_BREAK_DETECTION` | 检测 prompt cache 是否被打破 |
| Token 预算管理 | `TOKEN_BUDGET` | Token 预算管理与控制 |
| 穷鬼模式 | `POOR` | 跳过 extract_memories/prompt_suggestion，减少 token 消耗 |

> 无独立代码量统计（弥散在各模块中）。

---

## 四、保留但关闭的功能（INACTIVE）

> 代码物理存在，`feature('X')` 返回 `false`，运行时不可达。
>
> 默认 `DEFAULT_BUILD_FEATURES` 不包含，需要 `FEATURE_X=1` 才开启。

### 4.1 团队协作 / Swarm

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/utils/swarm/` | `COWORKER_TYPE_TELEMETRY`, `PIPE_IPC`, `TEAMMEM` | 8,835 | 多 agent 协作、权限同步、TMux 后端 |
| `src/hooks/toolPermission/handlers/swarmWorkerHandler.ts` | `PIPE_IPC` | 159 | Swarm worker 权限处理 |
| `src/commands/{peers,attach,detach,send,pipes,pipe-status}/` | `UDS_INBOX`, `PIPE_IPC` | ~1,200 | 群控命令 |

**小计：~10,194 行**

### 4.2 插件 / Marketplace

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/utils/plugins/` | `HOOK_PROMPTS`, `MCP_SKILLS` | 20,536 | 插件加载器、市场管理器、schema |
| `src/commands/plugin/` | `HOOK_PROMPTS`, `MCP_SKILLS` | 7,462 | 插件管理命令界面 |
| `src/components/agents/` | `FORK_SUBAGENT` | 3,453 | Agent UI 组件 |
| `packages/builtin-tools/src/tools/AgentTool/` | `FORK_SUBAGENT`, `AGENT_TRIGGERS` | 7,836 | AgentTool、fork/join 子 agent |

**小计：~39,287 行**

### 4.3 Skill 系统

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/services/skillLearning/` | `SKILL_LEARNING`, `SKILL_IMPROVEMENT` | 7,161 | skill 学习、生成、演化 |
| `src/services/skillSearch/` | `EXPERIMENTAL_SKILL_SEARCH` | 1,629 | 本地搜索、index 管理 |
| `src/services/searchExtraTools/` | `EXPERIMENTAL_SEARCH_EXTRA_TOOLS` | 877 | TF-IDF 增强搜索 |
| `src/commands/skill-learning/` | `SKILL_LEARNING` | 676 | skill learning 命令 |
| `src/commands/skill-search/` | `EXPERIMENTAL_SKILL_SEARCH` | 185 | skill search 命令 |

**小计：~10,528 行**

### 4.4 Autofix / Review / Monitor

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/commands/autofix-pr/` | `AUTOFIX_PR`, `REVIEW_ARTIFACT` | 1,206 | 自动修复 PR |
| `src/commands/monitor.ts` | `MONITOR_TOOL` | 108 | 后台监控工具 |
| `src/commands/review/` | `REVIEW_ARTIFACT` | ~500 | 代码审查 |

**小计：~1,814 行**

### 4.5 Voice / 外部自动化

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/commands/voice/` | `VOICE_MODE` | 205 | 语音命令 |
| `src/hooks/useVoiceIntegration.tsx` | `VOICE_MODE` | 679 | 语音集成 hook |
| `src/components/LogoV2/VoiceModeNotice.tsx` | `VOICE_MODE` | 51 | 语音模式提示 UI |

**小计：935 行**

### 4.6 Workflow / 自动化脚本

| 组件 | Flag | 代码行数 | 说明 |
|------|------|----------|------|
| `src/commands/workflows/` | `WORKFLOW_SCRIPTS` | 28 | 工作流脚本命令 |

**小计：28 行**

### 4.7 已物理删除（本次精简）

以下目录已在 Phase 6 删除，代码不再存在：

| 删除目录 | 原功能 |
|----------|--------|
| `src/bridge/` | Remote Control / Bridge 模式 |
| `src/daemon/` | 长驻后台 daemon |
| `src/services/acp/` | ACP agent 协议 |
| `src/buddy/` | Buddy companion |
| `src/assistant/` | Assistant proactive |
| `src/coordinator/` | 多 agent 协调 |
| `src/utils/computerUse/` | Computer Use 自动化 |
| `src/utils/claudeInChrome/` | Chrome Use |
| `packages/acp-link/` | ACP 代理服务器 |
| `packages/remote-control-server/` | 自托管 RCS |

---

## 五、保留但返回 NO-OP 的功能

> 代码存在，但调用结果是 no-op stub，不执行真实逻辑。

| 组件 | 说明 | 代码行数 | NO-OP 机制 |
|------|------|----------|------------|
| `src/services/analytics/` | GrowthBook + 遥测 | 4,203 | 全部返回 no-op |
| `src/utils/telemetry/` | Perfetto tracing | 2,966 | 全部返回 no-op |
| `src/services/langfuse/` | Langfuse tracing | 705 | 全部返回 no-op |
| `src/utils/sentry.ts` | Sentry error reporting | 31 | no-op facade |
| `src/services/remoteManagedSettings/` | 远程托管配置 | 889 | personal-local 直接 return |
| `src/services/extractMemories/` | 记忆提取 | 766 | personal-local 直接 return |
| `src/services/PromptSuggestion/` | Prompt 建议 | 1,522 | personal-local 直接 return |
| `src/commands/autonomy.ts` + autonomy utils | 后台自主运行 | 2,856 | 已 stub 为 unavailable |

**NO-OP 总计：~13,938 行**

---

## 六、始终开启的核心功能（ALWAYS-ON）

> 无 feature flag，默认始终可用。约 196,000 行，是实际运行时参与计算的核心代码。

### 6.1 核心引擎

| 组件 | 代码行数 |
|------|----------|
| `src/main.tsx` | 5,451 |
| `src/query.ts` | 2,015 |
| `src/QueryEngine.ts` | 1,360 |
| `src/commands.ts` | 1,017 |
| `src/tools.ts` | 465 |
| `src/Tool.ts` | 813 |
| `src/setup.ts` | 470 |
| `src/history.ts` | 464 |
| **小计** | **12,055** |

### 6.2 CLI / REPL

| 组件 | 代码行数 |
|------|----------|
| `src/screens/REPL.tsx` | 6,505 |
| `src/cli/print.ts` | 5,727 |
| **小计** | **12,232** |

### 6.3 API / Provider

| 组件 | 代码行数 |
|------|----------|
| `src/services/api/claude.ts` | 3,533 |
| `src/utils/model/` | 3,454 |
| `src/services/providerRegistry/` | 1,053 |
| `src/utils/auth.ts` | 1,992 |
| **小计** | **10,032** |

### 6.4 MCP 客户端

| 组件 | 代码行数 |
|------|----------|
| `src/services/mcp/client.ts` | 3,379 |
| `src/services/mcp/auth.ts` | 2,465 |
| `src/services/mcp/config.ts` | 1,560 |
| `src/services/mcp/` 其他 | ~5,523 |
| **小计** | **12,927** |

### 6.5 权限系统

| 组件 | 代码行数 |
|------|----------|
| `src/utils/permissions/permissions.ts` | 1,507 |
| `src/utils/permissions/filesystem.ts` | 1,782 |
| `src/utils/permissions/permissionSetup.ts` | 1,525 |
| `src/utils/permissions/yoloClassifier.ts` | 1,510 |
| `src/hooks/toolPermission/handlers/interactiveHandler.ts` 等 | ~2,000 |
| **小计** | **~10,487** |

### 6.6 Bash / Shell 解析

| 组件 | 代码行数 |
|------|----------|
| `src/utils/bash/bashParser.ts` | 4,432 |
| `src/utils/bash/ast.ts` | 2,679 |
| `src/utils/shell/readOnlyCommandValidation.ts` | 1,893 |
| `src/utils/shell/` 其他 | ~1,230 |
| `src/utils/powershell/parser.ts` | 1,805 |
| `src/utils/powershell/` 其他 | ~501 |
| **小计** | **~12,540** |

### 6.7 上下文压缩

| 组件 | 代码行数 |
|------|----------|
| `src/services/compact/compact.ts` | 1,751 |
| `src/services/compact/autoCompact.ts` | ~1,000 |
| `src/services/compact/microCompact.ts` 等 | ~2,428 |
| **小计** | **5,179** |

### 6.8 配置 / 设置

| 组件 | 代码行数 |
|------|----------|
| `src/utils/config.ts` | 1,827 |
| `src/utils/settings/settings.ts` | 1,003 |
| `src/utils/settings/` 其他 | ~4,474 |
| **小计** | **~7,304** |

### 6.9 消息 / 附件

| 组件 | 代码行数 |
|------|----------|
| `src/utils/messages.ts` | 5,972 |
| `src/utils/attachments.ts` | 4,070 |
| `src/components/messages/` | 4,397 |
| **小计** | **14,439** |

### 6.10 Hooks / 状态管理

| 组件 | 代码行数 |
|------|----------|
| `src/utils/hooks.ts` | 5,190 |
| `src/hooks/` (117 个文件) | 20,546 |
| `src/utils/sessionStorage.ts` | 5,120 |
| **小计** | **30,856** |

### 6.11 UI 组件

| 组件 | 代码行数 |
|------|----------|
| `src/components/` (403 个文件) | 66,079 |
| `src/screens/ResumeConversation.tsx` | 850 |
| **小计** | **~66,929** |

### 6.12 其他核心功能

| 组件 | 代码行数 |
|------|----------|
| `src/services/localVault/` | 1,199 |
| `src/services/lsp/` | 2,625 |
| `src/utils/nativeInstaller/` | 3,015 |
| `src/services/SessionMemory/` | 2,067 |
| `src/services/teamMemorySync/` | 2,167 |
| `src/commands/insights.ts` | 3,205 |
| `src/utils/teleport/` | 1,117 |
| `src/services/oauth/` | 1,063 |
| **小计** | **~21,491** |

---

## 七、按状态汇总

| 状态 | 行数 | 占比 | 说明 |
|------|------|------|------|
| **ALWAYS-ON**（核心功能） | ~196,471 | 45% | 实际运行时参与计算 |
| **INACTIVE**（关闭，代码残留） | ~63,596 | 15% | feature flag 关闭的代码 |
| **NO-OP**（返回 stub） | ~13,938 | 3% | 函数直接空返回 |
| **已物理删除**（本次精简） | ~76,000+ | 17% | Phase 6 删除的目录 |
| 统计误差 / 其他 | ~86,000 | 20% | 分散在各处的 small modules |
| **总计** | **436,562** | 100% | |

---

## 八、`src/` 目录分布

| 目录 | 文件数 | 代码行数 | 主要内容 |
|------|--------|----------|----------|
| `src/utils/` | 709 | 205,012 | 工具函数、解析器、权限、配置、插件等 |
| `src/services/` | 259 | 75,052 | API、MCP、compact、analytics、auth 等 |
| `src/components/` | 403 | 66,079 | React UI 组件 |
| `src/commands/` | 354 | 49,707 | CLI 命令实现 |
| `src/hooks/` | 117 | 20,546 | React hooks |
| `src/screens/` | 3 | 7,355 | REPL / Resume 界面 |
| 其他顶层文件 | — | ~13,384 | main.tsx, query.ts 等核心模块 |

---

## 九、所有 85 个 Feature Flags 列表

### 9.1 始终开启（3 个）

```
PROMPT_CACHE_BREAK_DETECTION  ← DEFAULT_BUILD_FEATURES
TOKEN_BUDGET                   ← DEFAULT_BUILD_FEATURES
POOR                          ← DEFAULT_BUILD_FEATURES
```

### 9.2 默认关闭（82 个）

**远程控制 / 后台：**
```
BRIDGE_MODE          DAEMON              BG_SESSIONS
UDS_INBOX            PIPE_IPC            LAN_PIPES
```

**团队协作：**
```
COWORKER_TYPE_TELEMETRY  TEAMMEM          PROACTIVE
AGENT_TRIGGERS           AGENT_TRIGGERS_REMOTE
```

**插件 / 扩展：**
```
HOOK_PROMPTS     MCP_SKILLS     WORKFLOW_SCRIPTS
CCR_AUTO_CONNECT CCR_REMOTE_SETUP
```

**企业功能：**
```
AUTOFIX_PR       REVIEW_ARTIFACT  MONITOR_TOOL
SKILL_LEARNING   SKILL_IMPROVEMENT  EXPERIMENTAL_SKILL_SEARCH
EXPERIMENTAL_SEARCH_EXTRA_TOOLS
```

**遥测 / 观测：**
```
PERFETTO_TRACING  ENHANCED_TELEMETRY_BETA  TELEMETRY (散布)
TRANSCRIPT_CLASSIFIER  AWAY_SUMMARY  LODESTONE
EXTRACT_MEMORIES   VERIFICATION_AGENT  ULTRAPLAN
```

**外部集成：**
```
CHICAGO_MCP     VOICE_MODE   WEB_BROWSER_TOOL
KAIROS          KAIROS_BRIEF  KAIROS_CHANNELS
KAIROS_GITHUB_WEBHOOKS  KAIROS_PUSH_NOTIFICATION
```

**Shell / 编辑：**
```
BASH_CLASSIFIER  TREE_SITTER_BASH  TREE_SITTER_BASH_SHADOW
POWERSHELL_AUTO_MODE  COMMIT_ATTRIBUTION
```

**Compaction / 上下文：**
```
COMPACTION_REMINDERS  REACTIVE_COMPACT  CACHED_MICROCOMPACT
CONTEXT_COLLAPSE
```

**UI / 交互：**
```
AUTO_THEME  STREAMLINED_OUTPUT  QUICK_SEARCH
MESSAGE_ACTIONS  TERMINAL_PANEL  CONNECTOR_TEXT
BREAK_CACHE_COMMAND  HISTORY_PICKER  HISTORY_SNIP
```

**Agent / 模型：**
```
FORK_SUBAGENT  AGENT_MEMORY_SNAPSHOT  ULTRATHINK
TORCH  DIRECT_CONNECT  SSH_REMOTE  TEMPLATES
```

**其他：**
```
FILE_PERSISTENCE  NEW_INIT  DUMP_SYSTEM_PROMPT
HARD_FAIL  ALLOW_TEST_VERSIONS  OVERFLOW_TEST_TOOL
NATIVE_CLIENT_ATTESTATION  NATIVE_CLIPBOARD_IMAGE
DOWNLOAD_USER_SETTINGS  UPLOAD_USER_SETTINGS
SLOW_OPERATION_LOGGING  COWORKER_TYPE_TELEMETRY
MEMORY_SHAPE_TELEMETRY  UNATTENDED_RETRY
IS_LIBC_GLIBC  IS_LIBC_MUSL  ABLATION_BASELINE
```

---

## 十、个人本地版（Personal-Local）的实际运行状态

当执行 `bun run dev`（无任何 `FEATURE_*` 环境变量）时：

```
✅ 3 个 DEFAULT_BUILD_FEATURES 启用
❌ 82 个 feature flags 全部关闭
❌ 插件系统不可用
❌ Swarm/团队不可用
❌ Skill learning/search 不可用
❌ Autofix/Monitor 不可用
❌ Voice/Chrome/Computer Use 不可用
❌ 遥测/Sentry/Langfuse 返回 no-op
❌ 远程托管设置返回 no-op
❌ Autonomy/daemon 不可用

✅ 核心功能正常运行：
   - REPL / CLI / 命令行
   - API 调用（firstParty / OpenAI）
   - 11 个工具（Bash, Glob, Grep, Read, Edit, Write, TodoWrite, EnterPlanMode, ExitPlanMode, WebFetch, WebSearch）
   - ~35 个本地命令
   - 权限系统、上下文压缩、token 预算
```

---

## 十一、验证命令

```bash
# 查看当前 FEATURE_ 环境变量（应为空）
env | grep FEATURE_

# 查看工具数量（应为 11）
# 运行: bun run dev → /help

# 查看命令数量（应为 ~35）
# 运行: bun run dev → /help

# 查看 INACTIVE 代码行数
find src/utils/swarm -type f | xargs wc -l  # Swarm
find src/utils/plugins -type f | xargs wc -l  # 插件
find src/services/skillLearning -type f | xargs wc -l  # Skill Learning
```