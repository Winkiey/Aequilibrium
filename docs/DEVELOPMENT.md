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

发布使用现有Winkiey/Aequilibrium与GitHub Pages工作流。不要另建站点或改变原Sites访问范围。未完成验收的内容应在制作状态中标记，不能用静态检查代替实际浏览器体验。
