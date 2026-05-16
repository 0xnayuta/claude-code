# Core Independent Runtime Roadmap（src/core 真正独立化总计划）

> 目标：将当前“边界层/白名单层”的 `src/core`，演进为**可独立运行、可独立测试、可独立发布**的 Core Runtime。
>
> 现状：`src/core` 仍大量依赖 `src/` 其他实现模块（commands/tools/query/repl/services）。

---

## 0. 定义与范围

### 0.0 阶段状态（滚动）

- Phase A（Core Contract Freeze）：✅ 完成
- Phase B（Core Service Extraction）：✅ 完成
- Phase C（Core Query Runtime 独立）：✅ 完成（C1: query contract v2 / C2a: messageUtils / C2b: compact + provider contracts / C3: coreQueryLoop + coreQueryPipeline）
- Phase D（Core Command/Tool Runtime 独立）：✅ 完成（D1: commandContract v2 + toolContract v2 / D2: commandRegistry / D3: toolRegistry）
- Phase E（Core REPL/Application Shell 独立）：未开始
- Phase F（Legacy Decommission）：未开始


## 0.1 独立化完成定义（终态 DoD）

满足以下条件，才算“真正独立”：

1. `src/core/**` 不再 import `src/**` 非 core 模块（0 例外）。
2. Core 主执行链（entry → commands/tools → query → runtime services）可在不加载 legacy `src/` 栈的情况下运行。
3. Core 有独立测试分层：unit / integration / smoke / tombstone。
4. Core 拥有稳定公共接口（types + adapters + runtime contracts），legacy 只能作为外层兼容壳调用 core。
5. CI 有强制门禁：
   - core import 边界
   - core 拓扑快照
   - core-only smoke
   - 类型检查与构建全通过。

## 0.2 非目标（当前路线不做）

- 一次性删除全部 legacy 文件；
- 一次性重写 REPL/Query 全实现；
- 引入大规模新功能。

---

## 1. 总体策略

采用“三层剥离 + 双轨切换”策略：

1. **接口先行**：先定义 core contracts（commands/tools/query/services）。
2. **实现迁移**：把 `src/` 中核心实现逐步迁入 core（或抽成 core package）。
3. **入口切换**：在运行时将 personal-local 主路径切到 core implementation；legacy 保留兼容包装。
4. **遗留收缩**：legacy 仅保留过渡壳，最后移除。

双轨期间：
- core-local 路径逐步换成 core implementation；
- legacy-full 继续可用（直到明确退役）。

---

## 2. 里程碑与阶段计划

## Phase A：Core Contract Freeze（接口冻结）

目标：固定核心接口，阻止迁移期漂移。

交付：
- `core/contracts`（建议目录）
  - command contract
  - tool contract
  - query engine contract
  - runtime state contract
  - provider/auth/mcp service contract
- 每个 contract 对应 compatibility adapter（legacy→core）
- 文档：contract 版本策略（semver 或内部版本号）

验收：
- 新增 contract diff 检查（变更需显式审批）
- core 关键接口都有类型测试

## Phase B：Core Service Extraction（服务内核抽离）

目标：先抽“非 UI、低耦合”服务到 core。

优先级：
1. auth/provider/mcp adapters（已做基础，继续去 `src/` 依赖）
2. query 子服务（token budget、tool orchestration、compact hooks）
3. command/tool registry runtime 化

交付：
- `core/services/*` 真实现（非简单 re-export）
- 旧 `src/services/*` 变薄壳调用 core

验收：
- core service 不再 import legacy service
- core service 单测覆盖率达标（建议 >= 80% lines on touched files）

## Phase C：Core Query Runtime 独立

目标：让 query 主环可独立运行。

交付：
- core 版 query loop（消息编排、tool call、compact、error policy）
- core 版 provider selection + request pipeline
- core 版 tool executor façade

验收：
- core-only integration tests 跑通（无 `src/query.ts` 参与）
- 线上行为与现有 snapshot 差异可解释

## Phase D：Core Command/Tool Runtime 独立

目标：命令与工具体系不再依赖 legacy 聚合层。

交付：
- core command registry（白名单 + profile-aware）
- core tool registry（白名单 + permission-aware）
- legacy command/tool registry 仅做代理转发

