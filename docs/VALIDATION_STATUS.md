# Validation Status — handoff-1.0.0-rc.1

## Version Mapping

```text
Node Handoff:    handoff-1.0.0-rc.1
Runtime Version: 1.0.0-rc.1
Runtime Commit:  339bca03b864f531a59bd6f0105ef4ddccb94684
```

## Current Engineering Status

```text
RUNTIME POLICY SYNC: IMPLEMENTED
NODE MODE TESTS: REQUIRED
NODE TYPECHECK: REQUIRED
PRODUCTION RC FREEZE: YES
FINAL LIVE PROVIDER / PRIVATE-ASSET ACCEPTANCE: PENDING UNLESS RUN EXPLICITLY
```

RC Freeze 表示 Node 行为契约已经固定到指定 Runtime commit；它不等于真实 Provider、私有 Golden、所有品类已经在这个 commit 上完成最终线上验收。

## S-Tier Calibration Context

S01「椰椰西瓜冰」与 S02「阳光蜜橘罐头」仍是视觉质量 North Star；它们用于迁移质量原则，不允许把其具体皮肤、品牌、布局或素材复制到新 Job。

Runtime 还包含 Human-Accepted Street Food Canonical 的校准元数据；私有 Canonical 图片本身不应提交到本 Node 仓库。

## Release Gate

只有同时满足以下条件，才能对本同步分支写 `SYNC STATUS: MATCHED`：

1. Node 最终 commit 上 `npm test` PASS。
2. 同一 commit 上 `npm run typecheck` PASS。
3. Python Runtime release commit CI PASS。
4. 两仓版本映射、Runtime Mode、Production Retry=1、Validation Cycle<=3、confidence=0.65、Hard Failure Set、三图 Pairwise、Golden floors 一致。
5. 两仓未提交 API Key、私有 Job 产物或私有 Golden 图。

真实 Provider / 私有 S01/S02 验证如果没有执行，只能写 `NOT RUN / PENDING`，不得伪装成 PASS。
