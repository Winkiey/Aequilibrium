# 均衡之渊 · Aequilibrium

澄港，初秋。一封信，一把钥匙，还有尚未决定的三年。

中文网页单机叙事游戏。你在印刷厂校对书稿，用六年攒下的十二万元，面对旧书店的去留、朋友的投资邀请，以及每一季到期的约定。

## 游玩

开场是一段可暂停、跳过和重播的 33 秒手绘分镜影片。书店本身是入口：点击信封走进对话，点击报纸了解城市与公司，翻账本查看现金和约定。人物对白逐字出现，点击或按空格／回车推进，支持回看和物件查看。首季有六步引导，也可以直接跳过。手机采用横屏体验，竖屏时提示转动手机并暂停影片与对白。

十二季主线与五十二个条件事件，共六十四个核心节点。每个事件有单独编写的逐句演出、可查看的物件，以及 A/B 两个后续分镜，共 192 套事件场景组合。场景由 17 张原创手绘地点背景、10 位固定人物的 30 个姿态和物件图集组合；同一地点与人物跨故事复用，不是 192 张独立绘画。八种结局也有逐句演出，之后解锁经济学复盘。

每季至多三次主动买卖。阅读与思考没有倒计时，确认结束本季才推进市场、工资、生活收支与到期承诺。手续费与成交冲击实际计入资金。新闻提供已披露资料，不预测下季价格。

进度、阅读位置和引导自动保存在当前浏览器。支持导出／导入；新游戏与导入之前自动备份当前进度，兼容旧版存档。环境音由 Web Audio 在本地合成，主动开启后播放，页面隐藏时暂停。

## 本地开发

需要 Node.js 22.13 或更新版本。

```sh
npm ci
npm run dev
```

打开终端提供的地址，默认端口 5173。`/playtest` 使用独立存档，可以验收首次游玩而不影响主页进度。暂停菜单的「分镜总览」可预览全部事件、128 个后续和八种结局，不改动账目；其中包含剧透。

```sh
npm run typecheck
npm test
npm run build
```

21 项测试包含 500 个完整周目、资金守恒、费用、借款期限、承诺修改、旧存档兼容与全部素材和分镜覆盖。测试更新 `docs/VISUAL_COVERAGE.json`。生产构建输出 Cloudflare Worker 与本地静态素材。素材已随仓库提供，普通开发与部署无需生成图片、安装 Python 或调用模型 API。

## 结构

| 路径 | 职责 |
| --- | --- |
| `components/game/CinematicGame.tsx` | 标题、场景、存档、引导与季度流程 |
| `components/game/CinematicPlayer.tsx` | 逐字对白、选择、分支回应和阅读位置 |
| `components/game/Stage.tsx` | 背景、固定人物姿态、物件、运镜与天气 |
| `components/game/PaperViews.tsx` | 报纸、公司、账本和往事 |
| `app/cinematic.css` | 视觉演出、纸面界面和响应式布局 |
| `lib/game/engine.ts` | 纯状态转换、交易、价格、借款与结局判定 |
| `lib/game/stories.ts` | 条件、真实后果、费用与复盘原理 |
| `lib/game/cinematic-content.ts` | 64 份分镜、128 个后续和物件交互 |
| `lib/game/visuals.ts`、`epilogues.ts` | 素材、选项地点与结局演出 |
| `lib/game/presentation.ts` | 阅读、偏好和引导存档 |
| `public/art`、`public/video` | 游戏素材与 MP4 |
| `.github/workflows/ci.yml` | GitHub 推送与 PR 检查 |

心理状态影响事件权重，不偷偷改变同条件报价。已显示事件保存快照，投资操作不会反过来改写已读文字。演出层不负责扣款、结算或判定结局。

## 美术与发布

视觉研究见 [ART_DIRECTION_V2.md](docs/ART_DIRECTION_V2.md)。美术通过内置 ImageGen 生成，最终提示词见 [ART_PROMPTS_COMPLETE.json](docs/ART_PROMPTS_COMPLETE.json) 与 [ART_SUPPORT_PROMPTS.json](docs/ART_SUPPORT_PROMPTS.json)，素材来源与尺寸见 [ASSET_MANIFEST.json](docs/ASSET_MANIFEST.json)。影片为原画经过 FFmpeg 运镜与淡入淡出合成的分镜短片；环境音在游戏中播放。可选重建工具为 `scripts/build-prologue.mjs`（需要 FFmpeg）和 `scripts/subset-font.py`（需要 FontTools、Brotli 与官方原字体）。

运行时不请求远程字体、音源或模型接口。人物、公司、金额和城市均为虚构；未复制参考游戏图像、音轨或代码。字体遵循 `public/fonts/OFL.txt`。项目尚未指定整体开源许可证，本次没有代替作者选择许可。GitHub 准备说明见 [GITHUB.md](docs/GITHUB.md)。
