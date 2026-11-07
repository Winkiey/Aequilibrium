'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { CAST, OBJECTS, SCENES, type Focus } from '@/lib/game/visuals';
import type { Beat, CastId, SceneId } from '@/lib/game/cinematic-content';

export function Prop({object,className='',style}:{object:Focus|'newspaper';className?:string;style?:CSSProperties}){
 const cell=object==='newspaper'?11:OBJECTS[object].cell;
 return <span aria-hidden="true" className={`painted-prop ${className}`} style={{backgroundImage:'url(/art/props/objects.webp)',backgroundPosition:`${(cell%4)/3*100}% ${Math.floor(cell/4)/2*100}%`,...style}}/>;
}
export function Actor({id,pose=0,active=false,index=0,total=1}:{id:CastId;pose?:number;active?:boolean;index?:number;total?:number}){
 const cast=CAST[id];
 return <div className={`actor ${active?'speaking':''} ${total>1?'ensemble':''}`} style={{'--actor-x':`${total===1?72:index===0?76:45}%`,'--actor-depth':index===0?'1':'0.87','--actor-accent':cast.accent} as CSSProperties} aria-label={`${cast.name}，${['静立','交谈','沉思'][pose]}`}><span className="actor-contact"/><div className="actor-crop"><img src={cast.sprite} alt="" draggable={false} style={{transform:`translateX(-${Math.min(2,pose)*100/3}%)`}}/></div></div>;
}
export function Stage({scene,cast=[],speaker,pose=0,camera='wide',focus,emotion='quiet',shotId,showObject=false,children}:{scene:SceneId;cast?:CastId[];speaker?:Beat['speaker'];pose?:number;camera?:Beat['camera'];focus?:Focus;emotion?:Beat['emotion'];shotId:string;showObject?:boolean;children?:ReactNode}){
 const info=SCENES[scene],point=focus?OBJECTS[focus].point:info.origin;
 const [parallax,setParallax]=useState({x:0,y:0});
 return <section className={`stage camera-${camera} emotion-${emotion}`} data-scene={scene} data-shot={shotId} onPointerMove={e=>{if(e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();setParallax({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});}}} onPointerLeave={()=>setParallax({x:0,y:0})} style={{'--scene-origin':`${point[0]}% ${point[1]}%`,'--parallax-x':`${parallax.x*-6}px`,'--parallax-y':`${parallax.y*-4}px`} as CSSProperties} aria-label={info.name}>
  <div className="stage-camera"><img className="stage-painting" src={info.image} alt={info.name} draggable={false} fetchPriority="high"/><div className="stage-color"/>{info.weather==='rain'&&<div className={`stage-rain ${scene==='old-street'?'outdoors':''}`} aria-hidden="true"/>}{info.weather==='dust'&&<div className="stage-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${13+i*6.8}%`,top:`${12+(i*19)%60}%`,animationDelay:`${-i*1.3}s`}}/>)}</div>}
  </div><div className="stage-vignette"/><div className="stage-grain" aria-hidden="true"/>
  <div className="stage-cast">{cast.slice(0,2).map((id,index)=><Actor key={id} id={id} pose={speaker===id?pose:0} active={speaker===id} index={index} total={Math.min(2,cast.length)}/>)}</div>
  {showObject&&focus&&<div className={`object-study object-${focus}`} key={`${shotId}-${focus}`}><Prop object={focus}/><span>{OBJECTS[focus].name}</span></div>}
  {children}
 </section>;
}
