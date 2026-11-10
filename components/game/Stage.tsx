'use client';
import {useContext,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {SoundscapeContext} from './Soundscape';
import {CAST,OBJECTS,SCENES,type Focus} from '@/lib/game/visuals';
import {assetSource,coverFrame,imageURL,prepareImage,scenePaths,invalidateImage} from '@/lib/game/assets';
import type {ActorMark,StageDirection} from '@/lib/game/staging';
import {SEASON_PLACEMENTS,seasonForQuarter} from '@/lib/game/seasons';
import {SeasonalLayer} from './SeasonalLayer';
import type {Beat,CastId,SceneId} from '@/lib/game/cinematic-content';
import {actorSpriteOffset,materialIsPainted,materialPlacement,SCENE_LAYOUTS,sceneFocusPoint} from '@/lib/game/composition';

// A decoded, actually displayed background is a safe handover plate across the
// hub/player mount boundary. Miniatures do not replace the full-screen plate.
let recentPainting:{url:string;position:string}|null=null;

export function Prop({object,className='',style}:{object:Focus|'newspaper';className?:string;style?:CSSProperties}){
 const cell=object==='newspaper'?11:OBJECTS[object].cell;
 return <span aria-hidden="true" className={`painted-prop ${className}`} style={{backgroundImage:`url(${imageURL('/art/props/objects.webp')})`,backgroundPosition:`${(cell%4)/3*100}% ${Math.floor(cell/4)/2*100}%`,...style}}/>;
}
export function Actor({id,pose=0,active=false,index=0,total=1,mark,worldAspect=1672/941}:{id:CastId;pose?:number;active?:boolean;index?:number;total?:number;mark?:ActorMark;worldAspect?:number}){
 const cast=CAST[id],safePose=Math.max(0,Math.min(2,pose)),offset=actorSpriteOffset(id,safePose),m=mark??{x:index?79:62,y:91,height:62};
 const src=imageURL(cast.sprite),[shown,setShown]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;void prepareImage(cast.sprite).then(()=>{if(active)setAttempt(n=>n+1);}).catch(()=>{});return()=>{active=false;};},[src]);
 return <div className={`actor world-actor ${active?'speaking':''} ${total>1?'ensemble':''} ${shown===src?'actor-ready':'actor-pending'}`} style={{'--figure-x':`${m.x}%`,'--figure-y':`${m.y}%`,'--figure-width':`${m.height/(worldAspect*2)}%`,'--actor-accent':cast.accent} as CSSProperties} aria-label={`${cast.name}，${['静立','交谈','沉思'][safePose]}`}><span className="actor-contact"/><div className="actor-crop"><img key={`${src}-${attempt}`} src={src} alt="" decoding="async" draggable={false} onLoad={()=>setShown(src)} style={{transform:`translateX(-${safePose*100/3}%)`,left:offset.left+'%',top:offset.top+'%'}}/></div></div>;
}
function Material({scene,focus,companion=false,rotate=0,action='still'}:{scene:SceneId;focus:Focus;companion?:boolean;rotate?:number;action?:string}){
 const p=materialPlacement(scene,focus,companion);if(!p||materialIsPainted(scene,focus))return null;
 return <div className={`scene-material stage-object-${action}`} data-material={focus} style={{left:p.x+'%',top:p.y+'%',width:p.width+'%','--material-flat':p.flat,'--material-angle':rotate+'deg'} as CSSProperties}><div className="material-plane"><Prop object={focus}/></div></div>;
}
export function Stage({scene,quarter=1,cast=[],speaker,pose=0,camera='wide',focus,emotion='quiet',shotId,showObject=false,sceneLayer,children,onReadyChange,framing='center',staging}:{scene:SceneId;quarter?:number;cast?:CastId[];speaker?:Beat['speaker'];pose?:number;camera?:Beat['camera'];focus?:Focus;emotion?:Beat['emotion'];shotId:string;showObject?:boolean;sceneLayer?:ReactNode;children?:ReactNode;onReadyChange?:(ready:boolean)=>void;framing?:'center'|'desk';staging?:StageDirection}){
 const info=SCENES[scene],point=focus?sceneFocusPoint(scene,focus):info.origin,source=assetSource(info.image),layout=SCENE_LAYOUTS[scene];
 const soundscape=useContext(SoundscapeContext);
 useEffect(()=>{const place=SEASON_PLACEMENTS[scene];soundscape?.({season:quarter-1,rain:info.weather==='rain',outdoors:place.outdoors,night:!!place.night});},[soundscape,scene,quarter,info.weather]);
 const cameraRef=useRef<HTMLDivElement>(null),rootRef=useRef<HTMLElement>(null),pointerFrame=useRef<number|null>(null),displayFailures=useRef(0),backgroundLoading=useRef(true);
 const [size,setSize]=useState({width:typeof window==='undefined'?1672:window.innerWidth*1.02,height:typeof window==='undefined'?941:window.innerHeight*1.02});
 const [painted,setPainted]=useState(''),[backplate,setBackplate]=useState(recentPainting),[error,setError]=useState(false),[retry,setRetry]=useState(0),[renderAttempt,setRenderAttempt]=useState(0),[,refreshSprites]=useState(0);
 const season=seasonForQuarter(quarter),paths=[...scenePaths(scene,cast),...(!SEASON_PLACEMENTS[scene].outdoors?[season.art]:[])];
 const url=imageURL(info.image),key=paths.map(imageURL).join('|'),ready=painted===url;
 useEffect(()=>{displayFailures.current=0;},[key]);
 useEffect(()=>{let active=true;setError(false);backgroundLoading.current=true;
  void prepareImage(info.image).then(()=>{if(active){backgroundLoading.current=false;setRenderAttempt(n=>n+1);}}).catch(()=>{if(active){backgroundLoading.current=false;setError(true);}});
  // Portraits, props and seasonal ornaments load independently. Their failure
  // must never replace an already available painting with the loading colour.
  for(const path of paths.slice(1))void prepareImage(path).then(()=>{if(active)refreshSprites(n=>n+1);}).catch(()=>{});
  return()=>{active=false;};
 },[key,retry]);
 useEffect(()=>{onReadyChange?.(ready);},[ready,onReadyChange]);
 useEffect(()=>{const el=cameraRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>{if(pointerFrame.current!==null)cancelAnimationFrame(pointerFrame.current);},[]);
 function displayFailed(){setPainted('');if(backgroundLoading.current)return;if(displayFailures.current++<1){invalidateImage(info.image);setRetry(n=>n+1);}else setError(true);}
 function paintingLoaded(img:HTMLImageElement){const expected=url,isCurrent=()=>img.isConnected&&img.currentSrc===new URL(expected,document.baseURI).href;void (typeof img.decode==='function'?img.decode():Promise.resolve()).then(()=>{if(!isCurrent())return;if(!img.naturalWidth){displayFailed();return;}setPainted(expected);setError(false);const plate={url:expected,position:framing==='desk'?'left bottom':'center'};setBackplate(plate);if(size.width>=window.innerWidth*.75&&size.height>=window.innerHeight*.6)recentPainting=plate;},()=>{if(isCurrent())displayFailed();});}
 function resetPointer(){if(pointerFrame.current!==null)cancelAnimationFrame(pointerFrame.current);pointerFrame.current=null;rootRef.current?.style.setProperty('--parallax-x','0px');rootRef.current?.style.setProperty('--parallax-y','0px');}
 const frame=coverFrame(size.width,size.height,source.width,source.height,framing==='desk'?0:.5,framing==='desk'?1:.5);
 const originX=(frame.left+frame.width*point[0]/100)/size.width*100,originY=(frame.top+frame.height*point[1]/100)/size.height*100;
 const needsInsert=!layout.surface||originX<5||originX>95||originY<8||originY>88;
 return <section ref={rootRef} className={`stage framing-${framing} camera-${camera} emotion-${emotion} ${ready?'scene-ready':'scene-pending'} ${staging?'stage-staged':''}`} data-composition={staging?.composition} data-channel={staging?.channel} data-scene={scene} data-season={season.id} data-shot={shotId} onPointerMove={e=>{if(e.pointerType!=='mouse'||e.currentTarget.closest('.reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5)*-3,y=((e.clientY-r.top)/r.height-.5)*-2;if(pointerFrame.current!==null)cancelAnimationFrame(pointerFrame.current);pointerFrame.current=requestAnimationFrame(()=>{rootRef.current?.style.setProperty('--parallax-x',Math.round(x*2)/2+'px');rootRef.current?.style.setProperty('--parallax-y',Math.round(y*2)/2+'px');});}} onPointerLeave={resetPointer} style={{'--scene-origin':`${originX}% ${originY}%`,'--parallax-x':'0px','--parallax-y':'0px',backgroundImage:backplate?`url(${backplate.url})`:undefined,backgroundSize:'cover',backgroundPosition:backplate?.position??'center'} as CSSProperties} aria-label={`${info.name} · ${season.name}季`} aria-busy={!ready}>
  <div className="stage-camera" ref={cameraRef}><div className="stage-world" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top}}>
   <img key={`${url}-${renderAttempt}`} className="stage-painting" src={url} alt={info.name} decoding="async" draggable={false} fetchPriority="high" onLoad={e=>paintingLoaded(e.currentTarget)} onError={displayFailed} style={{opacity:ready?1:0}}/>
   <div className="stage-set">
    <div className="stage-cast">{staging?staging.actors.map((mark,index)=><Actor key={mark.id} id={mark.id} pose={mark.pose} active={mark.active} mark={mark} worldAspect={source.width/source.height} index={index} total={staging.actors.length}/>):cast.slice(0,2).map((id,index)=><Actor key={id} id={id} pose={speaker===id?pose:0} active={speaker===id} mark={{id,...layout.actors[index],scale:1,pose:0,active:speaker===id}} worldAspect={source.width/source.height} index={index} total={Math.min(2,cast.length)}/>)}</div>
    {(staging?.showObject??showObject)&&focus&&<Material key={`${shotId}-${focus}`} scene={scene} focus={focus} rotate={staging?.object.rotate} action={staging?.object.action}/>}
    {staging?.showObject&&staging.object.companion&&<Material scene={scene} focus={staging.object.companion.focus} companion rotate={staging.object.companion.rotate}/>}
   </div>
   <div className="stage-color"/><SeasonalLayer scene={scene} quarter={quarter} visible={{left:-frame.left/frame.width*100,right:(size.width-frame.left)/frame.width*100,top:-frame.top/frame.height*100,bottom:(size.height-frame.top)/frame.height*100}}/>{info.weather==='rain'&&season.id!=='summer'&&<div className={`stage-rain ${scene==='old-street'?'outdoors':''}`} aria-hidden="true"/>}{info.weather==='dust'&&<div className="stage-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${13+i*6.8}%`,top:`${12+(i*19)%60}%`,animationDelay:`${-i*1.3}s`}}/>)}</div>}

  </div></div><div className="stage-vignette"/><div className="stage-grain" aria-hidden="true"/>
  <div className="stage-camera stage-interaction-camera"><div className="scene-world-interactions" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top}} inert={!ready}>{sceneLayer}</div></div>
  {(staging?.showObject??showObject)&&focus&&needsInsert&&focus!=='window'&&focus!=='lamp'&&<aside className="material-reading-insert" aria-label={`${OBJECTS[focus].name}近看`}><span>物件近看</span><div><Prop object={focus}/>{staging?.object.companion&&!materialIsPainted(scene,staging.object.companion.focus)&&<Prop object={staging.object.companion.focus}/>}</div><small>{OBJECTS[focus].name}</small></aside>}
  <div className="stage-runtime-ui">{children}</div><span className="stage-season-signature">{season.name}<i/>{season.line}</span>
  {!ready&&<div className="scene-load-status" role="status">{error?<><span>暂时没能取到新画面，原画面仍保留。</span><button onClick={()=>{invalidateImage(info.image);setRetry(n=>n+1);}}>再试一次</button></>:<span>正在接入下一幕…</span>}</div>}
 </section>;
}
