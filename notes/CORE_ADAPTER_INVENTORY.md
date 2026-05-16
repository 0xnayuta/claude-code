# Core Adapter Inventory (Phase A Baseline)

> 目的：盘点 `src/core` 中仍以“转发/薄壳”为主的 adapter，作为 Phase B/C 逐步去壳的执行清单。

## 分类口径

- **Facade / Forwarder**：主要 re-export 或轻包装 legacy 实现。
- **Runtime Policy**：包含 profile-aware 分支与边界策略（但底层仍可能依赖 legacy）。
- **Core-owned**：主要逻辑已在 core 内自有实现。

## 当前清单（基线）

| 文件 | 分类 | 说明 | 目标阶段 |
|---|---|---|---|
| `src/core/auth/coreAuth.ts` | Facade / Forwarder | auth 聚合导出，仍大量转发 legacy auth | Phase B |
| `src/core/providers/coreProviders.ts` | Runtime Policy | provider facade + runtime-aware provider 选择 | Phase B/C |
| `src/core/mcp/coreMcpAuth.ts` | Runtime Policy | 已内建 getServerKey/getMcpServerCacheKey（纯函数）；其余 8 个 auth 操作仍为 facade；已新增 MCP auth contract 基线 | Phase B |
| `src/core/mcp/coreMcpClient.ts` | Core-owned | 已内建 batch size/config-equal/cache-key + prefetch 聚合 + scheduling buckets；三段管线（connect/fetch/assemble）已全部 core 自有实现；transport 类型解析函数全部 core 自有；无 legacy impl 依赖 | Phase B |
| `src/core/mcp/coreMcpConfig.ts` | Runtime Policy | config facade，含 runtime-aware 分支；已新增 MCP config contract 基线 | Phase B |
| `src/core/mcp/coreMcpClaudeai.ts` | Runtime Policy | core-local 下跳过远端 connector | Phase B |
| `src/core/mcp/coreMcpConnectionManager.ts` | Facade | 3 个 re-export（React context hook）；内迁需 React 重构 | Phase B |
| `src/core/mcp/coreMcpUtils.ts` | Core-owned | 已内建 MCP 字符串解析 + config/scope helpers + project server status；仅剩 extractAgentMcpServers（需 AgentDefinition）转发 | Phase B |
| `src/core/runtime/createCoreRuntime.ts` | Core-owned | runtime shell/profile 解析 | Phase A/B |
| `src/core/runtime/types.ts` | Core-owned | runtime contract types | Phase A |
| `src/core/runtime/pools.ts` | Runtime Policy | command/tool runtime pool adapter | Phase C/D |
| `src/core/commands/coreCommandNames.ts` | Core-owned | core command 白名单 | Phase D |
| `src/core/commands/coreCommands.ts` | Runtime Policy | core command 过滤器 | Phase D |
| `src/core/tools/coreToolNames.ts` | Core-owned | core tool 白名单 | Phase D |
| `src/core/tools/coreTools.ts` | Runtime Policy | core tool 过滤器 | Phase D |

## 跟踪规则

1. 每次把 Facade 变为 Core-owned，要在本表更新分类。
2. 每个 Facade 至少绑定一个“去壳目标阶段”（B/C/D）。
3. 若新增 adapter，必须在同 PR 增加 inventory 条目。
