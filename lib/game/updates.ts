import {publicPath} from './public-path';
import {type OfflineManifest,registerOffline,hasOfflinePack} from './offline';
export const UPDATE_BACKUP_KEY='aequilibrium.update-backup.v1';
export const UPDATE_SAVE_KEYS=['aequilibrium.save.v1','aequilibrium.presentation.v2','aequilibrium.collection.v1','aequilibrium.save.v1.backup','aequilibrium.playtest.save.v2','aequilibrium.playtest.presentation.v2','aequilibrium.playtest.collection.v1','aequilibrium.playtest.save.v2.backup'] as const;
export function backupUpdateSaves(storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
 const records:Record<string,string>={};for(const key of UPDATE_SAVE_KEYS){const value=storage.getItem(key);if(value!==null)records[key]=value;}
 const payload=JSON.stringify({format:'aequilibrium-update-backup-v1',records,savedAt:new Date().toISOString()});
 storage.setItem(UPDATE_BACKUP_KEY,payload);if(storage.getItem(UPDATE_BACKUP_KEY)!==payload)throw new Error('更新前的备份未能保存，请先返回游戏导出进度。');return records;
}
export function updatePageURL(playtest=false,apply=false){const params=new URLSearchParams();if(playtest)params.set('playtest','1');if(apply)params.set('apply','1');const query=params.toString();return publicPath('/update/')+(query?'?'+query:'');}
export function updateReturnURL(playtest=false,version?:string){return publicPath(playtest?'/playtest/':'/')+(version?'?updated='+encodeURIComponent(version):'');}
export function workerMessage<T>(worker:Pick<ServiceWorker,'postMessage'>,message:object,timeout=12000):Promise<T>{
 return new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(new Error('更新入口暂未响应，请重试。'));},timeout);
 channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();const data=event.data;if(data?.error)reject(new Error(data.error));else resolve(data);};
 worker.postMessage(message,[channel.port2]);});
}
export async function updateWorker(manifest:OfflineManifest){
 const registration=await registerOffline(),worker=registration.waiting??registration.active;
 if(!worker)throw new Error('新版入口还未就绪，请重试。');
 const reply=await workerMessage<{manifest:OfflineManifest}>(worker,{type:'AEQUILIBRIUM_MANIFEST'});
 if(reply.manifest.version!==manifest.version)throw new Error('部署版本刚刚变化，请重新检查后再更新。');
 return{registration,worker};
}
export async function checkUpdatePages(worker:ServiceWorker,manifest:OfflineManifest){
 const reply=await workerMessage<{version:string;openGames:number}>(worker,{type:'AEQUILIBRIUM_UPDATE_STATUS',version:manifest.version});
 if(reply.version!==manifest.version)throw new Error('更新版本未匹配，请重新检查。');return reply.openGames;
}
export async function activateUpdate(registration:ServiceWorkerRegistration,worker:ServiceWorker,manifest:OfflineManifest){
 if(!await hasOfflinePack(manifest))throw new Error('新版资源尚未保存完整，请重试。');
 const games=await checkUpdatePages(worker,manifest);if(games)throw new Error(`还有 ${games} 个游戏页面开着。请先关闭它们，再点更新；本页保留。`);
 if(worker.state!=='activated'){
  const reply=await workerMessage<{version:string;accepted?:boolean;openGames?:number}>(worker,{type:'AEQUILIBRIUM_ACTIVATE',version:manifest.version});
  if(reply.version!==manifest.version||!reply.accepted)throw new Error(reply.openGames?'还有游戏页面开着，请先关闭后重试。':'新版入口未能启用，原版仍保留。');
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error('新版仍在启用，请稍后重试。'));},12000);const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);};const changed=()=>{if(worker.state==='activated'){cleanup();resolve();}else if(worker.state==='redundant'){cleanup();reject(new Error('新版发生变化，请重新检查。'));}};worker.addEventListener('statechange',changed);changed();});
 }
 const active=registration.active;if(!active)throw new Error('新版入口尚未完成切换。');
 const actual=await workerMessage<{manifest:OfflineManifest}>(active,{type:'AEQUILIBRIUM_MANIFEST'});if(actual.manifest.version!==manifest.version)throw new Error('新版入口尚未完成切换。');
}
