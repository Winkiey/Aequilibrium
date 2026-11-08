# GitHub Pages 发布

游戏网址：https://winkiey.github.io/Aequilibrium/

本游戏运行逻辑全部在浏览器中执行，不需要数据库或服务端接口。`pages/main.tsx`使用同一CinematicGame组件；存档、收藏、人物簿、阅读册和声音逻辑不另写一套。

## 构建

```text
npm ci
npm run build:pages
```

输出：`dist-pages/index.html`和`dist-pages/playtest/index.html`，包含网页、样式、分块JS、美术、字体与已存在的片头。`.nojekyll`随构建生成。

默认部署前缀为`/Aequilibrium/`；其他仓库名可以通过`PAGES_BASE_PATH`环境变量指定。图片、影片、字体和favicon均保留项目前缀，不能把`/art/`等错误地当成github.io根目录。

`.github/workflows/pages.yml`在main分支更新时自动构建，并通过GitHub官方Pages Actions部署。Pages设置使用GitHub Actions作为发布来源。没有购买套餐或创建新站点；因私有仓库Pages受到账号套餐限制，经用户明确授权将现有源码仓库公开。

## 进度与访问

手机保持横屏；`/playtest/`是独立存档入口。GitHub Pages与原Sites是不同源，浏览器不会自动共享旧存档，可以使用游戏内导出/导入迁移。静态发布不会读取或上传玩家的本地存档。

原Sites仍保持既有访问范围，`npm run build`仍生成Worker，不改变原部署身份。

本轮只做发布构建及网址/资源可达性核对。整局真实浏览器试玩仍未完成，用户已取消该上传前提；不将HTTP200或构建成功称作完整游玩验收。
