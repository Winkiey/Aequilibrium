'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,List,Bookmark,Search,X} from 'lucide-react';
import {READING_CHAPTERS,READING_SOURCES,type ReadingChapter} from '@/lib/game/reading';
import {READING_ORDER,READING_STUDY,READING_VOLUMES,readingMatches} from '@/lib/game/reading-study';
import {READING_SOURCE_NOTES} from '@/lib/game/reading-sources';
import ReadingFigure from './ReadingFigure';

const chapterIndex=(id:string)=>READING_CHAPTERS.findIndex(c=>c.id===id);
const TABS=[['case','例与图'],['ideas','概念辨析'],['sources','原著札记']] as const;
type Tab=typeof TABS[number][0];
type Section='principles'|Tab;

/** Direct access on a short screen; the desktop keeps its two facing pages. */
export function ReadingSections({active,onSelect}:{active:Section;onSelect:(section:Section)=>void}){
 return <nav className="reader-sections" aria-label="本章阅读分区">{([['principles','正文'],...TABS] as const).map(([id,label])=><button key={id} aria-pressed={active===id} aria-controls={id==='principles'?'reader-principles-page':'reader-notes-page'} onClick={()=>onSelect(id)}>{label}</button>)}</nav>;
}

function PageHeader({chapter,side}:{chapter:ReadingChapter;side:'left'|'right'}){
 const volume=READING_VOLUMES.find(v=>v.chapters.some(id=>id===chapter.id))!;
 return <header className="reader-running-head"><span>卷{volume.number} · {volume.title}</span><span>{side==='left'?'泊灯书屋 · 阅读册':'关于钱，也关于日子'}</span></header>;
}
function PrinciplesPage({chapter,ordinal}:{chapter:ReadingChapter;ordinal:number}){
 const study=READING_STUDY[chapter.id];
 return <article id="reader-principles-page" className="book-page left reader-principles" aria-label={`${chapter.title}，正文`} tabIndex={0}>
  <PageHeader chapter={chapter} side="left"/>
  <div className="reader-title"><span className="reader-chapter-no">{String(ordinal+1).padStart(2,'0')}</span><div><p className="reader-eyebrow">{chapter.subtitle}</p><h2>{chapter.title}</h2></div></div>
  <p className="reader-opening">{study.opening}</p>
  <div className="reader-prose">{chapter.summary.map((p,i)=><section key={p}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><h3>{study.headings[i]}</h3><p>{p}</p></section>)}</div>
  <aside className="reader-margin-note"><span>留一个问题</span><p>{chapter.question}</p></aside>
  <footer className="reader-folio"><span>AEQUILIBRIUM · 读书札记</span><span>{ordinal*2+1}</span></footer>
 </article>;
}
function NotesPage({chapter,ordinal,tab,onTab,onRelated}:{chapter:ReadingChapter;ordinal:number;tab:Tab;onTab:(tab:Tab)=>void;onRelated:(id:string)=>void}){
 const study=READING_STUDY[chapter.id];
 const tabs=useRef<(HTMLButtonElement|null)[]>([]);
 return <article id="reader-notes-page" className="book-page right reader-notes" aria-label={`${chapter.title}，阅读札记`} tabIndex={0}>
  <PageHeader chapter={chapter} side="right"/>
  <div role="tablist" aria-label="本章阅读札记" className="reader-tabs" onKeyDown={e=>{const i=TABS.findIndex(([id])=>id===tab);let next=i;if(e.key==='ArrowRight')next=(i+1)%TABS.length;else if(e.key==='ArrowLeft')next=(i+TABS.length-1)%TABS.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=TABS.length-1;else return;e.preventDefault();e.stopPropagation();onTab(TABS[next][0]);tabs.current[next]?.focus();}}>
   {TABS.map(([id,label],i)=><button key={id} ref={el=>{tabs.current[i]=el;}} id={`reader-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`reader-panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>onTab(id)}>{label}</button>)}
  </div>
  <section id={`reader-panel-${tab}`} role="tabpanel" aria-labelledby={`reader-tab-${tab}`} className="reader-note-body" key={`${chapter.id}-${tab}`}>
   {tab==='case'&&<><p className="reader-eyebrow">从生活里读懂</p><h3>{chapter.exampleTitle.replace('编者例子 · ','')}</h3>{chapter.example.map(p=><p key={p}>{p}</p>)}<ReadingFigure chapter={chapter.id}/></>}
   {tab==='ideas'&&<><p className="reader-eyebrow">把相近的概念分开</p><h3>这一章的两个刻度</h3><dl className="reader-definitions">{study.concepts.map(c=><div key={c.term}><dt>{c.term}</dt><dd>{c.meaning}</dd></div>)}</dl><section className="reader-distinction"><h4><span>{study.distinction.a}</span><i>与</i><span>{study.distinction.b}</span></h4><p>{study.distinction.explanation}</p></section><details className="reader-exercise"><summary><span>纸边小题</span>{study.exercise.prompt}<small>想一想，再展开思路</small></summary><p>{study.exercise.answer}</p></details><div className="reader-term-index"><span>概念索引</span><p>{chapter.terms.join(' / ')}</p></div></>}
   {tab==='sources'&&<><p className="reader-eyebrow">相关阅读 · 编者札记</p><h3>这些想法从哪里来</h3><p className="reader-editor-note">以下为主题选读与原创梳理。原著、论文、演讲各有范围；这些札记只带你走近问题。</p><div className="reader-source-list">{chapter.sources.map((id,i)=>{const s=READING_SOURCES[id],n=READING_SOURCE_NOTES[id];return <details key={`${chapter.id}-${id}`} open={i===0}><summary><span>{String(i+1).padStart(2,'0')} · {s.kind} / {s.year}</span><strong>{n.name}</strong><cite>{s.title}</cite><small>{s.author}</small></summary><div><h4>{n.question}</h4><p>{n.argument}</p><p className="reader-source-boundary"><b>阅读边界</b>{n.boundary}</p><small>{s.note}</small></div></details>;})}</div>{chapter.quote&&<blockquote className="reader-original"><span>原文短引</span><em lang="en">“{chapter.quote.text}”</em><p>编者译：{chapter.quote.translation}</p><cite>{READING_SOURCES[chapter.quote.source].author} · {chapter.quote.locator}</cite></blockquote>}</>}
  </section>
  <nav className="reader-related" aria-label="关联章节"><span>接着读</span>{study.related.map(id=><button key={id} onClick={()=>onRelated(id)}>{READING_CHAPTERS[chapterIndex(id)].title}<ArrowRight size={12}/></button>)}</nav>
  <footer className="reader-folio"><span>正文与例子均为编者整理</span><span>{ordinal*2+2}</span></footer>
 </article>;
}

