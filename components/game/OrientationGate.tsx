'use client';
import {imageURL} from '@/lib/game/assets';
import { useState } from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';

export function OrientationGate(){
 const [hint,setHint]=useState('把手机横过来，让整间书店留在画面里。');
 async function enter(){
  try{
   if(!document.fullscreenElement)await document.documentElement.requestFullscreen();
   const orientation=screen.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>};
   if(orientation.lock)await orientation.lock('landscape');
   else setHint('请将手机横过来。如果画面未旋转，请关闭系统的竖排方向锁定。');
  }catch{setHint('请将手机横过来。如果画面未旋转，请关闭系统的竖排方向锁定。');}
 }
 return <div className="orientation-gate" role="dialog" aria-modal="true" aria-labelledby="orientation-title"><img src={imageURL('/art/backgrounds/old-street.webp')} alt=""/><div className="orientation-shade"/><div className="orientation-copy"><span>AEQUILIBRIUM</span><Smartphone size={48} strokeWidth={1}/><h2 id="orientation-title">让故事横向展开</h2><p>{hint}</p><button onClick={()=>void enter()}>进入横屏<ArrowRight size={16}/></button><small>对白和影片已暂停，转屏后继续。</small></div></div>;
}
