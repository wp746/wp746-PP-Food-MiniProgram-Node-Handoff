# QC & Retry — Runtime 1.0.0 parity

## 1. A QC

产品真值先于创意质量。检查 identity、geometry/count、topology、surface state、package/vessel、plating/physical relations，再看 hero、材质揭示、背景、灯光、景深和 commercial finish。A 未 PASS，不得进入 B。

## 2. Category / Golden Routing Integrity

Provider observation 必须先经过确定性规范化。`Pack / PACK` casing 不得改变 Category/Golden 路由；包装桔子罐头应进入 `CANNED_FRUIT_RETAIL`。requested Golden 未检索到时记录诊断证据，不得让 review/report 崩溃。

## 3. PRODUCTION_FAST Hard Gate

允许一次 targeted creative retry 的交付级失败：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

以下软审美问题单独出现时不重生图：

```text
PHOTO_PLUS_TEXT
CATEGORY_CLICHE_DEPENDENCE
GENERIC_PREMIUM_SKIN
GOLDEN_DISTANCE
other non-breaking style shortfalls
```

Evaluator confidence `<0.65`：

```text
NEEDS_SECOND_EVALUATION
failureClass = EVALUATOR
retryEligible = false
```

只重评，不重生图。

## 4. V1 Structured-output Protocol

Production evaluator 的响应必须是评审数据实例，而不是 schema。以下均为协议失败：

```text
INVALID_JSON
SCHEMA_ECHO
MODEL_VALIDATION
```

统一错误类别：

```text
STRUCTURED_OUTPUT_PROTOCOL_FAILURE
```

处理规则：

```text
第一次协议失败
→ evaluator-only retry × 1
→ 使用完全相同的 Source / Stage A / Candidate
→ instance-only JSON instruction
→ 不生图
→ 不消耗 creative retry

第二次协议失败
→ NEEDS_HUMAN_REVIEW
→ EVALUATOR_PROTOCOL_FAILURE
→ failureClass = EVALUATOR_PROTOCOL
→ retryEligible = false
→ do not regenerate image
```

禁止把 `$defs / properties / required / title / type` 等 JSON Schema 回显当成 EvaluationResult。

## 5. PRODUCTION_FAST Retry Budget

```text
initial B renders = 1
max creative retry = 1
provider/evaluator/runtime retry cost = 0 creative retries
evaluator protocol retry = max 1 evaluator call, 0 image generations
```

Creative Retry 必须从同一个 current-job Stage A PASS 开始，使用明确 repair instruction，并冻结通过维度。

## 6. VALIDATION Golden Vector

当前门槛：

```text
product_hero_strength        >= 9.2
headline_aggression          >= 8.8
typography_product_symbiosis >= 8.8
one_big_idea_clarity         >= 9.0
compositional_depth_tension  >= 8.8
category_inevitability       >= 9.0
information_density_control  >= 8.8
commercial_finish            >= 9.2
```

产品真值、文案真值、机械有效性、Reference Binding 优先于分数。

## 7. First Read

```text
1 PRODUCT
2 HEADLINE
3 BIG IDEA / SECONDARY MESSAGE
```

场景成为第一眼 → `SCENE_DOMINATES_PRODUCT`；产品失去第一主角 → `HERO_WEAK`。

真实 evaluator-only acceptance 中，复用的历史 S02 候选返回 `HERO_WEAK`。V1 保留该硬门槛，不为了制造 PASS 而降低 QC。

## 8. Validation Pairwise

Pairwise 且只接收：

```text
image 1 = Stage A PASS control
image 2 = Primary
image 3 = Challenger
```

Primary/Challenger winner 不代表自动 PASS，仍需独立 Candidate Evaluation / Golden-relative 判断。

## 9. Pass Freeze

所有 Creative Retry 冻结已经通过的产品真值和视觉维度，只改失败项及其必要依赖。禁止无目标“再生成一张试试”。Evaluator protocol retry 不是 Creative Retry。
