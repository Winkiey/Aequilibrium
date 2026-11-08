'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {CAST,OBJECTS,SCENES,type Focus} from '@/lib/game/visuals';
import {assetSource,coverFrame,imageReady,imageURL,prepareImage,scenePaths,SCENE_OBJECT_ANCHORS} from '@/lib/game/assets';
import type {ActorMark,StageDirection} from '@/lib/game/staging';
import {SEASON_PLACEMENTS,seasonForQuarter} from '@/lib/game/seasons';
import {SeasonalLayer} from './SeasonalLayer';
import type {Beat,CastId,SceneId} from '@/lib/game/cinematic-content';

export function Prop({object,className='',style}:{object:Focus|'newspaper';className?:string;style?:CSSProperties}){
 const cell=object==='newspaper'?11:OBJECTS[object].cell;
 return <span aria-hidden="true" className={`painted-prop ${className}`} style={{backgroundImage:`url(${imageURL('/art/props/objects.webp')})`,backgroundPosition:`${(cell%4)/3*100}% ${Math.floor(cell/4)/2*100}%`,...style}}/>;
}
export function Actor({id,pose=0,active=false,index=0,total=1,mark}:{id:CastId;pose?:number;active?:boolean;index?:number;total?:number;mark?:ActorMark}){
 const cast=CAST[id];
 return <div className={`actor ${active?'speaking':''} ${total>1?'ensemble':''} ${mark?'staged-actor':''}`} style={{'--actor-x':`${total===1?72:index===0?76:45}%`,'--actor-depth':index===0?'1':'0.87','--actor-accent':cast.accent,...(mark?{'--mark-x':`${mark.x}%`,'--mark-y':`${mark.y}%`,'--mark-scale':mark.scale}:{})} as CSSProperties} aria-label={`${cast.name}，${['静立','交谈','沉思'][pose]}`}><span className="actor-contact"/><div className="actor-crop"><img src={imageURL(cast.sprite)} alt="" decoding="async" draggable={false} style={{transform:`translateX(-${Math.min(2,pose)*100/3}%)`}}/></div></div>;
}
export function Stage({scene,quarter=1,cast=[],speaker,pose=0,camera='wide',focus,emotion='quiet',shotId,showObject=false,sceneLayer,children,onReadyChange,framing='center',staging}:{scene:SceneId;quarter?:number;cast?:CastId[];speaker?:Beat['speaker'];pose?:number;camera?:Beat['camera'];focus?:Focus;emotion?:Beat['emotion'];shotId:string;showObject?:boolean;sceneLayer?:ReactNode;children?:ReactNode;onReadyChange?:(ready:boolean)=>void;framing?:'center'|'desk';staging?:StageDirection}){
 const info=SCENES[scene],point=focus?(SCENE_OBJECT_ANCHORS[scene]?.[focus]??OBJECTS[focus].point):info.origin,source=assetSource(info.image);
 const cameraRef=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState({width:typeof window==='undefined'?1672:window.innerWidth*1.02,height:typeof window==='undefined'?941:window.innerHeight*1.02});
 const [parallax,setParallax]=useState({x:0,y:0}),[resolved,setResolved]=useState(''),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const season=seasonForQuarter(quarter),paths=[...scenePaths(scene,cast),...(!SEASON_PLACEMENTS[scene].outdoors?[season.art]:[])];
 const key=paths.map(imageURL).join('|');const ready=resolved===key||paths.every(imageReady);
 useEffect(()=>{let active=true;setError(false);void Promise.all(paths.map(prepareImage)).then(()=>{if(active)setResolved(key);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[key,retry]);
 useEffect(()=>{onReadyChange?.(ready);},[ready,onReadyChange]);
 useEffect(()=>{const el=cameraRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);
 const frame=coverFrame(size.width,size.height,source.width,source.height,framing==='desk'?0:.5,framing==='desk'?1:.5);
 return <section className={`stage framing-${framing} camera-${camera} emotion-${emotion} ${ready?'scene-ready':'scene-pending'} ${staging?'stage-staged':''}`} data-composition={staging?.composition} data-channel={staging?.channel} data-scene={scene} data-season={season.id} data-shot={shotId} onPointerMove={e=>{if(e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();setParallax({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});}}} onPointerLeave={()=>setParallax({x:0,y:0})} style={{'--scene-origin':`${point[0]}% ${point[1]}%`,'--parallax-x':`${parallax.x*-6}px`,'--parallax-y':`${parallax.y*-4}px`} as CSSProperties} aria-label={`${info.name} · ${season.name}季`} aria-busy={!ready}>
  <div className="stage-camera" ref={cameraRef}><div className="stage-world" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top,backgroundImage:source.placeholder?`url(${source.placeholder})`:undefined}}>
   <img className="stage-painting" src={imageURL(info.image)} alt={info.name} decoding="async" draggable={false} fetchPriority="high"/>
   <div className="stage-color"/><SeasonalLayer scene={scene} quarter={quarter} visible={{left:-frame.left/frame.width*100,right:(size.width-frame.left)/frame.width*100,top:-frame.top/frame.height*100,bottom:(size.height-frame.top)/frame.height*100}}/>{info.weather==='rain'&&season.id!=='summer'&&<div className={`stage-rain ${scene==='old-street'?'outdoors':''}`} aria-hidden="true"/>}{info.weather==='dust'&&<div className="stage-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${13+i*6.8}%`,top:`${12+(i*19)%60}%`,animationDelay:`${-i*1.3}s`}}/>)}</div>}

  </div></div><div className="stage-vignette"/><div className="stage-grain" aria-hidden="true"/>
  <div className="stage-camera stage-interaction-camera"><div className="scene-world-interactions" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top}} inert={!ready}>{sceneLayer}</div></div>
  <div className="stage-cast">{staging?staging.actors.map((mark,index)=><Actor key={mark.id} id={mark.id} pose={mark.pose} active={mark.active} mark={mark} index={index} total={staging.actors.length}/>):cast.slice(0,2).map((id,index)=><Actor key={id} id={id} pose={speaker===id?pose:0} active={speaker===id} index={index} total={Math.min(2,cast.length)}/>)}</div>
  {(staging?.showObject??showObject)&&focus&&!SCENE_OBJECT_ANCHORS[scene]?.[focus]&&<div className={`object-study object-${focus} ${staging?'stage-object stage-object-'+staging.object.action:''}`} style={staging?{'--prop-x':staging.object.x+'%','--prop-y':staging.object.y+'%','--prop-width':staging.object.width+'vw','--prop-rotate':staging.object.rotate+'deg'} as CSSProperties:undefined} key={`${shotId}-${focus}`}><Prop object={focus}/><span>{OBJECTS[focus].name}</span></div>}
  {staging?.showObject&&staging.object.companion&&!SCENE_OBJECT_ANCHORS[scene]?.[staging.object.companion.focus]&&<div className="stage-companion" style={{'--companion-x':staging.object.companion.x+'%','--companion-y':staging.object.companion.y+'%','--companion-width':staging.object.companion.width+'vw','--companion-rotate':staging.object.companion.rotate+'deg'} as CSSProperties}><Prop object={staging.object.companion.focus}/></div>}
  <div className="stage-runtime-ui" inert={!ready&&!error}>{children}</div><span className="stage-season-signature">{season.name}<i/>{season.line}</span>
  {!ready&&<div className="scene-load-status" role="status">{error?<><span>这幅画面还没取到。</span><button onClick={()=>setRetry(n=>n+1)}>重新载入</button></>:<span>正在铺开这一幕…</span>}</div>}
 </section>;
}
