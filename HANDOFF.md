# HANDOFF — 小程序开发公司交接说明

## 1. 版本绑定

本交接版本必须与下列 Python Runtime 行为一致：

```text
Node Handoff:   handoff-1.0.0-rc.1
Runtime:        1.0.0-rc.1
Runtime Commit: 339bca03b864f531a59bd6f0105ef4ddccb94684
```

开发公司不要从旧 Skill、旧对话或旧 Prompt 重新推导业务逻辑。本仓库 `src/` 与上述 Runtime commit 是交付真源。

## 2. 用户工作流

用户只需要上传一张图并选择：

- `A`：高保真商业商拍，不加 KV 文字。
- `B`：先获得当前 Job 的 Stage A PASS，再生成商业 KV。

B 文案必须经过 Copy Firewall；默认文案授权只允许软性、非事实型 campaign copy。

## 3. 两个内部执行策略

### PRODUCTION_FAST

这是小程序线上默认策略。

```text
B Request
→ Require current Stage A PASS
→ Copy Firewall
→ Category Translation
→ Primary Direction
→ Primary Render
→ Production Hard Gate
→ PASS
```

如果 Production Hard Gate 检出交付级硬失败，可定向重试一次。**最多一次。** 正常 PASS 不生成 Challenger、不运行 Pairwise。

### VALIDATION

用于质量研发、Golden 校准、回归分析：

```text
B Request
→ Require current Stage A PASS
→ Primary + Challenger
→ Independent Eval x2
→ Pairwise: Stage A control + Primary + Challenger
→ Qualified winner / review
```

Pairwise 不得混入 Source 或 Golden 图作为候选。

## 4. 生产 Hard Gate

创意 Retry 只针对：

- `PRODUCT_IDENTITY_DRIFT`
- `COPY_TRUTH_FAILURE`
- `MECHANICAL_FAILURE`
- `REFERENCE_BINDING_FAILURE`
- `HERO_WEAK`
- `SCENE_DOMINATES_PRODUCT`
- `COMMERCIAL_FINISH_WEAK`

软审美短板（如 `PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE`）不能单独触发线上重复生图。

Evaluator confidence `<0.65` → `NEEDS_SECOND_EVALUATION`，只重评，不重新生成图片。

## 5. 不得静默改变的产品方法

1. 当前 source image 是产品视觉真值最高权限。
2. A 只升级摄影，不改产品，不加海报文案。
3. B 必须从当前 Job 的 A PASS 图继续。
4. B 锁 Product DNA，不锁死 A 相机机位。
5. Product Hero #1，Headline Hero #2。
6. Category 是上下文与约束，不是统一模板。
7. 产品感官语义是视觉语言第一来源。
8. Golden 迁移原则，不迁移皮肤。
9. QC 必须独立看实际像素。
10. Provider/Evaluator/Runtime 故障不是创意失败，不消耗创意 Retry。
11. Retry 必须定向修复且 Pass-Freeze。
12. 不允许为了“更高级”而牺牲产品真实性。

## 6. Image Provider

Image Provider 必须执行 reference image / image edit，并真正携带当前 Job 的参考图。对 B 来说参考图是当前 Stage A PASS。

至少记录：

- job id
- source hash
- Stage A hash
- prompt hash
- runtime/handoff version
- provider/model/request id
- generation latency
- QC / failure class
- retry count
- final decision

Reference 未实际绑定时应失败关闭，不允许静默改成纯 text-to-image。

## 7. 中文文字

保留两种策略：

- `IMAGE_NATIVE`：模型直接渲染；必须 QC 精确文案。
- `HYBRID_COMPOSITE`：图像模型负责视觉世界、结构与文字承载空间，后端负责最终准确中文/品牌/价格/地址/二维码等已授权文字。

本 RC 同步的是 Runtime 策略与 Prompt 契约；如果开发公司实现 Hybrid 合成层，必须单独记录实现与验收结果，不能声称仓库当前已经实现了完整合成器。

## 8. 安全

API Key 只能存在后端 Secret/环境变量。禁止提交 `.env`、真实 Key、私有 S01/S02、客户 Job 原图或生成物。

任何已经出现在聊天、文件或代码历史中的旧 Key 都应视为泄露，不得复用。

## 9. 开发公司必须返回

初次接入后至少返回：

1. 实际部署 commit/version
2. Vision / QC / Image provider 与模型名
3. A/B 请求响应样例
4. 脱敏完整 Job 日志
5. Source / Stage A / Prompt / Output hash
6. A/B 最终生成图
7. Runtime Mode
8. 是否启用 Hybrid Composite
9. 对本仓库的任何修改 diff

未经列明，不得静默修改 Prompt、QC、重试上限或图位顺序。
