'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createGame, type StoryEvent } from '@/lib/game/engine';
import { mainEvent, materialize, SIDE_EVENTS } from '@/lib/game/stories';
import { STORYBOARDS } from '@/lib/game/cinematic-content';
import { CAST, OBJECTS, outcomeScene, SCENES } from '@/lib/game/visuals';
import { CinematicPlayer } from './CinematicPlayer';
import { EPILOGUES } from '@/lib/game/epilogues';
import { EndingPlayer } from './EndingPlayer';
import { Prop } from './Stage';
export function makePreviewEvent(id:string):StoryEvent{
 const s=createGame(20261108);s.flags.shop=1;s.flags.printLoan=1;s.quarter=id.startsWith('main-')?Number(id.slice(5)):5;
 const event=id.startsWith('main-')?mainEvent(s):SIDE_EVENTS.find(e=>e.id===id);if(!event)throw new Error('未找到事件');return materialize(event,s);
}
export function StoryboardGallery({onClose,speed,reducedMotion,paused=false}:{onClose:()=>void;speed:number;reducedMotion:boolean;paused?:boolean}){
 const [endingName,setEndingName]=useState<string|null>(null);
 const [filter,setFilter]=useState('all'),[open,setOpen]=useState<{id:string;branch?:0|1}|null>(null);
 const ids=Object.keys(STORYBOARDS).filter(id=>filter==='all'||(filter==='main'?id.startsWith('main-'):id.startsWith('s')));
 if(endingName)return <EndingPlayer game={createGame(20261108)} name={endingName} preview paused={paused} speed={speed} reducedMotion={reducedMotion} onFinish={()=>setEndingName(null)}/>;
 if(open){const e=makePreviewEvent(open.id);return <CinematicPlayer key={`${open.id}-${open.branch}`} game={createGame(20261108)} event={e} answered={null} preview paused={paused} previewBranch={open.branch} speed={speed} reducedMotion={reducedMotion} onChoose={()=>true} onFinish={()=>setOpen(null)} onLedger={()=>{}} onProgress={()=>{}}/>;}
 return <div className="storyboard-gallery"><header><button onClick={onClose}><ArrowLeft size={16}/>返回</button><span>分镜总览<small>含后续剧情</small></span><span className="mono">64 故事 / 128 回声</span></header><div className="gallery-intro"><p>同一座城，每一种答复。</p><h1>所有故事，都有它的画面。</h1><div className="gallery-filters">{[['all','全部 64'],['main','主线 12'],['side','日常 52']].map(([v,label])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{label}</button>)}</div></div><div className="gallery-grid">{ids.map(id=>{const script=STORYBOARDS[id],event=makePreviewEvent(id),actor=script.cast[0];return <article key={id} className="gallery-event" data-gallery-event={id}><button className="gallery-thumbnail" onClick={()=>setOpen({id})} aria-label={`播放${event.title}`}><img src={SCENES[script.scene].image} alt={SCENES[script.scene].name} loading="lazy"/>{actor&&<span className="thumbnail-actor"><img src={CAST[actor].sprite} alt={CAST[actor].name} loading="lazy"/></span>}<span>{event.sender}</span></button><div className="gallery-event-title"><small>{id.startsWith('main-')?'主线':'日常'} · {id}</small><h2>{event.title}</h2></div><div className="gallery-branches">{([0,1] as const).map(i=><button key={i} onClick={()=>setOpen({id,branch:i})} data-gallery-branch={`${id}-${i}`}><Prop object={script.outcomeFocus[i]}/><span><strong>{i===0?'A':'B'} · {event.options[i].label}</strong><small>{SCENES[outcomeScene(id,i,script.scene)].name} / {OBJECTS[script.outcomeFocus[i]].name}</small></span><ArrowRight size={14}/></button>)}</div></article>;})}</div><section className="gallery-endings"><p>八种后来 · 结局分镜</p><div>{Object.keys(EPILOGUES).map(name=><button key={name} onClick={()=>setEndingName(name)}>{name}<ArrowRight size={14}/></button>)}</div></section><footer>每个事件均有独立物件交互、逐句开场和两个不同的后续分镜。预览不会改动游戏存档。</footer></div>;
}
