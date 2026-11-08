# 四季与故事扩展交付记录

本轮以既有书屋和老街原画为风格参考，全部新增图像使用内置 `image_gen` 绘制，保留现实比例、纸木材质、低饱和自然光。人物继续使用已确认的固定图集。本次未更换原有美术，未使用外部游戏图片。

新增完整背景保存于 `public/art/backgrounds/`：

- `winter-roster.webp`：冬夜值班台
- `seawall-evening.webp`：夏日港口堤岸
- `proof-night.webp`：春夜返工校样室
- `shared-keys.webp`：冬日共用阅览厅
- `winter-cloakroom.webp`：冬日车站寄物角
- `ferry-spring.webp`：春日渡口
- `repair-summer.webp`：夏日修理铺
- `osmanthus-yard.webp`：秋日桂花后院
- `proof-morning.webp`：春晨校样室
- `post-winter.webp`：冬日小邮局
- `noodle-blackout.webp`：夏夜停电面馆后院
- `debt-autumn.webp`：秋日办事处

四组真实透明陈设保存于 `public/art/seasons/season-{autumn,winter,spring,summer}.webp`，分别为桂花与柿子、围巾与热杯、嫩枝与书签、团扇与凉水壶。室内按画面桌面、长凳等位置摆放；室外以光线、风、落叶、潮湿感区分四季，不把室内静物摆在道路上。所有地点均接入季节层，季节装饰不接收点击，不遮挡对白交互。

完整提示词、参考图、生成文件来源、尺寸、透明层及目视检查结果：

- `docs/EXPANSION_ART_A.json`
- `docs/EXPANSION_ART_B.json`
- `docs/SEASON_ART_PROMPTS.json`

轻量版本位于 `public/art/runtime/`，通过 `assets.generated.ts` 引用。手机背景有960像素版本，全部主要运行时美术比原画合计减少约64%。

内容新增4段主线续章与8个季节日常，合计76事件、152选项后续、228套场景组合；每套组合由地点、固定人物姿态、镜头与物件组成，非228张独立原画。结局由8个扩展到12个，名称统一四字，旧收藏名称与旁白兼容迁移。未解锁内容仍保持隐藏。

验证：210项测试，152个选项逐一从符合条件的状态执行到第三年终局，16种续章组合，12个结局均从正常开局沿合法动作和实际种子日常抽取抵达，另有500完整周目与33地点的四季裁切检查。详见 `BRANCH_EXECUTION.json`、`VISUAL_COVERAGE.json`、`tests/fixtures/ending-routes.json`。

验证边界：实际浏览器工具此前因不能可靠确认URL而停止，当前版本尚未逐按钮点击复测。原画已目视检查，合成图/静态渲染/引擎执行均不宣称浏览器截图或点击验收。

后续每次新增主线或日常的绘图、分支、旧档兼容及验证流程已经写入项目 `AGENTS.md`。
