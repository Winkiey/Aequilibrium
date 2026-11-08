'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {CAST,OBJECTS,SCENES,type Focus} from '@/lib/game/visuals';
import {assetSource,coverFrame,imageReady,imageURL,prepareScene,scenePaths} from '@/lib/game/assets';
import type {Beat,CastId,SceneId} from '@/lib/game/cinematic-content';

export function Prop({object,className='',style}:{object:Focus|'newspaper';className?:string;style?:CSSProperties}){
 const cell=object==='newspaper'?11:OBJECTS[object].cell;
 return <span aria-hidden="true" className={`painted-prop ${className}`} style={{backgroundImage:`url(${imageURL('/art/props/objects.webp')})`,backgroundPosition:`${(cell%4)/3*100}% ${Math.floor(cell/4)/2*100}%`,...style}}/>;
}
export function Actor({id,pose=0,active=false,index=0,total=1}:{id:CastId;pose?:number;active?:boolean;index?:number;total?:number}){
 const cast=CAST[id];
 return <div className={`actor ${active?'speaking':''} ${total>1?'ensemble':''}`} style={{'--actor-x':`${total===1?72:index===0?76:45}%`,'--actor-depth':index===0?'1':'0.87','--actor-accent':cast.accent} as CSSProperties} aria-label={`${cast.name}，${['静立','交谈','沉思'][pose]}`}><span className="actor-contact"/><div className="actor-crop"><img src={imageURL(cast.sprite)} alt="" decoding="async" draggable={false} style={{transform:`translateX(-${Math.min(2,pose)*100/3}%)`}}/></div></div>;
}
export function Stage({scene,cast=[],speaker,pose=0,camera='wide',focus,emotion='quiet',shotId,showObject=false,sceneLayer,children,onReadyChange,framing='center'}:{scene:SceneId;cast?:CastId[];speaker?:Beat['speaker'];pose?:number;camera?:Beat['camera'];focus?:Focus;emotion?:Beat['emotion'];shotId:string;showObject?:boolean;sceneLayer?:ReactNode;children?:ReactNode;onReadyChange?:(ready:boolean)=>void;framing?:'center'|'desk'}){
 const info=SCENES[scene],point=focus?OBJECTS[focus].point:info.origin,source=assetSource(info.image);
 const cameraRef=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState({width:typeof window==='undefined'?1672:window.innerWidth*1.02,height:typeof window==='undefined'?941:window.innerHeight*1.02});
 const [parallax,setParallax]=useState({x:0,y:0}),[resolved,setResolved]=useState(''),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const key=scenePaths(scene,cast).map(imageURL).join('|');const ready=resolved===key||scenePaths(scene,cast).every(imageReady);
 useEffect(()=>{let active=true;setError(false);void prepareScene(scene,cast).then(()=>{if(active)setResolved(key);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[key,retry]);
 useEffect(()=>{onReadyChange?.(ready);},[ready,onReadyChange]);
 useEffect(()=>{const el=cameraRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);
 const frame=coverFrame(size.width,size.height,source.width,source.height,framing==='desk'?0:.5,framing==='desk'?1:.5);
 return <section className={`stage framing-${framing} camera-${camera} emotion-${emotion} ${ready?'scene-ready':'scene-pending'}`} data-scene={scene} data-shot={shotId} onPointerMove={e=>{if(e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();setParallax({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});}}} onPointerLeave={()=>setParallax({x:0,y:0})} style={{'--scene-origin':`${point[0]}% ${point[1]}%`,'--parallax-x':`${parallax.x*-6}px`,'--parallax-y':`${parallax.y*-4}px`} as CSSProperties} aria-label={info.name} aria-busy={!ready}>
  <div className="stage-camera" ref={cameraRef}><div className="stage-world" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top,backgroundImage:source.placeholder?`url(${source.placeholder})`:undefined}}>
   <img className="stage-painting" src={imageURL(info.image)} alt={info.name} decoding="async" draggable={false} fetchPriority="high"/>
   <div className="stage-color"/>{info.weather==='rain'&&<div className={`stage-rain ${scene==='old-street'?'outdoors':''}`} aria-hidden="true"/>}{info.weather==='dust'&&<div className="stage-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${13+i*6.8}%`,top:`${12+(i*19)%60}%`,animationDelay:`${-i*1.3}s`}}/>)}</div>}

  </div></div><div className="stage-vignette"/><div className="stage-grain" aria-hidden="true"/>
  <div className="stage-camera stage-interaction-camera"><div className="scene-world-interactions" style={{width:frame.width,height:frame.height,left:frame.left,top:frame.top}} inert={!ready}>{sceneLayer}</div></div>
  <div className="stage-cast">{cast.slice(0,2).map((id,index)=><Actor key={id} id={id} pose={speaker===id?pose:0} active={speaker===id} index={index} total={Math.min(2,cast.length)}/>)}</div>
  {showObject&&focus&&<div className={`object-study object-${focus}`} key={`${shotId}-${focus}`}><Prop object={focus}/><span>{OBJECTS[focus].name}</span></div>}
  <div className="stage-runtime-ui" inert={!ready&&!error}>{children}</div>
  {!ready&&<div className="scene-load-status" role="status">{error?<><span>这幅画面还没取到。</span><button onClick={()=>setRetry(n=>n+1)}>重新载入</button></>:<span>正在铺开这一幕…</span>}</div>}
 </section>;
}
