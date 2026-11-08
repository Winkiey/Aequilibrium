# GitHub 与在线游玩

- 源码仓库：https://github.com/Winkiey/Aequilibrium
- GitHub Pages游戏网址：https://winkiey.github.io/Aequilibrium/
- 当前仓库可见性：公开。账号套餐不支持私有仓库Pages，用户明确授权必要时改为公开，已按此授权完成设置。

主分支更新后，`.github/workflows/pages.yml`构建静态游戏并自动部署。既有Sites项目绑定和站点访问范围保持原样；两种部署使用同一游戏组件。

2026-11-08用户取消整局浏览器试玩作为上传前提。本版本此前通过TypeScript、230项自动检查与原生产构建；本轮增加Pages静态发布构建，没有重跑整局试玩或全套测试。不能把发布成功称为已亲自玩通。

仓库包含开发说明、锁文件、人物/背景原画、运行时素材、绘图提示词/来源与CI。个人存档、环境文件、密钥、依赖与本地输出由`.gitignore`排除。

尚未指定整体开源许可证，不代替作者授予MIT等许可；字体遵循`public/fonts/OFL.txt`。公开仓库不自动等于授予开源许可。

GitHub Pages使用`npm run build:pages`，输出`dist-pages/`；原Sites仍使用`npm run build`的Worker输出。详见`GITHUB_PAGES.md`。
