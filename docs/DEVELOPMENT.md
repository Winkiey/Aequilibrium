# 开发与维护

React19、TypeScript与Vite。游戏状态转换集中在lib/game/engine.ts；演出、故事上下文、教学与阅读不直接改变金融结算。

- components/game/CinematicGame.tsx：流程、地点、对话与存档协调。
- lib/game/narrative-content.ts：16段主线开场与76事件上下文；narrative.ts在开场时冻结玩家真实的前情。
- lib/game/learning.ts：公开事实、费用演算与选项现金日期说明。
- components/game/Bookshelf.tsx：人物、收藏与阅读统一入口。
- lib/game/offline.ts及scripts/build-offline.mjs：资源包、版本和校验；详见OFFLINE.md。
- lib/game/composition.ts：人物脚点、场景台面和已有物件定位。

旧存档继续可用。没有opening的旧记录继续用原演出；新开场作为快照随已经历故事保存，跨周目回看不拿当前局替旧故事补前情。公司历史仅记录真正披露过的数据，不回填缺失历史。更新资源不删除存档。

新增故事或调整资金规则前请阅读根目录AGENTS.md。完成typecheck、适当的自动检查与生产构建；UI点击、离线、移动横屏应在可用浏览器中验收。测试报告和制作记录放docs，README只介绍公开项目。

更新前经济规则、已知限制与重构验收见 [机制审计](MECHANICS_REVIEW.md)，固定策略的1000种子汇总见 [机制基线](MECHANICS_BASELINE.json)。在项目根目录执行 `node scripts/audit-mechanics.mjs 1000` 可重跑；它只读取源码，在 `.sites-runtime/mechanics-audit/` 生成隔离模块与结果，不访问浏览器存档，也不调整游戏参数。基线带源文件指纹；规则或剧情变化后应重新运行并解释差异，不自动覆盖已发布基线。

发布使用现有Winkiey/Aequilibrium与GitHub Pages工作流。不要另建站点或改变原Sites访问范围。未完成验收的内容应在制作状态中标记，不能用静态检查代替实际浏览器体验。

证券市场第一批机制与旧档过渡见 [市场v2](MARKET_V2.md)。`node scripts/benchmark-market.mjs 500` 用公开信息、相同种子及真实交易费用对照策略，汇总记录在 [策略实验](MARKET_BENCHMARK.json)。书店经营按用户要求保持原样。

核验档案、现金留存、分红除息和投资贡献见 [判断与回报](JUDGMENT_AND_RETURNS.md)。`node scripts/benchmark-wealth.mjs 200 [源码目录]` 可使用同本金对照旧版与当前版；[收益实验](RETURNS_BENCHMARK.json)保留源码指纹与真实方法。旧市场v2文档和数据是当时版本的历史记录，不作为当前结果。
