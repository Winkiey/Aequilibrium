'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,ArrowRight,RefreshCw} from 'lucide-react';
import {hasOfflinePack,offlineManifest,prepareOffline,registerOffline,type OfflineManifest,type DownloadProgress} from '@/lib/game/offline';
import {imageURL} from '@/lib/game/assets';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function OfflinePack({onContinue,onUpdate,update}:{onContinue:()=>void;onUpdate:(apply:boolean)=>void;update?:OfflineManifest|null}){
 const [manifest,setManifest]=useState<OfflineManifest|null>(null),[phase,setPhase]=useState<'checking'|'available'|'downloading'|'ready'|'error'>('checking'),[error,setError]=useState(''),[progress,setProgress]=useState<DownloadProgress|null>(null),[waiting,setWaiting]=useState(false),[controlled,setControlled]=useState(false),[install,setInstall]=useState<InstallEvent|null>(null),[persistent,setPersistent]=useState(false);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>{let live=true;void offlineManifest().then(async m=>{const ready=await hasOfflinePack(m);if(live){setManifest(m);setPhase(ready?'ready':'available');setControlled(!!navigator.serviceWorker.controller);}}).catch(e=>{if(live){setError(e.message);setPhase('error');}});const prompt=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};window.addEventListener('beforeinstallprompt',prompt);return()=>{live=false;controller.current?.abort();window.removeEventListener('beforeinstallprompt',prompt);};},[]);
 async function download(){if(!manifest||controller.current)return;setError('');setPhase('downloading');const current=new AbortController();controller.current=current;
  try{const entry=registerOffline();const kept=await prepareOffline(manifest,current.signal,setProgress,{shellReady:entry});const reg=await entry;current.signal.throwIfAborted();setPersistent(kept);setWaiting(!!reg.active&&!!reg.waiting);setControlled(!!navigator.serviceWorker.controller);setPhase('ready');}
  catch(e){current.abort();if(e instanceof DOMException&&e.name==='AbortError'){setPhase('available');setError('已暂停，完成的文件仍保留，下次可以接着准备。');}else{setPhase('error');setError(e instanceof Error&&e.name==='QuotaExceededError'?'浏览器可用空间不足。已完成资源保留，可腾出空间后重试或在线开始。':(e as Error).message);}}
  finally{if(controller.current===current)controller.current=null;}
 }
 const percent=progress?.totalBytes?Math.min(progress.completed===progress.total?100:99,Math.floor(progress.bytes/progress.totalBytes*100)):0;
 return <div className="offline-pack resource-folio" data-phase={phase}>
  <section className="resource-intro"><p className="paper-kicker">泊灯书屋 · 出发以前</p><h2>把澄港，先收进行囊。</h2><figure className="resource-illustration"><img src={imageURL('/art/backgrounds/bookshop-quarter-counter.webp')} alt="书屋柜台上，留着一页尚未写完的账"/><figcaption>人物、场景与书页，留在手边。</figcaption></figure><p>提前保存画面与书页，之后就能少一些等候。也可以先在线开始。</p>{manifest&&<dl className="resource-inventory"><div><dt>本机资源</dt><dd>{(manifest.totalBytes/1024/1024).toFixed(1)} <small>MB</small></dd></div><div><dt>收进行囊</dt><dd>{manifest.files.length} <small>份文件</small></dd></div></dl>}<p className="resource-margin-note">无需另装 EXE，进度仍保存在这个浏览器。</p></section>
  <section className="resource-preparation"><header><span className="folio-section-number">01 / 行囊</span><h3>{phase==='checking'?'正在清点资源':phase==='downloading'?'把这一版收好':phase==='ready'?'资源已备齐':'准备这一段旅程'}</h3></header>
   {update&&<aside className="offline-update"><span>有可用更新</span><p>先保存进度，再取回新版的入口与画面。</p><button className="ink-button full" onClick={()=>onUpdate(true)}>保存进度并更新<RefreshCw size={15}/></button></aside>}
   {phase==='checking'&&<p className="resource-state" role="status">正在查看这个版本的资源…</p>}
   {phase==='available'&&<p className="resource-state">一次准备，往后慢慢游玩。下载可以暂停，已完成的文件会留着。</p>}
   {phase==='downloading'&&<div className="offline-progress" role="status"><div className="resource-progress-label"><span>正在准备</span><b>{percent}%</b></div><progress aria-label="资源下载进度" max={progress?.totalBytes??1} value={progress?.bytes??0}/><span>{progress?.completed??0} / {progress?.total??manifest?.files.length??0} 份文件 · {progress?.current??'先准备离线入口'}</span><button onClick={()=>controller.current?.abort()}>暂停下载，稍后接着准备</button></div>}
   {phase==='ready'&&<div className="offline-ready" role="status"><h4>此版本资源已保存在本机。</h4><p>{waiting?'已有新版本等待切换。关闭本游戏的其他标签页，再重新打开，可避免混用资源。':controlled?'可以从这个入口离线游玩。':'首次准备完成。启用离线入口，重新载入一次后即可离线游玩。'}</p><small>{persistent?'浏览器已允许持久保存。':'缓存可能被浏览器清理，需要时可在这里修复。'}首次解码和设备性能仍会影响流畅度。</small></div>}
   {error&&<p className="offline-error" role="status">{error}</p>}
   <div className="resource-actions">{manifest&&phase!=='downloading'&&<button className="ink-button full" onClick={()=>void download()}>{phase==='ready'?<RefreshCw size={15}/>:<Download size={15}/ >}<span>{phase==='ready'?'检查本版完整性 / 修复缺失':phase==='error'?'接着下载 / 重试':'下载完整资源'}</span></button>}
   {phase==='ready'&&!controlled&&!waiting&&<button className="ink-button full resource-enable" onClick={()=>window.location.reload()}>启用离线入口 · 重新载入<ArrowRight size={15}/></button>}
   <button className="paper-back-link resource-continue" disabled={phase==='downloading'} onClick={onContinue}>{phase==='ready'?'进入游戏':'先在线开始，之后再下载'}<ArrowRight size={15}/></button></div>
   <footer className="resource-utilities"><button className="paper-back-link" onClick={()=>onUpdate(false)}>检查游戏更新<RefreshCw size={13}/></button>{install&&<button className="paper-back-link" onClick={async()=>{await install.prompt();await install.userChoice;setInstall(null);}}>添加到桌面 / 安装游戏</button>}</footer>
   <details className="resource-storage-note"><summary>手机安装与资源保存</summary><p>支持安装的浏览器会显示添加按钮。iPhone/iPad 可用浏览器分享菜单“添加到主屏幕”；若有“作为网页 App 打开”，可开启它。安卓浏览器也可从菜单查找安装入口。</p><p>下载与存档是两件事。更新资源不会清除存档；主动清理站点数据会影响保存内容，请先导出进度。新版准备完成前不会删除旧资源。</p></details>
  </section>
 </div>;
}
