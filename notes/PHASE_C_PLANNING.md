# Phase C 规划：Core Query Runtime 独立

> 状态：规划中（基于 Phase B 完成后的审视）

## 目标

让 query 主环可独立运行，核心是建立 **core query pipeline** 而不依赖 legacy `src/query.ts`。

## 当前状态

### core 已有的 query 相关基础

| 文件 | 说明 | 对 Phase C 的支撑 |
|---|---|---|
| `src/core/contracts/queryContract.ts` | v1 基线（CoreQueryInput / CoreQueryRunResult） | 定义接口边界 |
| `src/core/mcp/coreMcpClient.ts` | 三段管线已 core-owned | tool executor facade 可复用 |
| `src/core/providers/coreProviders.ts` | Runtime Policy | provider selection facade |

### legacy query 依赖拓扑（src/query.ts → 1986 行）

主要 import 依赖（分析）：
- `src/Tool.js`：findToolByName / ToolUseContext ✅（core 已引用）
- `src/types/message.js`：Message/UserMessage/AssistantMessage ✅（core 已引用）
- `src/services/api/claude.ts`：API 客户端层
- `src/services/compact/`：autoCompact / compact / reactiveCompact
- `src/utils/messages.js`：normalizeMessagesForAPI / createUserMessage 等
- `src/services/toolUseSummary/`：toolUseSummaryGenerator

**core 到 legacy query 的依赖**：无（core 不引用 query.ts）
**legacy query 到 core 的依赖**：无（query.ts 不 import src/core）

## Phase C 三步走策略

### Step C1：Query Contract 深化

先把 `queryContract.ts` 从 v1 基线扩展为更完整的 contract：
- 保留：CoreQueryInput / CoreQueryRunResult
- 新增：CoreQueryTokenBudget / CoreQueryConfig / CoreQueryStreamEvent
- 定义：query 输入/输出/配置/token 管理的边界

### Step C2：Query 子服务提取

按依赖深度分批 extract 子服务：

**C2a（轻量，P1）**：
- `normalizeMessagesForAPI` / `createUserMessage` 等消息构建函数
- → 放入 `src/core/utils/messageUtils.ts`

**C2b（中量，P2）**：
- `autoCompact` / `compact` 逻辑
- → 放入 `src/core/compact/` 目录

**C2c（重量，P3）**：
- API 客户端层（`src/services/api/claude.ts`）
- → 依赖最深，需建立 `coreProvider` contract

### Step C3：Core Query Runtime 集成

在 `src/core/query/` 下建立：
- `coreQueryLoop.ts`（主环）
- `coreQueryPipeline.ts`（pipeline 编排）
- `coreQueryConfig.ts`（配置）

通过 contract 接口与 legacy 通信，最终让 `createCoreRuntime` 能挂载 core query。

## 门禁

- `src/core/` 不 import `src/query.ts`
- core query contract 有类型测试
- core query pipeline 可独立构建

## 风险与应对

1. **compact 逻辑复杂**：先处理 C2a（消息构建），compact 后移
2. **API 客户端依赖链深**：用 provider contract 隔离，逐步内迁
3. **token budget 跨多模块**：先定义 budget contract，再逐模块处理

## 立即行动项（Next Actions）

1. ✅ Phase B 收尾完成
2. ☐ 扩展 `queryContract.ts` 为 v2（增加 tokenBudget / config / streamEvent 类型）
3. ☐ 新增 `src/core/utils/messageUtils.ts`（消息构建函数内迁）
4. ☐ 评估 compact 子服务可提取性
5. ☐ 建立 `coreProvider` contract（API 客户端边界）
