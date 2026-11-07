# 美术与交互约定

以私人书桌和编辑排版为基准：冷灰纸面、墨绿灰文字、细线分栏、宋体正文与等宽账目。主要场景使用低饱和环境摄影。避免卡片墙、巨型统计数字、渐变装饰、霓虹、终端风格与高频交易动画。

文字优先。空间用于停顿与阅读，重要操作保持稳定位置；先展示实际支付、到期日期与风险，再允许确认。所有核心操作支持键盘，弹窗限制焦点并可用 Escape 退出，尊重减少动态效果设置。手机导航收进抽屉，正文、选择和报价均为单列。

## 场景素材

文件：`public/images/rain-bookshop.png`。

通过内置 imagegen 工具生成，原图保留在 Codex 生成目录，项目内保留完整副本。未从参考项目复制美术或代码。

完整生成提示词：

> Use case: photorealistic-natural. Asset type: wide cinematic environmental photograph for an elegant literary browser game, landscape 3:2. A modest lived-in Chinese coastal city secondhand bookshop at 9pm in the rain, viewed from inside through a slightly fogged wooden sash window toward a narrow wet alley. Foreground weathered dark oak writing desk at bottom right, a closed thin notebook, one yellow brass key, plain brown envelope, and a small ceramic cup; left edge an out of focus bookshelf. Faint amber light in a small shop window across the alley, old plaster facades, telephone wires, subtle blue gray reflections on wet pavement. No people. The room is dark but naturally readable, quiet and solitary yet inviting, fine 35mm film grain, realistic natural textures, sophisticated editorial film still, imperfect everyday place rather than luxurious staged fantasy. Palette charcoal, silver gray, muted olive and tiny warm amber; extremely desaturated. Deep photographic composition, natural subdued light. No text, no logos, no lettering, no UI, no watermarks, no illustration, no dramatic neon, no orange-teal blockbuster grading. The photograph should feel real, restrained and human. Output a single high quality landscape photograph.

## 字体

Noto Serif SC，来源为 Google Fonts 官方仓库，使用 SIL Open Font License。本地读取完整公开字体，再以项目用字离线生成约 200 KB 的 WOFF2 子集；没有将项目文字发送到字体服务。许可全文保留在 `public/fonts/OFL.txt`。正文宋体的其余字形使用系统宋体回退；无衬线正文使用系统中文字体。

## 声音

使用 Web Audio API 实时合成双声道滤波噪声、稀疏的衰减正弦泛音和轻微纸面动作声。声音由玩家主动开启；环境与音乐可分别调节，切到后台后暂停。没有外部音频样本或流媒体请求。
