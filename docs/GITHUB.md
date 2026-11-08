# GitHub 私有仓库

目标仓库：https://github.com/Winkiey/Aequilibrium。可见性为私有；只向有权限的账号展示源码与素材。

2026-11-08用户明确选择新建私有仓库Aequilibrium，随后取消“整局浏览器试玩通过后才上传”的前提，授权直接上传。本版本此前已通过TypeScript、230项自动检查与生产构建；真实整局浏览器操作因工具无法可靠确认URL而未完成，不声明已经亲自玩通。

现有Sites项目绑定保持在 `.openai/hosting.json` 中，`github` remote用于GitHub源码上传。游戏现有站点访问范围保持原样。仓库公开/私有与游戏网站是否允许其他玩家访问是两项设置。

仓库包含开发说明、锁文件、固定人物与背景原画、运行时轻量素材、绘图提示词/来源和GitHub Actions。正常开发不需要付费模型密钥。个人存档、环境文件、密钥、依赖、构建与本地工具输出由 `.gitignore` 排除。

尚未指定整体开源许可证，不代替作者授予MIT等许可；字体继续遵循 `public/fonts/OFL.txt`。公开仓库也不自动等于授予开源许可。

本项目采用Cloudflare Worker构建，GitHub托管源码与CI，现有可玩版本继续部署在Sites；不能直接把整个仓库当成GitHub Pages静态站点。
