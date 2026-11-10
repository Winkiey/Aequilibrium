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

`.github/workflows/pages.yml`在main分支更新时自动构建，并通过GitHub官方Pages Actions部署。Pages设置使用GitHub Actions作为发布来源。沿用现有公开仓库和站点。

## 进度与访问

手机保持横屏；`/playtest/`是独立存档入口。GitHub Pages与原Sites是不同源，浏览器不会自动共享旧存档，可以使用游戏内导出/导入迁移。静态发布不会读取或上传玩家的本地存档。

原Sites仍保持既有访问范围，`npm run build`仍生成Worker，不改变原部署身份。

发布记录区分构建、部署、资源完整性与实际游玩结果。HTTP 200 或构建成功不等同完整游玩验收；后续的完整周目与旧存档实测见[界面与剧情验收](UI_COHESION.md)。

## 首次发布记录

2026-11-08，GitHub Pages工作流42477735001成功，发布源码bab9fcb5977c922ddc2c95b5d01a0894336844f6。匿名访问首页、独立试玩入口、JS/CSS、字体、场景图、物件图和片头返回200/206。README已从“发布中”更新为正式游玩入口。这是发布可达性核对，不是整局浏览器游玩验收。

## 发布插件与诊断 · 2026-11-10

发布步骤固定使用官方 `actions/deploy-pages` v5.0.1 的不可变提交 `368f82528645a54fb793d4d04e342629a3f51346`，运行时为 Node 24。该版本还为状态轮询增加退避和抖动，避免继续使用被运行器强制迁移的旧 Node 20 发布步骤。参见[官方版本说明](https://github.com/actions/deploy-pages/releases/tag/v5.0.1)与[Node 24 迁移记录](https://github.com/actions/deploy-pages/releases/tag/v5.0.0)。

失败时使用已有 Pages 权限查询同一次部署，记录 HTTP 状态、Pages 状态、响应字段名和请求编号。诊断不输出令牌或完整响应，不跟随携带凭据的重定向，也不把失败改成成功；原来的发布步骤仍决定工作流结果。仓库、站点、访问范围、产物前缀及游戏缓存协议保持。

先前两次发布的应用构建已通过，部署约十分钟后超时，且运行器日志未给出有效的状态值。升级修正已确认的运行时兼容风险并改善诊断，不能据此倒推超时的唯一根因。发布完成仍需核验实际网页入口、版本清单与文件 SHA，不能仅凭创建部署成功就宣布上线。
