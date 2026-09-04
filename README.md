# PP Food MiniProgram Node Handoff

这是交给小程序开发公司的 **Node/TypeScript Runtime 交接仓库**。

```text
Handoff Version: handoff-1.0.0-rc.1
Runtime Source:  PP-Food-Runtime-001 1.0.0-rc.1
Runtime Commit:  339bca03b864f531a59bd6f0105ef4ddccb94684
```

本仓库不是另一套“参考 Skill”，而是 Python Runtime 的 Node 行为镜像。开发公司应接入这里公开的类型、状态机、Prompt Compiler 与 QC/Retry 契约，不应重新解释方法论。

## 开发公司阅读顺序

1. `HANDOFF.md`
2. `docs/NODE_INTEGRATION_GUIDE.md`
3. `docs/PROMPT_RUNTIME_FULL.md`
4. `docs/QC_RETRY.md`
5. `docs/SECURITY_AND_FACTS.md`
6. `src/types.ts`
7. `src/ppFoodPrompts.ts`
8. `src/pipeline.ts`

## 用户层 A / B

### A / 执行A

只做高保真商业商拍：锁产品 DNA，升级灯光、背景、空间、景深、材质揭示和商业完成度。**不做海报，不加字。**

### B / 执行B

B 必须使用当前 Job 的 Stage A PASS 图作为参考编辑输入。锁 Product DNA，不锁死 Stage A 相机；Product Hero #1，Headline Hero #2。

`按默认文案来` 只授权非事实型软文案，不授权编造价格、地址、电话、奖项、认证、产地、净含量、配方、健康功效等硬事实。

## 内部 Runtime Mode

A/B 是用户工作流；`PRODUCTION_FAST` / `VALIDATION` 是 B 的后端执行策略。

### PRODUCTION_FAST — 小程序默认

```text
Source
→ Product Truth
→ current Stage A PASS
→ Copy Firewall / Category Translation / Primary Art Direction
→ B Primary（只生成 1 张初始候选）
→ Independent Production Hard Gate
→ PASS
```

仅当出现交付级硬错误时，允许 **最多 1 次**定向创意重试。正常 PASS 不生成 Challenger，不跑 Pairwise。

Provider / Evaluator / Runtime 故障不消耗创意重试次数。评审置信度 `<0.65` 时只重新评审，不重新生图。

### VALIDATION — 质量研发

```text
Primary + Challenger
→ two independent candidate evaluations
→ Pairwise visual audition
```

Pairwise 图位固定且只有三张：

```text
1 Stage A PASS = control only
2 Primary
3 Challenger
```

Stage A 不能成为赢家。Validation 使用 Golden 向量、Anti-Template 和 Golden-relative 判断。

## 生产硬门槛

Production Fast 只因这些交付问题触发创意 Retry：

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

`PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE` 等软审美问题，单独出现时不自动烧第二张图。

## 不能改的核心

- Source 是产品视觉真值最高权限。
- B 永远从当前 Job 的 A PASS 图继续。
- 不允许静默退化为 text-to-image。
- 产品、包装、器皿、数量、拓扑、表面状态不能被创意改写。
- Category 是语境，不是固定皮肤。
- Golden 只迁移原则，不复制皮肤。
- QC 必须独立看实际生成图；生成器自评不算证据。
- Retry 只修失败维度，冻结已通过维度。

## CI

该同步分支的交付门槛：

```text
npm test
npm run typecheck
```

两者必须在同一最终 commit 上通过，才能标记 Node handoff 同步完成。

## 状态

`handoff-1.0.0-rc.1` 是与 Runtime `1.0.0-rc.1` 对齐的生产收敛 RC。真实 Provider / 私有 S01/S02 素材验证仍属于独立的安全验收步骤；没有执行时不得写成已通过。
