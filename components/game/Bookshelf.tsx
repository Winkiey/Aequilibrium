'use client';
import {lazy,Suspense} from 'react';
import {BookOpen,UsersRound,Archive,ArrowRight} from 'lucide-react';
import type {Game} from '@/lib/game/engine';
import type {Presentation} from '@/lib/game/presentation';
import type {Collection} from '@/lib/game/collection';
import {collectionStats} from '@/lib/game/collection';
import {StoryboardGallery} from './StoryboardGallery';
const PeopleBook=lazy(()=>import('./PeopleBook'));
const EconomicsBook=lazy(()=>import('./EconomicsBook'));
export type ShelfTab='overview'|'people'|'memories'|'economics';
export default function Bookshelf({game,presentation,collection,tab,onTab,onPage,sound,onSound,onAudioFocus}:{game:Game;presentation:Presentation;collection:Collection;tab:ShelfTab;onTab:(tab:ShelfTab)=>void;onPage:(page:number)=>void;sound:boolean;onSound:()=>void;onAudioFocus:(active:boolean)=>void}){
 const stats=collectionStats(collection);
 return <div className={`bookshelf-room shelf-${tab}`}><nav className="bookshelf-navigation" aria-label="书柜分区">{([['overview','书柜'],['people','人物往来'],['memories','往事收藏'],['economics','经济读物']] as const).map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>onTab(id)}>{label}</button>)}</nav><div className="bookshelf-content">
 {tab==='overview'?<div className="bookshelf-index"><p className="paper-kicker">泊灯书屋 · 留给日子的地方</p><h2>人、往事，和读过的书。</h2><p>遇见的人、作过的答复，都收在这里。未经历的故事仍然合着。</p><div>{[{id:'people' as const,icon:UsersRound,title:'人物往来',subtitle:'记住谁来过',text:'翻看已经认识的人，以及你们真实发生的往来。'},{id:'memories' as const,icon:Archive,title:'往事收藏',subtitle:`${stats.stories} 段故事 · ${stats.endings} 种后来`,text:'按自己的经历回看开场、答复与结局，不会改写存档。'},{id:'economics' as const,icon:BookOpen,title:'经济读物',subtitle:'六卷十八章',text:'在生活与市场之间，读懂选择、现金、风险与合作。'}].map(b=><button key={b.id} onClick={()=>onTab(b.id)}><b.icon size={25} strokeWidth={1}/><span><small>{b.subtitle}</small><strong>{b.title}</strong><p>{b.text}</p></span><ArrowRight size={18}/></button>)}</div></div>:
 tab==='people'?<Suspense fallback={<p>正在翻开人物簿…</p>}><PeopleBook game={game} presentation={presentation}/></Suspense>:
 tab==='economics'?<Suspense fallback={<p>正在取下阅读册…</p>}><EconomicsBook page={presentation.readingPage??0} onPage={onPage} reducedMotion={presentation.reducedMotion}/></Suspense>:
 <StoryboardGallery embedded game={game} collection={collection} speed={presentation.speed} reducedMotion={presentation.reducedMotion} sound={sound} onSound={onSound} onAudioFocus={onAudioFocus} onClose={()=>onTab('overview')}/>}
 </div></div>;
}
