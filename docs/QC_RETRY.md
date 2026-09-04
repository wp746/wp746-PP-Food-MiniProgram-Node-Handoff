# QC & Retry — Runtime 1.0.0-rc.1 parity

## 1. A QC

产品真值先于创意质量。检查顺序包括：identity、geometry/count、topology、surface state、package/vessel、plating/physical relations，再看 hero、材质揭示、背景、灯光、景深和 commercial finish。

A 未 PASS，不得进入 B。

## 2. PRODUCTION_FAST Hard Gate

Production Fast 的目标是判断“是否可交付”，而不是为追求更高 Golden 分无限重生图。

会阻止交付并允许一次 targeted creative retry 的失败：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

以下软审美问题单独出现时不触发线上重生图：

```text
PHOTO_PLUS_TEXT
CATEGORY_CLICHE_DEPENDENCE
GENERIC_PREMIUM_SKIN
GOLDEN_DISTANCE
other non-breaking style shortfalls
```

Evaluator confidence `< 0.65`：

```text
NEEDS_SECOND_EVALUATION
failureClass = EVALUATOR
retryEligible = false
```

只重评，不重生图。

## 3. PRODUCTION_FAST Retry Budget

```text
initial B renders = 1
max creative retry = 1
provider/evaluator/runtime retry cost = 0 creative retries
```

Retry 必须从同一个 current-job Stage A PASS 开始，使用明确的 repair instruction，并冻结通过维度。

## 4. VALIDATION Golden Vector

0–10 当前门槛与 Python Runtime 一致：

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

产品真值、文案真值、机械有效性、Reference Binding 仍是比分数更高的 hard gate。

## 5. First Read

目标：

```text
1 PRODUCT
2 HEADLINE
3 BIG IDEA / SECONDARY MESSAGE
```

场景成为第一眼 → `SCENE_DOMINATES_PRODUCT`。
产品明显失去第一主角地位 → `HERO_WEAK`。

## 6. Validation Pairwise

Pairwise 接收且只接收：

```text
image 1 = Stage A PASS control
image 2 = Primary
image 3 = Challenger
```

Primary 胜 Challenger 不代表自动 PASS；Validation 仍需独立 Candidate Evaluation / Golden-relative quality 判断。

## 7. Anti-Pattern

Validation 重点检查：

```text
SAFE_EDITORIAL_COLLAPSE
SCENE_DOMINATES_PRODUCT
CATEGORY_CLICHE_DEPENDENCE
GENERIC_PREMIUM_SKIN
PHOTO_PLUS_TEXT
TEMPLATE_REUSE
INFORMATION_STARVATION
INFORMATION_OVERLOAD
```

## 8. Pass Freeze

所有 Retry 都必须冻结已经通过的产品真值和视觉维度，只改失败项及其必要依赖。禁止无目标“再生成一张试试”。
