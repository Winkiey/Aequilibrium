import {ASSETS} from './assets.generated';
import {CAST,SCENES} from './visuals';
import type {CastId,SceneId,FocusObject} from './cinematic-content';

type Source={src:string;width:number;height:number;bytes:number;small?:{src:string;width:number;bytes:number};placeholder?:string};
const sources:Record<string,Source>=ASSETS;
const decoded=new Set<string>();const pending=new Map<string,Promise<void>>();
export function assetSource(path:string):Source{return sources[path]??{src:path,width:1672,height:941,bytes:0};}
export function imageURL(path:string):string{
 const a=assetSource(path);return typeof window!=='undefined'&&window.innerWidth<=1100&&window.innerHeight<=600&&a.small?a.small.src:a.src;
}
export function imageReady(path:string){return decoded.has(imageURL(path));}
export function prepareImage(path:string):Promise<void>{
 if(typeof window==='undefined')return Promise.resolve();const src=imageURL(path);
 if(decoded.has(src))return Promise.resolve();const existing=pending.get(src);if(existing)return existing;
 const promise=new Promise<void>((resolve,reject)=>{const img=new Image();let settled=false;img.decoding='async';const timer=setTimeout(()=>fail(),15000);function fail(){if(settled)return;settled=true;clearTimeout(timer);pending.delete(src);img.onload=null;img.onerror=null;reject(new Error('画面暂未载入，请重试'));}img.onload=()=>{void img.decode().catch(()=>{}).then(()=>{if(settled)return;settled=true;clearTimeout(timer);decoded.add(src);pending.delete(src);resolve();});};img.onerror=fail;img.src=src;});
 pending.set(src,promise);return promise;
}
export function scenePaths(scene:SceneId,cast:CastId[]=[]){return [SCENES[scene].image,...cast.slice(0,2).map(id=>CAST[id].sprite),'/art/props/objects.webp'];}
export function prepareScene(scene:SceneId,cast:CastId[]=[]){return Promise.all(scenePaths(scene,cast).map(prepareImage));}
export function warmScene(scene:SceneId,cast:CastId[]=[]){void prepareScene(scene,cast).catch(()=>{});}

export function coverFrame(width:number,height:number,imageWidth=1672,imageHeight=941,alignX=.5,alignY=.5){const scale=Math.max(width/imageWidth,height/imageHeight);return{width:imageWidth*scale,height:imageHeight*scale,left:(width-imageWidth*scale)*alignX,top:(height-imageHeight*scale)*alignY};}
/** Objects already painted in a branch image must not spawn duplicate sprites. */
export const SCENE_OBJECT_ANCHORS:Partial<Record<SceneId,Partial<Record<FocusObject,[number,number]>>>>={
 'bookshop-pledge':{contract:[36,78],key:[52,67],ledger:[27,58],lamp:[15,40],window:[79,29]},
 'attic-kept-letter':{letter:[27,77],book:[34,72],cup:[20,79],lamp:[16,40],window:[50,27]},
 'reading-gathering':{book:[25,79],cup:[57,78],lamp:[31,52],window:[81,30]},
 'proof-solitary':{book:[31,81],letter:[31,81],lamp:[14,55],cup:[47,71],window:[50,30]},
};
export const HUB_ANCHORS:Partial<Record<SceneId,{letter:[number,number];ledger:[number,number];newspaper:[number,number];shelf:[number,number];paintedLetter?:boolean}>>={
 'bookshop-night':{letter:[11.2,77.5],ledger:[22,66.5],newspaper:[17.7,82],shelf:[46,42]},
 'bookshop-day':{letter:[11,77.5],ledger:[22,66.5],newspaper:[17.7,82],shelf:[46,42]},
 'reading-room':{letter:[24,68],ledger:[15,75],newspaper:[29,60],shelf:[46,41],paintedLetter:true},
};
