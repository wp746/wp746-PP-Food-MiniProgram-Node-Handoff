# Developer Acceptance Checklist — handoff-1.0.0-rc.1

Runtime source: `PP-Food-Runtime-001 1.0.0-rc.1 @ 339bca03b864f531a59bd6f0105ef4ddccb94684`.

开发公司完成接入后，请逐项确认。

## Architecture

- [ ] A 与 B 用户工作流明确分离
- [ ] B 只能使用当前 Job 的 A PASS
- [ ] Vision / Director / Image / Evaluator 职责分离
- [ ] 业务 Controller 不另写一套 Prompt
- [ ] `src/ppFoodPrompts.ts` 与 `src/pipeline.ts` 是 Node 行为真源
- [ ] 线上显式设置 `runtimeMode=PRODUCTION_FAST`

## Product Fidelity

- [ ] A 使用 source reference edit
- [ ] B 使用 current-job A PASS reference edit
- [ ] package/vessel、count、geometry、topology、surface state 不被重设计
- [ ] reference 未真正绑定时失败关闭，不能 text-to-image fallback
- [ ] Product Truth / Copy Truth failure 能阻断交付

## PRODUCTION_FAST

- [ ] 正常 B PASS 只生成 1 张初始 Primary
- [ ] 正常 PASS 不生成 Challenger
- [ ] 正常 PASS 不运行 Pairwise
- [ ] Production Hard Gate 独立看实际图片
- [ ] 交付级 Hard Failure 最多触发 1 次 targeted creative retry
- [ ] `PHOTO_PLUS_TEXT` / `CATEGORY_CLICHE_DEPENDENCE` / `GENERIC_PREMIUM_SKIN` / `GOLDEN_DISTANCE` 单独出现不自动烧第二张图
- [ ] evaluator confidence `<0.65` 只重评，不重生图
- [ ] Provider / Evaluator / Runtime failure 消耗 0 creative retry

## VALIDATION

- [ ] Primary / Challenger 都会生成
- [ ] 两个候选分别独立评价
- [ ] Pairwise 只接收 3 张图：Stage A control / Primary / Challenger
- [ ] Stage A 不能被选为 winner
- [ ] Primary / Challenger 至少两个结构维度不同
- [ ] Golden floors 与 Runtime RC1 一致
- [ ] 有 First Read、Golden Vector、Anti-Pattern 检查
- [ ] 不合格时允许进入 review / named retry planning，而不是把较好的一张强行判 PASS

## Copy / Security

- [ ] API Key 只在服务端 Secret / env
- [ ] `.env`、客户原图、私有 Golden、Job artifacts 不提交 Git
- [ ] 未授权硬事实不会自动编造
- [ ] `defaultCopyAuthorized=true` 只授权非事实型软 campaign copy
- [ ] 日志不输出 Authorization / API Key
- [ ] 小程序前端不直连模型 Provider

## Artifact / Observability

- [ ] 保存 runtime/handoff version
- [ ] 保存 source / Stage A / prompt / output hash
- [ ] 保存 provider/model/request id
- [ ] 保存 generation latency、failure class、retry count、final decision
- [ ] 能从一次 Job 还原实际执行的是 PRODUCTION_FAST 还是 VALIDATION

## Text Rendering

- [ ] IMAGE_NATIVE 的实际可见文案接受 QC
- [ ] 如果实现 HYBRID_COMPOSITE，必须单独记录实现和验收结果
- [ ] Hybrid 也不能绕过 Copy Firewall allowlist

## Delivery Back to Owner

请返回：

- [ ] 部署 commit SHA / handoff version
- [ ] 使用的 Vision / Image / QC provider 与模型
- [ ] A 调用示例
- [ ] Production Fast B 调用示例与调用次数
- [ ] Validation 调用示例（如启用）
- [ ] 一条完整脱敏 Job 日志
- [ ] A 输出图
- [ ] B 最终输出图；Validation 时另附 Primary / Challenger
- [ ] 对 Prompt / QC / Retry / Provider Adapter 的任何本地修改 diff
