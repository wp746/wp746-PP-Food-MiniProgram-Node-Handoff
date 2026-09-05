# Developer Acceptance Checklist — handoff-1.0.0

Runtime source: `PP-Food-Runtime-001 1.0.0 @ 5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c`.

开发公司完成接入后逐项确认。

## Architecture

- [ ] A / B 用户工作流分离
- [ ] B 只能使用 current-job A PASS
- [ ] Vision / Director / Image / Evaluator 职责分离
- [ ] Controller 不另写一套 Prompt / Retry
- [ ] `src/ppFoodPrompts.ts` + `src/pipeline.ts` 是 Node 行为真源
- [ ] 线上显式 `runtimeMode=PRODUCTION_FAST`

## Product Truth Normalization

- [ ] raw `packOrFood="Pack"` → `PACK`
- [ ] `Food / FOOD` casing 不影响 FOOD
- [ ] `PACK + 桔子罐头/蜜橘/罐头` → `CANNED_FRUIT_RETAIL`
- [ ] Controller 不直接拿 Provider raw category/pack 选模板或 Golden
- [ ] 外部已有 ProductTruth 进入 Stage B 时仍执行 normalization

## Product Fidelity

- [ ] A 使用 source reference edit
- [ ] B 使用 current-job A PASS reference edit
- [ ] package/vessel、count、geometry、topology、surface state 不被重设计
- [ ] reference 未绑定时失败关闭，不 text-to-image fallback
- [ ] Product Truth / Copy Truth failure 阻断交付

## PRODUCTION_FAST

- [ ] 正常 PASS 只生成 1 张初始 Primary
- [ ] 正常 PASS 不生成 Challenger
- [ ] 正常 PASS 不运行 Pairwise
- [ ] Production Hard Gate 独立看实际图片
- [ ] Hard Failure 最多 1 次 targeted creative retry
- [ ] 软审美问题单独出现不自动烧第二张图
- [ ] evaluator confidence `<0.65` 只重评，不重生图
- [ ] Provider / Evaluator / Runtime failure 消耗 0 creative retry

## V1 Evaluator Protocol

- [ ] Vision adapter 能识别 `INVALID_JSON`
- [ ] Vision adapter 能识别 `SCHEMA_ECHO`
- [ ] Vision adapter 能识别 `MODEL_VALIDATION`
- [ ] 三者统一为 `STRUCTURED_OUTPUT_PROTOCOL_FAILURE`
- [ ] schema definition (`$defs/properties/required/title/type`) 不会被当成 EvaluationResult data instance
- [ ] 第一次 protocol failure 只重 evaluator 1 次
- [ ] evaluator retry 使用完全相同 Source / Stage A / Candidate
- [ ] evaluator retry 不调用 `image.edit`
- [ ] evaluator retry 消耗 0 creative retry
- [ ] 第二次 protocol failure → `NEEDS_HUMAN_REVIEW`
- [ ] 第二次 protocol failure → `EVALUATOR_PROTOCOL_FAILURE`
- [ ] 第二次 protocol failure → `retryEligible=false`
- [ ] 第二次 protocol failure 不触发生图

## VALIDATION

- [ ] Primary / Challenger 都生成
- [ ] 两候选独立评价
- [ ] Pairwise 只接收 Stage A control / Primary / Challenger
- [ ] Stage A 不能成为 winner
- [ ] Golden floors 与 Runtime 1.0.0 一致
- [ ] 有 First Read / Golden Vector / Anti-Pattern
- [ ] 不合格时 review / named retry，不强行 PASS

## Copy / Security

- [ ] API Key 只在后端 Secret / env
- [ ] `.env`、客户原图、私有 Golden、Job artifacts 不提交 Git
- [ ] 未授权硬事实不自动编造
- [ ] `defaultCopyAuthorized=true` 只授权非事实型软 copy
- [ ] 日志不输出 Authorization / API Key
- [ ] 小程序前端不直连模型 Provider

## Artifact / Observability

- [ ] 保存 runtime/handoff version
- [ ] 保存 source / Stage A / prompt / output hash
- [ ] 保存 normalized packOrFood / primaryCategory
- [ ] 保存 provider/model/request id
- [ ] 保存 generation latency、failure class、creative retry count、evaluator protocol retry count、final decision
- [ ] 能还原 Job 实际执行模式

## Text Rendering

- [ ] IMAGE_NATIVE 实际可见文案接受 QC
- [ ] HYBRID_COMPOSITE（如实现）单独记录实现/验收
- [ ] Hybrid 不能绕过 Copy Firewall

## Delivery Back to Owner

- [ ] 部署 commit SHA / handoff version
- [ ] Vision / Image / QC provider 与模型
- [ ] A 调用示例
- [ ] Production Fast B 调用示例与调用次数
- [ ] evaluator protocol retry 日志样例（脱敏）
- [ ] Validation 调用示例（如启用）
- [ ] 一条完整脱敏 Job 日志
- [ ] A 输出图
- [ ] B 最终输出图
- [ ] 对 Prompt / QC / Retry / Normalization / Provider Adapter 的任何本地修改 diff
