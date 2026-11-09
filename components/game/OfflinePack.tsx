'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,ArrowRight,RefreshCw} from 'lucide-react';
import {hasOfflinePack,offlineManifest,prepareOffline,registerOffline,type OfflineManifest,type DownloadProgress} from '@/lib/game/offline';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function OfflinePack({onContinue,onUpdate,update}:{onContinue:()=>void;onUpdate:(apply:boolean)=>void;update?:OfflineManifest|null}){
 const [manifest,setManifest]=useState<OfflineManifest|null>(null),[phase,setPhase]=useState<'checking'|'available'|'downloading'|'ready'|'error'>('checking'),[error,setError]=useState(''),[progress,setProgress]=useState<DownloadProgress|null>(null),[waiting,setWaiting]=useState(false),[controlled,setControlled]=useState(false),[install,setInstall]=useState<InstallEvent|null>(null),[persistent,setPersistent]=useState(false);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>{let live=true;void offlineManifest().then(async m=>{const ready=await hasOfflinePack(m);if(live){setManifest(m);setPhase(ready?'ready':'available');setControlled(!!navigator.serviceWorker.controller);}}).catch(e=>{if(live){setError(e.message);setPhase('error');}});const prompt=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};window.addEventListener('beforeinstallprompt',prompt);return()=>{live=false;controller.current?.abort();window.removeEventListener('beforeinstallprompt',prompt);};},[]);
 async function download(){if(!manifest)return;setError('');setPhase('downloading');const current=new AbortController();controller.current=current;
  try{const reg=await registerOffline();current.signal.throwIfAborted();const kept=await prepareOffline(manifest,current.signal,setProgress);setPersistent(kept);setWaiting(!!reg.active&&!!reg.waiting);setControlled(!!navigator.serviceWorker.controller);setPhase('ready');}
  catch(e){current.abort();if(e instanceof DOMException&&e.name==='AbortError'){setPhase('available');setError('已暂停，完成的文件仍保留，下次可以接着准备。');}else{setPhase('error');setError(e instanceof Error&&e.name==='QuotaExceededError'?'浏览器可用空间不足。已完成资源保留，可腾出空间后重试或在线开始。':(e as Error).message);}}
 }
 return <div className="offline-pack"><p className="paper-kicker">出发以前 · 可选的本机资源包</p><h2>把澄港，先收进行囊。</h2><p>先下载人物、场景、字体与游戏入口，之后就能减少等图的时间。无需另装 EXE，进度仍保存在这个浏览器。</p>{manifest&&<div className="offline-size"><strong>{(manifest.totalBytes/1024/1024).toFixed(1)}<small> MB</small></strong><span>{manifest.files.length} 个资源<br/>一次准备，可检查修复</span></div>}
  {update&&<section className="offline-update"><h3>游戏有新版</h3><p>本页的完整性检查只修复当前版本。更新游戏会先保存进度，再准备并切换新版。</p><button className="ink-button full" onClick={()=>onUpdate(true)}>保存进度并更新<RefreshCw size={16}/></button></section>}
  {phase==='checking'&&<p role="status">正在查看这个版本的资源…</p>}
  {phase==='downloading'&&<div className="offline-progress" role="status"><progress max={progress?.totalBytes??1} value={progress?.bytes??0}/><span>{progress?.current??'先准备离线入口'} · {progress?.completed??0} / {progress?.total??manifest?.files.length??0}</span><button onClick={()=>controller.current?.abort()}>暂停下载</button></div>}
  {phase==='ready'&&<div className="offline-ready" role="status"><h3>此版本资源已保存在本机。</h3><p>{waiting?'已有新版本等待切换。关闭本游戏的其他标签页，再重新打开，可避免混用资源。':controlled?'可以从这个入口离线游玩。':'首次准备完成。点击下方“启用离线入口”，重新载入一次后即可离线游玩。'}</p><small>{persistent?'浏览器已允许持久保存。':'缓存仍可能被浏览器清理；需要时可回到这里检查与修复。'}首次解码和设备性能仍会影响流畅度。</small></div>}
  {error&&<p className="offline-error" role="status">{error}</p>}
  {manifest&&phase!=='downloading'&&<button className="ink-button full" onClick={()=>void download()}>{phase==='ready'?<RefreshCw size={16}/>:<Download size={16}/ >}{phase==='ready'?'检查本版完整性 / 修复缺失':phase==='error'?'接着下载 / 重试':'下载完整资源'}</button>}
  {phase==='ready'&&!controlled&&!waiting&&<button className="ink-button full" onClick={()=>window.location.reload()}>启用离线入口 · 重新载入<ArrowRight size={16}/></button>}
  <button className="paper-back-link" disabled={phase==='downloading'} onClick={onContinue}>{phase==='ready'?'进入游戏':'先在线开始，之后再下载'}<ArrowRight size={16}/></button>
  {install&&<button className="paper-back-link" onClick={async()=>{await install.prompt();await install.userChoice;setInstall(null);}}>添加到桌面 / 安装游戏</button>}
  <button className="paper-back-link" onClick={()=>onUpdate(false)}>检查游戏更新<RefreshCw size={14}/></button>
  <details><summary>手机安装与资源保存</summary><p>支持安装的浏览器会显示添加按钮。iPhone/iPad 可用浏览器分享菜单“添加到主屏幕”；若有“作为网页 App 打开”，可开启它。安卓浏览器也可从菜单查找安装入口。</p><p>下载与存档是两件事。游戏内更新资源不会清除存档；主动清理浏览器站点数据会同时影响保存内容，请先导出进度。新版准备完成前不会删除旧资源。</p></details>
 </div>;
}
