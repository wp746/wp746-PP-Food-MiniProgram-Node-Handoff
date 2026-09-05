# HANDOFF — 小程序开发公司交接说明

## 1. 版本绑定

```text
Node Handoff:   handoff-1.0.0
Runtime:        1.0.0
Runtime Commit: 5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c
```

开发公司不要从旧 Skill、旧对话或旧 Prompt 重新推导业务逻辑。本仓库 `src/` 与上述 Runtime commit 是交付真源。

## 2. 用户工作流

- `A`：高保真商业商拍，不加 KV 文字。
- `B`：必须先得到当前 Job 的 Stage A PASS，再生成商业 KV。

B 文案经过 Copy Firewall；`按默认文案来` 只授权软性、非事实型 campaign copy，不授权虚构价格、地址、电话、认证、奖项、产地、配方、健康功效等硬事实。

## 3. Product Truth normalization — 必须保留

Vision Provider 返回的是观察证据，不允许直接拿原始字符串决定 Category/Golden 路由。

生产边界至少执行：

```text
Pack / PACK -> PACK
Food / FOOD -> FOOD
PACK + 产品名包含 罐头/蜜橘/桔子 -> CANNED_FRUIT_RETAIL
```

该规则来自真实 S02 live acceptance。开发公司不得删除、旁路或重新自由解释这层规范化。

## 4. 两个内部执行策略

### PRODUCTION_FAST — 线上默认

```text
B Request
→ Require current Stage A PASS
→ normalize Product Truth
→ Copy Firewall
→ Category Translation
→ Primary Direction
→ Primary Render
→ Production Evaluator
→ Production Hard Gate
→ PASS
```

正常 PASS 只生成 1 张 Primary，不生成 Challenger、不运行 Pairwise。交付级 Hard Failure 最多允许 1 次 targeted creative retry。

### VALIDATION — 内部研发

```text
B Request
→ current Stage A PASS
→ Primary + Challenger
→ Independent Eval × 2
→ Pairwise: Stage A control + Primary + Challenger
→ Qualified winner / review
```

Pairwise 不得把 Source 或 Golden 当候选，Stage A 不能成为 winner。

## 5. V1 Production Evaluator structured-output protocol

真实 S02 `PRODUCTION_FAST` 曾跑到 evaluator，但 SiliconFlow 返回 `RawEvaluation` JSON Schema 本身，而不是评审数据实例。Runtime 1.0.0 保留 RC3 已验证的协议保护，并将此类情况与创意失败完全分离。

Provider / adapter 至少识别：

```text
INVALID_JSON
SCHEMA_ECHO
MODEL_VALIDATION
```

并归一为：

```text
STRUCTURED_OUTPUT_PROTOCOL_FAILURE
```

Production evaluator 行为固定：

```text
first protocol failure
→ evaluator-only retry × 1
→ exact same Source / Stage A / B Candidate
→ no image regeneration
→ zero creative retry cost

second protocol failure
→ NEEDS_HUMAN_REVIEW
→ failureCode = EVALUATOR_PROTOCOL_FAILURE
→ retryEligible = false
→ failureClass = EVALUATOR_PROTOCOL
→ do not regenerate image
```

不得把 schema echo、JSON parse failure 或 model validation failure 转换成 B creative retry。

真实 evaluator-only acceptance 已验证该协议链能返回正常 Production Gate。复用的历史 S02 候选本身返回 `HERO_WEAK`；这属于正常视觉交付门槛，不属于 evaluator protocol failure，也不得通过降低门槛伪造 PASS。

## 6. Production Hard Gate

只有这些交付问题允许 creative Retry：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

软审美短板（如 `PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE`）不能单独触发线上重复生图。

Evaluator confidence `<0.65` → `NEEDS_SECOND_EVALUATION`，只重评，不重生图。

## 7. 不得静默改变的产品方法

1. 当前 source image 是产品视觉真值最高权限。
2. A 只升级摄影，不改产品，不加海报文案。
3. B 必须从当前 Job 的 A PASS 图继续。
4. B 锁 Product DNA，不锁死 A 相机机位。
5. Product Hero #1，Headline Hero #2。
6. Category 是上下文与约束，不是统一模板。
7. 产品感官语义是视觉语言第一来源。
8. Golden 迁移原则，不迁移皮肤。
9. QC 必须独立看实际像素。
10. Provider/Evaluator/Runtime 故障不是创意失败，不消耗 creative Retry。
11. Retry 必须定向修复且 Pass-Freeze。
12. Provider 原始分类字符串必须先规范化再参与路由。
13. Evaluator structured-output failure 必须先协议化处理，不得触发生图。

## 8. Image Provider

B 的 reference image 必须是当前 Job 的 Stage A PASS。必须记录 reference binding；不允许静默降级为 text-to-image。

至少记录：job id、source hash、Stage A hash、prompt hash、runtime/handoff version、provider/model/request id、generation latency、QC/failure class、retry count、final decision。

## 9. 中文文字

- `IMAGE_NATIVE`：模型直接渲染；必须 QC 精确文案。
- `HYBRID_COMPOSITE`：模型负责视觉世界/结构/承载空间，后端负责最终准确中文和已授权业务信息。

无论哪种模式都不能绕过 Copy Firewall。

## 10. 安全

API Key 只能存在后端 Secret/环境变量。禁止提交 `.env`、真实 Key、私有 S01/S02、客户 Job 原图或生成物。已经出现在聊天或历史文件中的旧 Key 视为泄露，不得复用。

## 11. 开发公司必须返回

1. 实际部署 commit/version
2. Vision / QC / Image provider 与模型名
3. A/B 请求响应样例
4. 脱敏完整 Job 日志
5. Source / Stage A / Prompt / Output hash
6. A/B 最终生成图
7. Runtime Mode
8. 是否启用 Hybrid Composite
9. 对 Prompt / QC / Retry / Normalization / Provider Adapter 的任何本地修改 diff
