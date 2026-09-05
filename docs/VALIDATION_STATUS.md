# Validation Status — handoff-1.0.0-rc.2

## Version Mapping

```text
Node Handoff:    handoff-1.0.0-rc.2
Runtime Version: 1.0.0-rc.2
Runtime Commit:  0930fe08fd2188196478d658739f4e128527501d
SYNC TARGET:     MATCHED
```

## RC2 reason

真实 S02 live acceptance 发现 Vision 返回 `pack_or_food = "Pack"`，RC1 Python 路由却按大小写敏感的 `"PACK"` 判断，导致桔子罐头没有进入 `CANNED_FRUIT_RETAIL`，也没有检索到 S02 S-tier Golden。RC2 在 Python 与 Node 两仓同步增加 Product Truth / pack signal 的确定性规范化；该修复属于路由正确性，不改变已批准的 A/B 视觉方法论。

## Verified Policy Parity

两仓按代码与契约对齐以下项目：

```text
Runtime Modes                   = VALIDATION / PRODUCTION_FAST
Production initial B renders    = 1
Production creative retries     <= 1
Validation creative cycle cap   <= 3
Evaluator confidence boundary   = 0.65
Production hard failure set     = MATCHED
Production soft advisory rule   = MATCHED
Pairwise image slots             = Stage A / Primary / Challenger
Stage A can win pairwise         = NO
Current-job Stage A binding      = REQUIRED
Pack/food casing normalization   = REQUIRED
Canned-fruit PACK canonical id   = CANNED_FRUIT_RETAIL
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

Validation Golden floors remain a Python Runtime validation concern and are unchanged from RC1:

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

Python Runtime RC2 commit `0930fe08fd2188196478d658739f4e128527501d` 已通过 GitHub Actions：

```text
82 passed
3 skipped
0 failed
```

3 个 skipped 是 opt-in 的真实 Provider smoke 与私有 S01/S02 live tests。

Node RC2 新增 canned-fruit normalization 回归测试。TDD RED 已验证：在实现前该测试以 `normalizeProductTruth is not a function` 失败；实现后运行测试已达到 8/8 PASS。最终交付仍以本文件所在**同一最终 commit**上的以下两个 CI 步骤同时成功为准：

```text
npm test
npm run typecheck
```

如果最终 CI 未通过，则不得报告 `SYNC STATUS: MATCHED`。

## Live Acceptance Evidence

RC1 真实 Provider run 已证明 SiliconFlow 与 Yunwu 能完成真实请求，但：

- S01 Validation：真实生成成功；因严格 Golden floors 返回 `NO_QUALIFIED_WINNER`，无产品/文案硬失败。
- S02 Validation：运行完成，但结果受上述 RC1 category/Golden routing bug 污染，因此不能作为修复后视觉质量证据。
- RC1 review-sheet 在找不到 `golden-S02` 时抛出 `StopIteration`，导致后续 S02 Production Fast 未执行。

因此 RC2 当前 live 边界为：

```text
LIVE RC2 S02 VALIDATION       = PENDING
LIVE RC2 S02 PRODUCTION_FAST  = PENDING
```

不需要再次烧 S01；只需要对 S02 做一次定向 RC2 live acceptance。

## Security / Private Assets

RC 树只允许空值 `.env.example`。真实 `.env`、API Key、客户 Job 产物、私有 S01/S02、私有 Golden 图片不得提交。
