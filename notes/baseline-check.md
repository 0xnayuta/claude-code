# Phase 0 Baseline Check

> 目的：记录个人本地 Coding Agent 精简工作开始前的仓库健康状态，作为后续 Phase 1+ 裁剪过程的回归基线。

## 1. 基本信息

| 项目 | 值 |
| --- | --- |
| 检查时间 | 2026-05-14T15:25:14+08:00 |
| 工作目录 | `G:/source/repos/claude-code` |
| 运行环境 | Windows / Bun |
| Bun 版本 | `bun v1.3.14`（由 `bun install` 输出确认） |
| 当前 CLI 版本 | `2.4.3 (Claude Code)` |
| 基线状态 | 通过 |

## 2. Phase 0 命令验证结果

本轮由 coding agent 重新执行 Phase 0 的四个基线命令，结果如下。

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `bun install` | 通过 | `Checked 1239 installs across 1428 packages (no changes)`；postinstall 与 Chrome MCP doctor 均完成 |
| `bun run typecheck` | 通过 | `tsc --noEmit` 无错误 |
| `bun run build` | 通过 | 成功 bundle `1250` files 到 `dist/` |
| `bun test` | 通过 | `5305 pass`, `0 fail`, `9943 expect() calls`, `393 files` |

## 3. 详细输出摘要

### 3.1 `bun install`

结果：通过。

关键输出：

```text
bun install v1.3.14 (0d9b296a)
[ripgrep] Binary already exists at G:\source\repos\claude-code\src\utils\vendor\ripgrep\x64-win32\rg.exe, skipping.
Chrome MCP setup complete!
Checked 1239 installs across 1428 packages (no changes) [6.46s]
```

说明：

- 依赖状态无变化。
- postinstall 成功执行。
- Chrome MCP setup 当前仍属于基线的一部分，后续个人版裁剪时可作为移除对象。

### 3.2 `bun run typecheck`

结果：通过。

关键输出：

```text
$ tsc --noEmit
```

说明：

- TypeScript strict 检查无错误。
- 后续每个裁剪阶段都必须保持该命令通过。

### 3.3 `bun run build`

结果：通过。

关键输出：

```text
$ bun run build.ts
Bundled 1250 files to dist/ (patched 1 for import.meta.require, 0 for Bun destructure)
Copied vendor/audio-capture/ → dist\vendor\audio-capture/
Copied src/utils/vendor/ripgrep/ → dist\vendor\ripgrep/
Generated dist\cli-bun.js (shebang: bun) and dist\cli-node.js (shebang: node)
```

说明：

- 当前构建流程正常。
- 构建仍包含 `vendor/audio-capture`、Chrome/Computer/Voice 等相关依赖路径的迹象；这些属于后续裁剪关注点。

### 3.4 `bun test`

结果：通过。

关键输出：

```text
5305 pass
0 fail
9943 expect() calls
Ran 5305 tests across 393 files. [76.55s]
```

说明：

- 当前测试基线全部通过。
- 后续裁剪过程中，建议每个阶段至少运行相关局部测试；阶段完成时运行全量 `bun test`。

## 4. CLI 快速路径验证

额外验证命令：

```bash
bun run dev -- --version
```

结果：通过。

输出：

```text
2.4.3 (Claude Code)
```

说明：

- CLI `--version` fast path 正常。
- 该路径应在个人本地版中保留。

## 5. REPL 状态

本次由 coding agent 在非交互式 harness 中执行验证，因此未进行完整人工 REPL 交互测试。

当前记录：

| 项目 | 状态 |
| --- | --- |
| `bun run dev -- --version` | 通过 |
| 完整交互式 `bun run dev` REPL 启动 | 用户已在 Phase 0 人工验证四个命令均通过；本次未重复交互式操作 |
| `-p` pipe 模式 | 本次未重复执行，可在 Phase 1 前补充 smoke test |

建议后续在 Phase 1 前或 Phase 1 完成后补充：

```bash
echo "say hello" | bun run src/entrypoints/cli.tsx -p
bun run dev
```

并在 REPL 中手测：

```text
/help
/status
/plan
/poor
/compact
```

## 6. Git 工作区状态

当前 `git status --short` 输出：

```text
?? notes/
```

说明：

- 当前未跟踪目录为 `notes/`。
- 已移动的 `notes/PERSONAL_LOCAL_SIMPLIFICATION_PLAN.md` 和本文件 `notes/baseline-check.md` 均位于该目录下。

## 7. 基线结论

当前 Phase 0 基线健康：

```text
bun install       PASS
bun run typecheck PASS
bun run build     PASS
bun test          PASS
version fast path PASS
```

可进入 Phase 1：新增/启用 `personal-local` profile，优先收缩默认 feature flags、工具注册和命令列表。

## 8. 后续阶段必须保持的硬性要求

每个阶段完成后至少执行：

```bash
bun run typecheck
bun run build
```

关键阶段完成后执行：

```bash
bun test
```

建议保留 smoke test：

```bash
bun run dev -- --version
echo "say hello" | bun run src/entrypoints/cli.tsx -p
```

若开始物理删除目录或依赖，必须遵守：

1. 一次只删除一组功能。
2. 删除后立即 `bun run typecheck`。
3. 再运行 `bun run build`。
4. 通过后再进入下一组删除。