export default function EconomicsBook({page,onPage,reducedMotion}:{page:number;onPage:(page:number)=>void;reducedMotion:boolean}){
 const index=Math.max(0,Math.min(READING_CHAPTERS.length-1,Number.isFinite(page)?Math.floor(page):0)),chapter=READING_CHAPTERS[index];
 const ordinal=READING_ORDER.indexOf(chapter.id as typeof READING_ORDER[number]);
 const volume=READING_VOLUMES.find(v=>v.chapters.some(id=>id===chapter.id))!;
 const [contents,setContents]=useState(false),[query,setQuery]=useState(''),[tab,setTab]=useState<Tab>('case'),[side,setSide]=useState<'left'|'right'>('left');
 const [turn,setTurn]=useState<{from:number;direction:1|-1}|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),book=useRef<HTMLDivElement>(null),search=useRef<HTMLInputElement>(null),catalogButton=useRef<HTMLButtonElement>(null),wasContents=useRef(false),catalog=useRef<HTMLElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{if(contents)search.current?.focus();else if(wasContents.current)catalogButton.current?.focus();wasContents.current=contents;},[contents]);
 useEffect(()=>{for(const p of book.current?.querySelectorAll('.book-page')??[])p.scrollTop=0;},[index]);
 useEffect(()=>{const notes=book.current?.querySelector('.reader-notes');if(notes)notes.scrollTop=0;},[tab]);
 function closeContents(){setContents(false);}
 function go(to:number){
  if(turn||to<0||to>=READING_CHAPTERS.length)return;
  if(contents)closeContents();if(to===index)return;
  if(!reducedMotion){setTurn({from:index,direction:READING_ORDER.indexOf(READING_CHAPTERS[to].id as typeof READING_ORDER[number])>ordinal?1:-1});timer.current=setTimeout(()=>setTurn(null),560);}
  setTab('case');setSide('left');onPage(to);
 }
 function adjacent(delta:number){const id=READING_ORDER[ordinal+delta];if(id)go(chapterIndex(id));}
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.defaultPrevented||contents||e.altKey||e.ctrlKey||e.metaKey||(e.target as HTMLElement)?.closest('input,select,textarea,[role="tablist"],.reader-sections,[contenteditable="true"]'))return;if(e.key==='ArrowRight'){e.preventDefault();adjacent(1);}if(e.key==='ArrowLeft'){e.preventDefault();adjacent(-1);}};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler);});
 const old=turn?READING_CHAPTERS[turn.from]:chapter;
 const matching=READING_CHAPTERS.filter(c=>readingMatches(c.id,query,c.title,c.terms));
 return <div className="reading-book library-reader" data-visible-page={side}>
  <header className="book-toolbar reader-toolbar" inert={contents}><button ref={catalogButton} onClick={()=>{setQuery('');setContents(!contents);}} aria-expanded={contents} aria-controls="reader-contents"><List size={16}/><span>六卷目录</span></button><span className="reader-volume-title">卷{volume.number} · {volume.title}</span><span className="reader-current-chapter"><small>第{String(ordinal+1).padStart(2,'0')}章</small><strong>{chapter.title}</strong></span><ReadingSections active={side==='left'?'principles':tab} onSelect={section=>{setSide(section==='principles'?'left':'right');if(section!=='principles')setTab(section);}}/><span className="reader-bookmark"><Bookmark size={12}/>书签留在本章</span></header>
  <div className="reader-desk" inert={contents}><nav className="reader-volume-rail" aria-label="六卷导航">{READING_VOLUMES.map(v=><button key={v.id} title={`卷${v.number} · ${v.title}`} aria-label={`卷${v.number}，${v.title}`} aria-current={v.id===volume.id?'page':undefined} onClick={()=>go(chapterIndex(v.chapters[0]))}><span>{v.number}</span><strong>{v.title}</strong></button>)}</nav>
   <div className="book-spread" ref={book} data-book-chapter={chapter.id} data-turning={turn?turn.direction===1?'forward':'backward':undefined}>
    <PrinciplesPage chapter={chapter} ordinal={ordinal}/><NotesPage chapter={chapter} ordinal={ordinal} tab={tab} onTab={setTab} onRelated={id=>go(chapterIndex(id))}/><div className="book-spine"/>
    {turn&&<div aria-hidden="true" inert className={`book-turn ${turn.direction===1?'forward':'backward'}`}><div className="book-leaf-front"><div className="book-page reader-turn-page"><p className="reader-eyebrow">泊灯书屋 · 阅读册</p><h2>{old.title}</h2><p>{old.example[0]}</p></div></div><div className="book-leaf-back"><div className="book-page reader-turn-page"><p className="reader-eyebrow">{chapter.subtitle}</p><h2>{chapter.title}</h2><p>{chapter.summary[0]}</p></div></div></div>}
   </div>
  </div>
  <footer className="book-pagination reader-pagination" inert={contents}><button disabled={ordinal===0||!!turn} onClick={()=>adjacent(-1)}><ArrowLeft size={16}/><span>上一章</span></button><span><b>{String(ordinal+1).padStart(2,'0')}</b> / {READING_CHAPTERS.length} 章 <span className="reader-page-range"><i>·</i> {ordinal*2+1}—{ordinal*2+2} 页</span></span><button disabled={ordinal===READING_ORDER.length-1||!!turn} onClick={()=>adjacent(1)}><span>下一章</span><ArrowRight size={16}/></button></footer>
  <span className="sr-only" role="status" aria-live="polite">卷{volume.number}，第{ordinal+1}章，{chapter.title}</span>
  {contents&&<nav ref={catalog} id="reader-contents" className="reader-contents" aria-label="阅读册目录" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeContents();}if(e.key==='Tab'){e.stopPropagation();const items=catalog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
   <header><div><p className="reader-eyebrow">泊灯书屋 / 藏书札记</p><h2>钱与日子的六卷书</h2><p>从一个问题开始，沿着线索慢慢读。</p></div><button onClick={closeContents} aria-label="合上目录"><X size={20}/></button></header>
   <label className="reader-search"><Search size={16}/><input ref={search} value={query} onChange={e=>setQuery(e.target.value)} placeholder="找一章，或一个概念：现金流、损失厌恶……" aria-label="检索章节和概念"/><span>{query?`${matching.length} 章`:'十八章'}</span></label>
   <div className="reader-volume-contents">{READING_VOLUMES.map(v=>{const ids=v.chapters.filter(id=>matching.some(c=>c.id===id));return ids.length>0&&<section key={v.id}><header><span>卷{v.number}</span><h3>{v.title}</h3><p>{v.intro}</p></header><ol>{ids.map(id=>{const c=READING_CHAPTERS[chapterIndex(id)],n=READING_ORDER.indexOf(id);return <li key={id}><button aria-current={chapter.id===id?'page':undefined} onClick={()=>go(chapterIndex(id))}><span>{String(n+1).padStart(2,'0')}</span><div><strong>{c.title}</strong><small>{c.subtitle}</small></div><span>{n*2+1}</span></button></li>;})}</ol></section>;})}</div>
   {matching.length===0&&<p className="reader-empty" role="status">书页里暂时没有这个词。可以试试“时间”“现金流”或“信任”。<button onClick={()=>setQuery('')}>回到完整目录</button></p>}
   <footer>六卷 · 十八章 · 十七项相关阅读材料<br/>正文、图解与例子为原创整理；原文短引以引号及斜体区分。书页内可直接阅读，无需离开澄港。</footer>
  </nav>}
 </div>;
}
