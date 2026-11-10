import {publicPath} from './public-path';
export {publicPath} from './public-path';
import {ASSETS} from './assets.generated';
import {CAST,SCENES} from './visuals';
import type {CastId,SceneId,FocusObject} from './cinematic-content';

type Source={src:string;width:number;height:number;bytes:number;small?:{src:string;width:number;bytes:number};placeholder?:string};
const sources:Record<string,Source>=ASSETS;
// Keep a small number of decoded Image objects alive. A URL-only Set incorrectly
// claimed readiness after browsers had discarded the decoded bitmap under pressure.
const decoded=new Map<string,HTMLImageElement>(),pending=new Map<string,Promise<void>>(),fallbacks=new Map<string,string>();
const queue:{src:string;run:()=>Promise<void>;priority:boolean}[]=[];let running=0;
function pump(){while(running<2&&queue.length){const job=queue.shift()!;running++;void job.run().finally(()=>{running--;pump();});}}
function keep(src:string,img:HTMLImageElement){decoded.delete(src);decoded.set(src,img);while(decoded.size>12)decoded.delete(decoded.keys().next().value!);}
export function assetSource(path:string):Source{return sources[path]??{src:path,width:1672,height:941,bytes:0};}
function preferredURL(path:string){const a=assetSource(path);const pixels=typeof window==='undefined'?1672:window.innerWidth*Math.min(2,window.devicePixelRatio||1)*1.02;return publicPath(a.small&&pixels<=a.small.width?a.small.src:a.src);}
export function imageURL(path:string):string{const preferred=preferredURL(path);return fallbacks.get(preferred)??preferred;}
export function imageReady(path:string){return decoded.has(imageURL(path));}
export function invalidateImage(path:string){const a=assetSource(path);for(const src of [publicPath(a.src),...(a.small?[publicPath(a.small.src)]:[])])decoded.delete(src);fallbacks.delete(preferredURL(path));}
function load(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{
 const img=new Image();let settled=false;img.decoding='async';
 const timer=setTimeout(()=>fail(),9000);
 function cleanup(){clearTimeout(timer);img.onload=null;img.onerror=null;}
 function fail(){if(settled)return;settled=true;cleanup();img.src='';reject(new Error('画面暂未载入'));}
 img.onerror=fail;img.onload=()=>{void (typeof img.decode==='function'?img.decode():Promise.resolve()).then(()=>{if(settled)return;if(!img.naturalWidth||!img.naturalHeight){fail();return;}settled=true;cleanup();resolve(img);},fail);};img.src=src;
});}
export function prepareImage(path:string,priority:'scene'|'warm'='scene'):Promise<void>{
 if(typeof window==='undefined')return Promise.resolve();const preferred=preferredURL(path),src=imageURL(path);
 if(decoded.has(src))return Promise.resolve();const existing=pending.get(preferred);if(existing){if(priority==='scene'){const i=queue.findIndex(j=>j.src===preferred);if(i>0)queue.unshift(...queue.splice(i,1));}return existing;}
 const a=assetSource(path),alternate=publicPath(src===publicPath(a.src)&&a.small?a.small.src:a.src);
 let resolve!:()=>void,reject!:(error:Error)=>void;const promise=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});pending.set(preferred,promise);
 const run=async()=>{try{const candidates=alternate===src?[src,src]:[src,src,alternate];let error:unknown;
  for(let i=0;i<candidates.length;i++){if(i)await new Promise(r=>setTimeout(r,i===1?350:900));try{const img=await load(candidates[i]);keep(candidates[i],img);if(candidates[i]!==preferred)fallbacks.set(preferred,candidates[i]);resolve();return;}catch(e){error=e;}}
  reject(error instanceof Error?error:new Error('画面暂未载入，请重试'));
 }finally{pending.delete(preferred);}};
 const job={src:preferred,run,priority:priority==='scene'};if(job.priority)queue.unshift(job);else queue.push(job);pump();return promise;
}
export function scenePaths(scene:SceneId,cast:CastId[]=[]){return [SCENES[scene].image,...cast.slice(0,2).map(id=>CAST[id].sprite),'/art/props/objects.webp'];}
export function prepareScene(scene:SceneId,cast:CastId[]=[]){return Promise.all(scenePaths(scene,cast).map(path=>prepareImage(path)));}
export function warmScene(scene:SceneId,cast:CastId[]=[]){for(const path of scenePaths(scene,cast))void prepareImage(path,'warm').catch(()=>{});}

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
 'reading-room':{letter:[29,77],ledger:[20,68],newspaper:[13,83],shelf:[46,41],paintedLetter:true},
};
