import {useEffect,useState} from 'react';
import {currentBuildId,latestOfflineManifest,type OfflineManifest} from '@/lib/game/offline';
export function useGameUpdate(){
 const [available,setAvailable]=useState<OfflineManifest|null>(null);
 useEffect(()=>{let live=true,last=0,request:AbortController|undefined;
  const check=async()=>{if(document.hidden||Date.now()-last<20000)return;last=Date.now();request?.abort();request=new AbortController();const timer=setTimeout(()=>request?.abort(),8000);
   try{const latest=await latestOfflineManifest(request.signal);if(live)setAvailable(latest.buildId!==currentBuildId()?latest:null);}catch{/* Offline play keeps using its complete, coherent version. */}finally{clearTimeout(timer);}};
  const visible=()=>{if(!document.hidden)void check();};const poll=setInterval(()=>void check(),90000);void check();window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);
  return()=>{live=false;clearInterval(poll);request?.abort();window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);};
 },[]);return available;
}