验收：
- `tests/integration/command-list-snapshot.test.ts` 切为 core source-of-truth
- `tool-preset` 快照由 core registry 生成

## Phase E：Core REPL/Application Shell 独立（最难）

目标：UI 层与 runtime 层边界定型；REPL 可挂 core runtime。

交付：
- REPL state 与 runtime state 解绑（通过 core runtime bridge）
- PromptInput/Permission/Task UI 仅消费 core contracts
- legacy REPL hooks 逐步替换

验收：
- core-only REPL smoke（启动、输入、工具授权、query 回合）
- 无 core->legacy UI 反向依赖

## Phase F：Legacy Decommission（遗留退役）

目标：将 legacy 从“参与执行”降为“历史兼容”，最终删除。

交付：
- legacy wrappers 清单归零（或保留极小长期兼容项）
- core 成为默认主路径

验收：
- core 单路径可构建、可运行、可测试
- legacy 入口删除后门禁全绿

---

## 3. 工程组织建议

## 3.1 目录建议（渐进）

- `src/core/contracts/`
- `src/core/runtime/`
- `src/core/services/`
- `src/core/commands/`
- `src/core/tools/`
- `src/core/query/`
- `src/core/testing/`

> 说明：先逻辑分层，后续可再抽成 workspace package（如 `packages/core-runtime`）。

## 3.2 CI 门禁新增/升级

在现有 `check:boundaries` 基础上新增：

1. `check:core-contracts`
   - contract 文件变更审计
2. `check:core-topology`
   - 已有 snapshot，继续扩展到 core-only 执行链
3. `test:core-smoke`
   - 启动、命令、query、工具、mcp 最小回归
4. `test:core-tombstones`
   - 已移除入口报错语义稳定

---

## 4. 测试路线（Core-10 之后）

分 4 层：

1. **Contract tests**：类型与行为契约
2. **Service integration**：auth/provider/mcp/query 子服务
3. **Runtime integration**：commands/tools/query 联动
4. **E2E smoke**：CLI/REPL 用户路径

关键原则：
- 每迁移一个子域，同步把该子域测试迁入 core 测试目录；
- legacy 测试只保留兼容壳行为断言。

---

## 5. 风险与应对

1. **迁移中行为漂移**
   - 应对：snapshot + tombstone + golden tests 同步更新并强审查。

2. **UI 与 runtime 耦合导致卡住**
   - 应对：先做 runtime bridge，禁止 UI 直接读 legacy store 深层结构。

3. **适配层长期滞留**
   - 应对：每个 adapter 设“删除截止阶段”和 owner；逾期报警。

4. **并行改动导致拓扑频繁抖动**
   - 应对：topology snapshot 采用“核心目标文件 + 审批更新”机制（已启用）。

---

## 6. 执行节奏（建议）

- Sprint 1-2：Phase A + B（contract 冻结 + service 抽离）
- Sprint 3-4：Phase C（query runtime 独立）
- Sprint 5：Phase D（command/tool runtime 独立）
- Sprint 6-7：Phase E（REPL shell 独立）
- Sprint 8：Phase F（legacy 退役）

> 可根据风险拆更细批次，但必须保持“每批可验证、可回滚”。

---

## 7. 立即行动项（Next Actions）

1. （已完成）建立 `src/core/contracts/` 初版，并列出当前接口基线。
2. 把 `check-core-boundaries.ts` 拆分为：
   - import boundary
   - denylist
   - marker budgets
   - topology compare（可分别报告）
3. 新增 `test:core-smoke`（最小可跑：help/config/doctor/query 一回合）。
4. （已完成）产出“adapter inventory”清单：
   - 哪些 core 文件仍只是 re-export
   - 每个 adapter 的去壳目标阶段。
5. （已完成）新增 `check:core-contracts`，对 contracts snapshot 做 CI 校验。

---

## 8. 状态追踪模板

后续每批次在 `notes/subsequent-cleanup.md` 记录：

- 批次目标
- 变更文件
- contract/topology 影响
- 测试结果
- 未决风险
- 下一批动作

并在本文件顶部维护阶段状态：
- Phase A: ☐ / ☑
- Phase B: ☐ / ☑
- Phase C: ☐ / ☑
- Phase D: ☐ / ☑
- Phase E: ☐ / ☑
- Phase F: ☐ / ☑
