# HANDOFF — 小程序开发公司交接说明

## 1. 版本绑定

```text
Node Handoff:   handoff-1.0.1
Runtime:        1.0.1
Runtime Commit: 7956c82ed3a4a197d29ad8ec1aca6777f23ccb82
```

开发公司不要从旧 Skill、旧对话或旧 Prompt 重新推导业务逻辑。本仓库 `src/` 与上述 Runtime commit 是交付真源。

## 2. 用户工作流

- `A`：高保真商业商拍，不加 KV 文字。
- `B`：必须先得到当前 Job 的 Stage A PASS，再生成商业 KV。

B 文案经过 Copy Firewall；`按默认文案来` 只授权软性、非事实型 campaign copy，不授权虚构价格、地址、电话、认证、奖项、产地、配方、健康功效等硬事实。

## 3. Product Truth normalization — 必须保留

```text
Pack / PACK -> PACK
Food / FOOD -> FOOD
PACK + 产品名包含 罐头/蜜橘/桔子 -> CANNED_FRUIT_RETAIL
```

Vision Provider 返回的是观察证据，必须先规范化再参与 Category/Golden 路由。

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

Stage A 只作为 control，不能成为 winner。

## 5. 1.0.1 B KV Title Spatiality — 必须保留

产品仍是视觉 hero #1，主标题仍是 hero #2。主标题和副标题/辅助标题不得退化成后贴的平面文字层。

合格空间证据至少包含一个或多个：

- perspective / foreshortening；
- layered thickness / bevel / relief；
- 产品与文字 overlap / occlusion；
- headline 与 subtitle/supporting-title 分属不同深度平面；
- depth-bearing carrier；
- contact/cast shadow；
- 与场景一致的 key/rim light、反射、高光、烟雾或环境交互；
- foreground / midground / background crossing。

**不要求所有品类都做夸张厚重 3D 字。** 克制 editorial 品类可以用透视、层叠平面、遮挡与共享光影建立空间关系。

Anti-flatness 判定：如果标题可以像 Photoshop 贴字一样直接删除，而主体场景几乎完全不变，应报告：

```text
TITLE_SPATIALITY_WEAK
```

它是 Production Fast delivery hard gate。Targeted retry 必须：

```text
preserve Stage A
preserve Product Truth
preserve authorized copy
freeze passing dimensions
repair only title depth / perspective / overlap / occlusion / material / lighting
never shrink or demote product
```

详细真源：`docs/B_KV_TITLE_SPATIAL_RULES.md`。

## 6. Production Evaluator structured-output protocol

Provider / adapter 至少识别：

```text
INVALID_JSON
SCHEMA_ECHO
MODEL_VALIDATION
```

并归一为 `STRUCTURED_OUTPUT_PROTOCOL_FAILURE`。

```text
first protocol failure
→ evaluator-only retry × 1
→ exact same Source / Stage A / B Candidate
→ no image regeneration
→ zero creative retry cost

second protocol failure
→ NEEDS_HUMAN_REVIEW
→ EVALUATOR_PROTOCOL_FAILURE
→ retryEligible = false
→ do not regenerate image
```

不得把 schema echo、JSON parse failure 或 model validation failure 转成 B creative retry。

## 7. Production Hard Gate

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

软审美短板（如 `PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE`）不能单独触发线上重复生图。

Evaluator confidence `<0.65` → `NEEDS_SECOND_EVALUATION`，只重评，不重生图。

## 8. 不得静默改变的产品方法

1. 当前 source image 是产品视觉真值最高权限。
2. A 只升级摄影，不改产品，不加海报文案。
3. B 必须从当前 Job 的 A PASS 图继续。
4. B 锁 Product DNA，不锁死 A 相机机位。
5. Product Hero #1，Headline Hero #2。
6. Headline/subtitle 必须有可见空间关系，但不得通过缩小产品实现。
7. Category 是上下文与约束，不是统一模板。
8. 产品感官语义是视觉语言第一来源。
9. Golden 迁移原则，不迁移皮肤。
10. QC 必须独立看实际像素。
11. Provider/Evaluator/Runtime 故障不是创意失败，不消耗 creative Retry。
12. Retry 必须定向修复且 Pass-Freeze。
13. Provider 原始分类字符串必须先规范化再参与路由。
14. Evaluator structured-output failure 必须先协议化处理，不得触发生图。

## 9. Image Provider

B reference image 必须是当前 Job 的 Stage A PASS。必须记录 reference binding；不允许静默降级为 text-to-image。

至少记录：job id、source hash、Stage A hash、prompt hash、runtime/handoff version、provider/model/request id、generation latency、QC/failure class、retry count、final decision。

## 10. 中文文字

- `IMAGE_NATIVE`：模型直接渲染；必须 QC 精确文案与 title spatiality。
- `HYBRID_COMPOSITE`：模型负责视觉世界/结构/承载空间，后端负责最终准确中文；最终合成仍必须保持标题透视、遮挡、光影和深度关系，不能退化成平贴字。

无论哪种模式都不能绕过 Copy Firewall。

## 11. 安全

API Key 只能存在后端 Secret/环境变量。禁止提交 `.env`、真实 Key、私有 S01/S02、客户 Job 原图或生成物。已经出现在聊天或历史文件中的旧 Key 视为泄露，不得复用。

## 12. 开发公司必须返回

1. 实际部署 commit/version
2. Vision / QC / Image provider 与模型名
3. A/B 请求响应样例
4. 脱敏完整 Job 日志
5. Source / Stage A / Prompt / Output hash
6. A/B 最终生成图
7. Runtime Mode
8. 是否启用 Hybrid Composite
9. 对 Prompt / QC / Retry / Normalization / Title Spatiality / Provider Adapter 的任何本地修改 diff
