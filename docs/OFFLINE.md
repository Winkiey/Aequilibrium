# 离线资源与安装

GitHub Pages在线版支持可选资源包。初次从标题进入时先显示资源准备页，允许在线继续；之后可从标题或暂停菜单再次下载、检查、修复。

缓存内容由构建产物生成：启动HTML、全部JS/CSS分包、字体、图标、实际使用的运行时大/小图与现有片头。不含原画母版与弃用样片。逐文件以SHA-256及解压后字节数核对，两个下载任务并发；已完成文件可复用，取消或失败不写完整标记。进度表示已准备的资源量，不是网络流量计。

首次准备完成后按界面提示重新载入一次，使离线入口接管。已存在等待更新时，请关闭本游戏其他标签后重开。新版不会在一局进行中抢占，也不会先删旧缓存。资源包与localStorage存档分开；资源更新不调用localStorage.clear()。

安装按钮仅在浏览器提供安装能力时出现。iPhone/iPad可通过分享→添加到主屏幕，若显示“作为网页App打开”可开启；安装快捷入口和完成资源下载是两件不同的事。首次下载需要联网，资源缓存可能因空间或浏览器清理失效，不能承诺永久零等待。设备解码和动画也需要时间。

开发服务器不提供发布用清单。离线包由npm run build:pages生成，原Worker入口暂不启用此离线包。

## 实现参考

- [MDN CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [MDN Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Service Worker生命周期](https://web.dev/articles/service-worker-lifecycle)
- [视频Range请求](https://web.dev/articles/sw-range-requests)
- [存储配额与驱逐](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [图像decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)
- [WebKit主屏幕App支持](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
