# Core-8+ 迁移计划（Core Runtime 后续收敛）

> 背景：`notes/CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` 已较长；Core-7（legacy 绞杀删除）已完成。
>
> 目标：将后续计划拆分到独立文档，聚焦 **Core-8 及以后** 的结构收敛、边界强化与文档/测试定型。

---

## 0. 范围与目标

### 0.1 当前事实

- Core-7 已完成：teleport/remote、ultraplan/direct-connect、review/autofix-pr、swarm/teamMemorySync、plugin/marketplace 等主链路已下线或删除。
- 当前仍存在少量“兼容语义”残留（字段、分支、提示文案、类型壳），不构成可运行 legacy 功能，但会增加维护噪音。
- `src/core` 目前是边界/白名单层，不是可独立运行 package；主执行链仍在 `src/` 其他模块。

### 0.2 Core-8+ 总目标

1. **语义瘦身**：清理 legacy 残留状态/文案/分支。
2. **边界加固**：防止 legacy 依赖回流到 core 主路径。
3. **测试重建**：建立 core-only 的稳定回归基线。
4. **文档收口**：将“已完成态”和后续路线写清楚，避免计划漂移。

---

## 1. Core-8：Compat 语义瘦身（建议先做）

### 1.1 状态字段收敛（AppState / TaskState）

优先清理候选：

- `showRemoteCallout`
- `ultraplanSessionUrl`
- `ultraplanLaunching`
- `ultraplanPendingChoice`
- `ultraplanLaunchPending`

执行顺序：

1. 先删读侧（UI/逻辑分支）
2. 再删写侧（setAppState/update path）
3. 最后删类型定义与默认值
4. 如有历史 session 兼容需要，提供一次性迁移或安全忽略策略

### 1.2 交互与文案统一

- 命令层：统一 unsupported/removed 提示，不保留多套措辞。
- UI 层：优先隐藏 legacy 入口，而不是“可见后提示 disabled”。
- 提示层：清理 tips/help 中 remote/ultraplan/plugin 残留引用。

### 1.3 Task 兼容策略定案

两种策略：

- **A（稳态过渡）**：短期保留 `remote_agent` 兼容类型（不可运行）
- **B（最终收敛）**：彻底移除 `remote_agent` 类型及相关 UI 映射

建议：Core-8 先 A，Core-9 再 B。

---

## 2. Core-9：边界强化与防回流

### 2.1 扩展边界检查

在现有 `check-core-boundaries` 基础上增加：

- 禁止 `src/core/**` import 以下 legacy 域：
  - `plugins/`
  - `teleport/`
  - `swarm/`
  - `team/`
  - `remote/`
  - `ultraplan/`
- 禁止新增 legacy 命令注册（denylist 规则）
- 禁止恢复已移除入口的 feature-gated 分支

### 2.2 残留 allowlist 机制

- 建立“允许存在的 compat 点”白名单（极小集合）
- CI 校验：白名单不得新增；新增即失败
- 周期性将 allowlist 项目归零

### 2.3 依赖拓扑快照

- 固化 core 执行链依赖快照（入口、commands/tools/services）
- PR 审查时对比快照，识别反向耦合

---

## 3. Core-10：测试与文档定型

### 3.1 测试分层

- Core smoke：CLI/REPL/query/tools/auth/mcp
- Tombstone tests：确认 removed 功能不可达/报错稳定
- Snapshot 清理：删除 remote/ultraplan 旧输出基线

### 3.2 命令与帮助面一致性

- 更新 command list snapshot 为 core-only 现实
- 校正 doctor/help/config 输出，去除 legacy 误导信息

### 3.3 文档收口

- 在 `CORE_RUNTIME_BOUNDARY_REFACTOR_PLAN.md` 仅保留总览与完成态链接
- 将执行细节迁移到：
  - 本文档（Core-8+ 计划）
  - `subsequent-cleanup.md`（执行审计日志）

---

## 4. 批次建议（大批次模式）

### Batch A（Core-8）

- AppState/TaskState remote-ultraplan 残留字段瘦身
- REPL/PromptInput/任务 UI 相关 legacy 分支收敛
- 文案统一（removed/unsupported）

### Batch B（Core-9）

- 边界检查规则增强
- 兼容 allowlist + CI 断言
- `remote_agent` 最终去留定案（建议在本批次落地）

### Batch C（Core-10）

- 测试重排与快照更新
- 文档收口与交叉引用修复

---

## 5. 每批次验收门禁

```bash
bun run typecheck
bun run check:boundaries
bun run build
bun test
```

可选加强：

```bash
bun run lint
bun run check:unused
```

---

## 6. 风险与应对

1. **一次删太多导致类型链断裂**
   - 应对：遵循“删读侧 → 删写侧 → 删类型/文件”顺序；每批次门禁。

2. **兼容壳回流成新依赖**
   - 应对：allowlist 不可扩张；新增即 CI fail。

3. **文档与代码再次漂移**
   - 应对：每批次结束同时更新 `subsequent-cleanup.md` 与本计划状态。

---

## 7. 完成定义（DoD）

满足以下条件可判定 Core-8+ 完成：

- 无可运行 legacy 功能入口；
- 无 core->legacy 反向依赖；
- 兼容壳/兼容字段降至可解释最小集合（或归零）；
- 测试、命令清单、文档三者一致；
- 全量门禁稳定通过。
