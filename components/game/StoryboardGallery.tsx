'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import type { Game } from '@/lib/game/engine';
import { STORYBOARDS } from '@/lib/game/cinematic-content';
import { CAST, OBJECTS, outcomeScene, SCENES } from '@/lib/game/visuals';
import { collectionReplay, collectionStats, type Collection } from '@/lib/game/collection';
import { imageURL } from '@/lib/game/assets';
import { CinematicPlayer } from './CinematicPlayer';
import { EndingPlayer } from './EndingPlayer';
import { Prop } from './Stage';

export function StoryboardGallery({game,collection,onClose,speed,reducedMotion,paused=false}:{game:Game;collection:Collection;onClose:()=>void;speed:number;reducedMotion:boolean;paused?:boolean}){
 const [endingName,setEndingName]=useState<string|null>(null);
 const [filter,setFilter]=useState('all'),[open,setOpen]=useState<{id:string;branch?:0|1}|null>(null);
 const stats=collectionStats(collection),knownIds=Object.keys(STORYBOARDS).filter(id=>collection.stories[id]);
 const ids=knownIds.filter(id=>filter==='all'||(filter==='main'?id.startsWith('main-'):id.startsWith('s')));
 const remaining=Object.keys(STORYBOARDS).filter(id=>!collection.stories[id]&&(filter==='all'||(filter==='main'?id.startsWith('main-'):id.startsWith('s')))).length;
 const end=endingName?collection.endings[endingName]:undefined;
 if(endingName&&end)return <EndingPlayer game={game} name={endingName} recordedText={end.text} preview paused={paused} speed={speed} reducedMotion={reducedMotion} onFinish={()=>setEndingName(null)}/>;
 const replay=open?collectionReplay(collection,open.id,open.branch):undefined;
 if(open&&replay)return <CinematicPlayer key={`${open.id}-${open.branch}`} game={game} event={replay} answered={null} preview introOnly={open.branch===undefined} paused={paused} previewBranch={open.branch} speed={speed} reducedMotion={reducedMotion} onChoose={()=>false} onFinish={()=>setOpen(null)} onLedger={()=>{}} onProgress={()=>{}}/>;
 return <div className="storyboard-gallery">
  <header><button onClick={onClose}><ArrowLeft size={16}/>返回</button><span>往事收藏<small>随你的经历留存</small></span><span className="mono">{stats.stories} / 64 故事 · {stats.branches} / 128 回声</span></header>
  <div className="gallery-intro"><p>有些日子，值得再翻一遍。</p><h1>只收下，你走过的片段。</h1><p className="gallery-unlock-note">读完开场，收录故事；作出答复，留下回声。未走过的路，留给下一次相遇。</p><div className="gallery-filters">{[['all',`全部 ${stats.stories}`],['main',`主线 ${knownIds.filter(id=>id.startsWith('main-')).length}`],['side',`日常 ${knownIds.filter(id=>id.startsWith('s')).length}`]].map(([v,label])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{label}</button>)}</div></div>
  <div className="gallery-grid">{ids.map(id=>{
   const script=STORYBOARDS[id],memory=collection.stories[id],event=memory.intro,actor=script.cast[0];
   return <article key={id} className="gallery-event" data-gallery-event={id}>
    <button className="gallery-thumbnail" onClick={()=>setOpen({id})} aria-label={`回看${event.title}`}><img src={imageURL(SCENES[script.scene].image)} alt={SCENES[script.scene].name} loading="lazy"/>{actor&&<span className="thumbnail-actor"><img src={imageURL(CAST[actor].sprite)} alt={CAST[actor].name} loading="lazy"/></span>}<span>{event.sender}</span></button>
    <div className="gallery-event-title"><small>{id.startsWith('main-')?'主线':'日常'} · 已收录</small><h2>{event.title}</h2></div>
    <div className="gallery-branches">{([0,1] as const).map(i=>{const branch=memory.branches[i];return branch?<button key={i} onClick={()=>setOpen({id,branch:i})} data-gallery-branch={`${id}-${i}`}><Prop object={script.outcomeFocus[i]}/><span><strong>{i===0?'A':'B'} · {branch.options[i].label}</strong><small>{SCENES[outcomeScene(id,i,script.scene)].name} / {OBJECTS[script.outcomeFocus[i]].name}</small></span><ArrowRight size={14}/></button>:<div key={i} className="gallery-branch-locked"><LockKeyhole size={16}/><span><strong>{i===0?'A':'B'} · 尚未留下的答复</strong><small>在故事中作出这一选择后解锁</small></span></div>;})}</div>
   </article>;
  })}</div>
  {remaining>0&&<div className="gallery-sealed"><LockKeyhole size={21}/><div><h2>{stats.stories===0?'往事还没有写下第一页':'还有一些日子，尚未相遇。'}</h2><p>{stats.stories===0?'回到书屋，拆开柜台上的来信，读完第一段对话。':`还有 ${remaining} 段${filter==='main'?'主线':filter==='side'?'日常':''}故事等待你亲历。人物、题目与画面会在相遇后出现。`}</p></div></div>}
  <section className="gallery-endings"><p>三年以后 <small>{stats.endings} / 8 已抵达</small></p><div>{Object.entries(collection.endings).map(([name])=><button key={name} onClick={()=>setEndingName(name)}>{name}<ArrowRight size={14}/></button>)}{stats.endings<8&&<span className="gallery-ending-locked"><LockKeyhole size={15}/>{stats.endings===0?'走完三年，才知道后来的事。':`还有 ${8-stats.endings} 种后来，尚未抵达。`}</span>}</div></section>
  <footer>收藏会随存档导出，重新开始也会保留。回看不会改写选择，也不会解锁另一条路。</footer>
 </div>;
}
