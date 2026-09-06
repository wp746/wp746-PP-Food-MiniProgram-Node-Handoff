# PP Food MiniProgram Node Handoff

这是交给小程序开发公司的 **Node/TypeScript Runtime 交接仓库**。

```text
Handoff Version: handoff-1.0.1
Runtime Source:  PP-Food-Runtime-001 1.0.1
Runtime Commit:  7956c82ed3a4a197d29ad8ec1aca6777f23ccb82
```

本仓库不是另一套 Skill，而是 Python Runtime 的生产行为镜像。开发公司应按本仓库的类型、状态机、Prompt Compiler、QC/Retry 契约实现，不得重新解释方法论。

## 1.0.1：B 标题空间化硬规则

真实中文热菜 KV 测试暴露了一个生产问题：产品主视觉可以合格，但主标题/副标题可能退化成后贴的平面文字，缺少透视、层次、遮挡和场景光影关系。Runtime 1.0.1 将这一问题正式固化为生产规则。

固定行为：

```text
Product Hero = visual hero #1
Headline     = visual hero #2
Headline + subtitle/supporting-title
→ distinct depth roles
→ visible spatial relationship
```

空间证据可以是：透视/缩短透视、层叠厚度或浮雕、前中后景穿插、产品与文字遮挡、承载物深度、接触/投射阴影、共享场景光照等。

**不要求所有品类都使用夸张厚重 3D 字。** Editorial/克制品类可以通过透视、层叠平面、遮挡和光影整合建立空间感。目标是“文字属于场景”，不是统一套一种 3D 风格。

若主副标题像可直接删除的 Photoshop 平面贴字，必须返回：

```text
TITLE_SPATIALITY_WEAK
→ Production Hard Gate
→ targeted creative retry（最多沿用 Production Fast 的 1 次上限）
→ 只修标题深度/透视/遮挡/材质/光影
→ 不缩小产品，不改变 Product DNA，不改授权文案
```

详细规则：`docs/B_KV_TITLE_SPATIAL_RULES.md`。

## V1：Production Evaluator 协议保护

真实 S02 `PRODUCTION_FAST` 曾跑到 Production Evaluator，但 SiliconFlow 返回 `RawEvaluation` 的 JSON Schema 本身，而不是评审数据实例。该 structured-output protocol protection 继续保持：

```text
Production evaluator
→ valid EvaluationResult → normal Production Hard Gate
→ STRUCTURED_OUTPUT_PROTOCOL_FAILURE
   → evaluator-only retry × 1
   → same Source / Stage A / B Candidate
   → no image regeneration
   → zero creative retry cost
→ protocol failure again
   → NEEDS_HUMAN_REVIEW
   → EVALUATOR_PROTOCOL_FAILURE
   → retryEligible = false
```

`INVALID_JSON`、`SCHEMA_ECHO`、`MODEL_VALIDATION` 都属于 structured-output protocol failure，不得转换成创意重生图。

## Product Truth normalization

Vision Provider 输出是观察证据，不是内部 routing key。`Pack / PACK` 必须先统一为 `PACK`；包装桔子/蜜橘/罐头任务内部类别必须进入 `CANNED_FRUIT_RETAIL`。

## 用户层 A / B

- `A`：高保真商业商拍，只升级摄影，不做 KV、不加字。
- `B`：必须基于当前 Job 的 Stage A PASS 图继续。锁 Product DNA，不锁死相机。

`按默认文案来` 只授权非事实型软 campaign copy，不授权虚构价格、地址、电话、认证、奖项、产地、净含量、配方、健康功效等硬事实。

## Runtime Mode

### PRODUCTION_FAST — 小程序默认

```text
Source
→ Product Truth + deterministic normalization
→ current Stage A PASS
→ Copy Firewall / Category Translation / Primary Art Direction
→ B Primary（1 张初始图）
→ Independent Production Hard Gate
→ PASS
```

正常 PASS 不生成 Challenger、不跑 Pairwise。交付级 Hard Failure 最多允许 1 次 targeted creative retry。Provider / Evaluator / Runtime 故障不消耗 creative retry。

### VALIDATION — 内部质量研发

```text
Primary + Challenger
→ independent evaluations
→ Pairwise: Stage A control + Primary + Challenger
```

Stage A 只作为 control，不能成为 winner。

## Production Hard Failure Set

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
TITLE_SPATIALITY_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

`PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE` 等软审美问题不能单独触发线上重生图。

## 开发公司阅读顺序

1. `HANDOFF.md`
2. `docs/B_KV_TITLE_SPATIAL_RULES.md`
3. `docs/NODE_INTEGRATION_GUIDE.md`
4. `docs/PROMPT_RUNTIME_FULL.md`
5. `docs/QC_RETRY.md`
6. `docs/SECURITY_AND_FACTS.md`
7. `src/types.ts`
8. `src/ppFoodPrompts.ts`
9. `src/pipeline.ts`

## CI 门槛

```text
npm test
npm run typecheck
```

必须在同一最终 commit 上同时通过，才能标记 handoff 同步完成。

## 安全

API Key 只允许存在后端 Secrets/环境变量。禁止提交 `.env`、真实 Key、客户 Job 资产、私有 S01/S02 或 Golden 图片。
