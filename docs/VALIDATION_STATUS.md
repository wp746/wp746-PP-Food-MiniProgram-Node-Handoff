# Validation Status — handoff-1.0.0-rc.1

## Version Mapping

```text
Node Handoff:    handoff-1.0.0-rc.1
Runtime Version: 1.0.0-rc.1
Runtime Commit:  339bca03b864f531a59bd6f0105ef4ddccb94684
SYNC STATUS:     MATCHED
```

## Verified Policy Parity

两仓已按代码与契约核对以下项目：

```text
Runtime Modes                  = VALIDATION / PRODUCTION_FAST
Production initial B renders   = 1
Production creative retries    <= 1
Validation creative cycle cap  <= 3
Evaluator confidence boundary  = 0.65
Production hard failure set    = MATCHED
Production soft advisory rule  = MATCHED
Pairwise image slots            = Stage A / Primary / Challenger
Stage A can win pairwise        = NO
Validation Golden floors        = MATCHED
Current-job Stage A binding     = REQUIRED
```

Production Hard Failure Set：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

Validation Golden floors：

```text
product_hero_strength        9.2
headline_aggression          8.8
typography_product_symbiosis 8.8
one_big_idea_clarity         9.0
compositional_depth_tension  8.8
category_inevitability       9.0
information_density_control  8.8
commercial_finish            9.2
```

## CI Evidence

Python Runtime release commit `339bca03b864f531a59bd6f0105ef4ddccb94684` 已通过 GitHub Actions：

```text
78 passed
3 skipped
0 failed
```

其中跳过项是 opt-in 的真实 Provider smoke 与私有 S01/S02 live validation；没有凭据/私有素材时跳过是预期行为。

Node handoff release line 必须在最终 commit 上同时通过：

```text
npm test
npm run typecheck
```

本状态文件提交后仍以 GitHub Actions 对该**同一最终 commit**的结果作为最终证据；如果 CI 未通过，`SYNC STATUS: MATCHED` 自动失效，必须修复后重新验证。

## Security / Private Assets

RC 树只允许空值 `.env.example`。真实 `.env`、API Key、客户 Job 产物、私有 S01/S02、私有 Golden 图片不得提交。

Golden / Canonical 私有图片通过本地绑定或外部安全存储提供，仓库只保留元数据/原则。

## Live Acceptance Boundary

`SYNC STATUS: MATCHED` 表示 **Python Runtime 与 Node Handoff 的工程行为契约一致**，不等于真实 Provider 与所有品类已经完成最终业务验收。

真实 SiliconFlow/Yunwu + 私有 S01/S02/新 Case 的 live run 没有在本 release CI 中执行时，状态只能是：

```text
LIVE PROVIDER ACCEPTANCE = NOT RUN / PENDING
```

不得写成 PASS。
