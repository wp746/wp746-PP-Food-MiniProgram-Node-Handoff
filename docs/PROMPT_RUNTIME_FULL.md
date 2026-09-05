# PP Food Prompt Runtime Full Contract — handoff-1.0.0-rc.2

> Executable source of truth: `src/ppFoodPrompts.ts` + `src/pipeline.ts`.
>
> Runtime source: `PP-Food-Runtime-001 1.0.0-rc.2 @ 0930fe08fd2188196478d658739f4e128527501d`.

本文件用于说明完整角色与运行顺序，**不要把整篇文档直接塞进一个 system prompt**。

## 1. Global Orchestrator

- 当前 Source 是产品视觉真值最高权限。
- 不允许导入旧 Job 的品牌、文案、道具、布局、配色或 Big Idea。
- A = 高保真商拍；B = 当前 A PASS 后的商业 KV。
- B 锁 Product DNA，不锁死 Stage A 相机。
- Product Hero #1；Headline Hero #2。

## 2. Vision Observer

只观察，不做艺术指导，不写营销文案。输出当前产品 identity/category/components/count/geometry/package-vessel/topology/physical relations/surface/colors/sensory semantics/fidelity risks/unknown。推断必须有证据与置信度；未知保持 UNKNOWN。

Provider 的 category / pack-or-food 文本属于观察证据，不是直接的生产路由键。

## 3. Product Truth Normalization — RC2

Vision observation 后、Category Translation / Golden routing 前必须经过确定性规范化：

```text
Pack / PACK -> PACK
Food / FOOD -> FOOD
```

当当前用户产品名包含 `罐头 / 蜜橘 / 桔子` 且规范化结果为 `PACK` 时，内部 `primaryCategory` 必须规范为：

```text
CANNED_FRUIT_RETAIL
```

这层规范化用于消除 Provider casing/命名波动。不得把 raw model string 直接作为模板、Category Pack 或 Golden selector。

## 4. Product Truth Lock

锁定：产品类型、几何、比例、数量、组件拓扑、包装/器皿身份、摆放与物理关系、可见表面状态。允许升级摄影呈现；禁止把真实产品改造成“更漂亮的另一个产品”。

## 5. Stage A Director + Compiler

A 只升级：灯光、环境、背景、空间深度、色彩管理、镜头、表面揭示、商业完成度。

硬禁止：海报布局、标题、口号、品牌图形、销售点、产品重设计、组件漂移、器皿替换。

## 6. Stage A Independent QC

先判产品真值，再判摄影质量。美感不能补偿 fidelity drift。只有当前 Job 的 A PASS 能进入 B。

## 7. Copy Firewall

文字分为：

```text
VERIFIED_FACT
AUTHORIZED_CAMPAIGN_COPY
FORBIDDEN_UNSUPPORTED_HARD_FACT
```

`defaultCopyAuthorized=true` 只授权非事实型软 campaign copy。缺失硬事实 = NULL，不能为了版式填满而编造。

## 8. Category Visual Translator

链路：

```text
Normalized Product Truth
→ Sensory Semantics
→ Emotional Semantics
→ Brand Temperament
→ Material Metaphor
→ Typography
→ Color
→ Lighting
→ Spatial Logic
→ Motion/Energy
→ Information System
→ One Big Idea
```

Category 是语境/约束。禁止 `bread -> oven tunnel` 这类字面名词场景化。Golden 只迁移原则，不迁移皮肤。

## 9. B Art Director + Compiler

每个方向只有一个 Product-Derived Big Idea。产品第一主角，标题第二主角；标题需要视觉质量、材质和空间存在感，但不能压缩或遮蔽产品。使用前中后景共构，而不是固定 `top title / center product / bottom footer`。

## 10. PRODUCTION_FAST Evaluator

输入固定：

```text
source
current Stage A PASS
current B Primary
```

只判断交付级硬门槛：机械有效、reference binding、product truth、copy truth、product-first hierarchy、scene dominance、明显破损的 commercial finish。

Hard Failure Set：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

软风格问题可作为 advisory evidence，但不能独立触发 Production Fast 重新生图。

低于 `0.65` confidence → 只重评。

## 11. PRODUCTION_FAST Runner

```text
Primary Direction
→ Primary Render
→ Production Gate
```

正常 PASS：1 张初始 B，0 Challenger，0 Pairwise。

Hard Gate 失败：最多 1 次 targeted repair。第二次仍不合格就停，不进入隐藏的无限循环。

Provider/Evaluator/Runtime 故障消耗 0 创意 Retry。

## 12. VALIDATION Candidate Evaluator

Validation 对 Primary 和 Challenger 各自独立看图。Golden floors：

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

同时检查 Safe Editorial Collapse、Scene Dominance、Category Cliché、Generic Premium Skin、Photo Plus Text、Template Reuse、Information Starvation/Overload。

## 13. VALIDATION Pairwise

只接收三张：

```text
1 Stage A PASS control
2 Primary
3 Challenger
```

只有 `primary` 或 `challenger` 可以成为 winner。无效 winner id 按 Evaluator Failure 失败关闭。

## 14. Retry Planner

Validation 可做更丰富的定向 repair，最大 creative cycles = 3；Production Fast 最大 creative retry = 1。任何 Retry 必须 freeze 已通过维度，并显式命名失败项。

## 15. Security / Artifacts

Key 只在后端 Secret。记录 job/source/A/prompt/provider/output/QC/timing hash 与元数据，不记录 API Key/Authorization。私有 S01/S02、私有 Golden 与客户 Job 产物不提交 Git。
