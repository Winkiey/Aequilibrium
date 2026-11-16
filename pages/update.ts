import './update.css';
import {latestOfflineManifest,prepareOffline,hasOfflinePack,type OfflineManifest} from '../lib/game/offline';
import {activateUpdate,backupUpdateSaves,checkUpdatePages,updateReturnURL,updateWorker,workerMessage} from '../lib/game/updates';
window.__AEQUILIBRIUM_ASSET_BASE__=import.meta.env.BASE_URL;
const playtest=new URLSearchParams(location.search).get('playtest')==='1';
const element=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const status=element('status'),detail=element('detail'),error=element('error'),apply=element<HTMLButtonElement>('apply'),progress=element<HTMLProgressElement>('progress');
const pause=element<HTMLButtonElement>('pause');let downloadController:AbortController|undefined;
const back=element<HTMLAnchorElement>('return'),continued=element<HTMLAnchorElement>('continue');back.href=continued.href=updateReturnURL(playtest);
let latest:OfflineManifest|undefined,busy=false;
const page=document.querySelector<HTMLElement>('.update-page')!;
const state=(value:string)=>{page.dataset.state=value;};
const showError=(message:string)=>{state('error');error.textContent=message;error.hidden=false;};
async function latestWithTimeout(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{return await latestOfflineManifest(controller.signal);}finally{clearTimeout(timer);}}
async function check(){
 state('checking');error.hidden=true;
 try{
  latest=await latestWithTimeout();element('versions').hidden=false;element('latest-version').textContent=latest.version.slice(0,10);
  const registration=await navigator.serviceWorker?.getRegistration(import.meta.env.BASE_URL),current=navigator.serviceWorker?.controller??registration?.active;
  let same=false;if(current){try{const value=await workerMessage<{manifest:OfflineManifest}>(current,{type:'AEQUILIBRIUM_MANIFEST'});element('current-version').textContent=value.manifest.version.slice(0,10);same=value.manifest.version===latest.version;}catch{element('current-version').textContent='旧版入口';}}
  if(same&&await hasOfflinePack(latest)){state('ready');status.textContent='已是当前可用的最新版。';detail.textContent='原来的进度和往事都在。返回游戏后，选择继续即可。';apply.textContent='重新检查 / 修复本版';continued.hidden=false;}
  else{state('available');status.textContent='新版已找到，进度可以接着走。';detail.textContent=`游戏本体约 ${(latest.totalBytes/1024/1024).toFixed(1)} MB；会校验并复用已经下载的相同文件。${latest.film?' 片头影像可以稍后另存。':''}`;apply.textContent='保存进度并更新';}
  apply.disabled=false;
  if(new URLSearchParams(location.search).get('apply')==='1')void update();
 }catch(e){status.textContent='暂时还不能更新。';showError(e instanceof Error?e.message:'请联网后重试。');apply.textContent='重新检查';apply.disabled=false;continued.hidden=false;}
}
async function update(){
 if(busy)return;if(!latest){await check();return;}busy=true;apply.disabled=true;continued.hidden=true;error.hidden=true;state('preparing');
 try{
  latest=await latestWithTimeout();status.textContent='正在准备新版入口…';
  const {registration,worker}=await updateWorker(latest);const openGames=await checkUpdatePages(worker,latest);
  if(openGames)throw new Error(`还有 ${openGames} 个游戏页面开着。请关闭它们，保留本页，再点更新。`);
  backupUpdateSaves();state('downloading');status.textContent='进度已备份，正在准备新版资源。';progress.hidden=false;pause.hidden=false;pause.disabled=false;pause.textContent='先暂停，稍后接着准备';
  const current=new AbortController();downloadController=current;
  await prepareOffline(latest,current.signal,p=>{progress.max=p.totalBytes;progress.value=p.bytes;const percent=Math.min(p.completed===p.total?100:99,Math.floor(p.bytes/p.totalBytes*100));detail.textContent=`${p.current} · ${percent}%\n${(p.bytes/1024/1024).toFixed(1)} / ${(p.totalBytes/1024/1024).toFixed(1)} MB · ${p.completed} / ${p.total} 份\n复用 ${p.reused??0} 个文件 · 下载 ${p.downloaded??0} 个文件`;});
  current.signal.throwIfAborted();pause.hidden=true;state('switching');status.textContent='资源已校验，正在切换新版。';await activateUpdate(registration,worker,latest);
  location.replace(updateReturnURL(playtest,latest.buildId));
 }catch(e){if(downloadController?.signal.aborted){state('available');error.hidden=true;status.textContent='已暂停，原来的版本还在。';detail.textContent='已经完成并验真的文件会保留。继续时只补缺失文件；未完成的大文件会重新下载。';apply.textContent='接着准备并更新';}else{showError(e instanceof Error?e.message:'更新未完成，原有存档与资源仍保留。');status.textContent='尚未切换版本，可以继续重试。';apply.textContent='重试保存并更新';}apply.disabled=false;continued.hidden=false;}
 finally{busy=false;pause.hidden=true;downloadController=undefined;}
}
pause.addEventListener('click',()=>{pause.disabled=true;pause.textContent='正在暂停…';downloadController?.abort();});
window.addEventListener('pagehide',()=>downloadController?.abort());
apply.addEventListener('click',()=>void update());void check();
