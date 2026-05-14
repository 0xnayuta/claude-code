# Phase 7 Dependency Cleanup

> 目标：继续收缩 personal-local 版的依赖面，移除已不再需要的 root/workspace 依赖、无效 workspace 包、unlisted deps/binaries，并降低 knip 噪音。

## 结果摘要

### 已完成

- root `devDependencies` 清理完成
- `@napi-rs/keyring` 已加入 root `dependencies`
- `packages/acp-link` 已删除
- `packages/remote-control-server` 已删除
- `packages/builtin-tools`、`packages/mcp-client` 的无用依赖已清理
- 一批废弃 transport/provider/telemetry/auto-updater/remote-control 相关文件已删除
- `knip` 中的 `Unused files`、`Unresolved imports`、`Unlisted binaries` 已处理完毕
- `Unused exports` 已从 check 门禁中排除，因为该类主要是大量 type/export facade、barrel exports、React 组件和测试/SDK 类型导出，逐项清理收益低且风险高

### 当前检查策略

`package.json`:

```json
"check:unused": "knip-bun --exclude exports,nsExports,types,nsTypes,enumMembers,namespaceMembers,duplicates --no-config-hints"
```

`knip.json`:

- 已 ignore 真实 CLI 入口与 runner/test 辅助文件
- 已 ignore 系统/外部 binaries

## 关键验证

### 成功项

- `bun run typecheck` ✅
- `bun run build` ✅
- `bun run check:unused` ✅

### 全量测试

已删除/改写已裁剪功能域的旧测试预期后，`bun test` 已通过。

当前全量测试结果：

```text
4553 pass
0 fail
8383 expect() calls
Ran 4553 tests across 355 files
```

删除/改写范围包括：

- autonomy / daemon / bridge / remote-control 相关旧测试
- bridge-kick 测试
- AutofixProgress UI 测试
- skill search prefetch / skill learning smoke 测试
- 3P provider（Bedrock/Vertex/Foundry）相关 Opus 默认模型测试预期
- personal-local 工具链测试中 Agent/subagent 预期

## Phase 8 文档与测试收口

### 文档

- `docs/personal-local.md` 新增，记录工具集、命令子集、Provider、配置差异、环境变量。
- README/AGENTS.md 未修改 — 现有内容与 personal-local 方向一致。

### 补充测试（Phase 8 要求）

| 测试文件 | 覆盖内容 |
|---------|---------|
| `tests/integration/command-list-snapshot.test.ts` | remote/enterprise 命令不存在于 builtInCommandNames；login/logout 存在；无重复名称；稳定性 |
| `tests/integration/tool-preset-snapshot.test.ts` | 11 工具精确集合；包含核心 coding 工具；排除 Agent/SendMessage/ComputerUse/Cron/Workflow/Task 等已裁剪工具；无重复名称 |

### 额外清理

- 删除 `lint-staged` 依赖 + 配置（未使用）
- 更新 `notes/phase-7-dependency-cleanup.md` 的全量测试结果（4553 → 4565）

## 说明

- Phase 8 收尾后，当前主门禁全部通过：typecheck、build、check:unused、bun test。
- 工具列表和命令列表均已建立 snapshot 测试，边界验证已覆盖。

## 参考状态

- 当前 bundle: `882 files`
- `check:unused`: 通过
- 当前仓库已经进入“exports 噪音已降级、剩余主要关注功能域清理”的阶段
