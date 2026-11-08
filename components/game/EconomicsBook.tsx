'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,List,Bookmark} from 'lucide-react';
import {READING_CHAPTERS,READING_SOURCES,type ReadingChapter} from '@/lib/game/reading';

function BookPage({chapter,side,index}:{chapter:ReadingChapter;side:'left'|'right';index:number}){
 return <article className={`book-page ${side}`} aria-label={`第${index*2+(side==='left'?1:2)}页`}>
  <header><span>泊灯书屋 · 经济学阅读册</span><span>{String(index+1).padStart(2,'0')}</span></header>
  {side==='left'?<><p className="book-section-label">编者梳理</p><h2>{chapter.title}</h2><h3>{chapter.subtitle}</h3>{chapter.summary.map(p=><p key={p}>{p}</p>)}<div className="book-terms">{chapter.terms.map(term=><span key={term}>{term}</span>)}</div></>:<><p className="book-section-label">读完，再想一想</p><h2>{chapter.exampleTitle}</h2>{chapter.example.map(p=><p key={p}>{p}</p>)}{chapter.quote&&<blockquote><em lang="en">“{chapter.quote.text}”</em><p>编者译：{chapter.quote.translation}</p><cite>{READING_SOURCES[chapter.quote.source].author} · {chapter.quote.locator}</cite></blockquote>}<aside className="book-question">{chapter.question}</aside><section className="book-bibliography"><h4>这一章的相关阅读</h4>{chapter.sources.map(id=>{const source=READING_SOURCES[id];return <p key={id}><strong>{source.author}</strong><cite>{source.title}</cite><span>{source.year} · {source.kind} · {source.note}</span></p>;})}</section></>}
  <footer>{index*2+(side==='left'?1:2)}</footer>
 </article>;
}

export default function EconomicsBook({page,onPage,reducedMotion}:{page:number;onPage:(page:number)=>void;reducedMotion:boolean}){
 const index=Math.max(0,Math.min(READING_CHAPTERS.length-1,page)),chapter=READING_CHAPTERS[index];
 const [contents,setContents]=useState(false),[turn,setTurn]=useState<{from:number;to:number;direction:1|-1}|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),book=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function go(to:number){if(turn||to<0||to>=READING_CHAPTERS.length||to===index)return;setContents(false);if(!reducedMotion){setTurn({from:index,to,direction:to>index?1:-1});timer.current=setTimeout(()=>setTurn(null),560);}onPage(to);}
 useEffect(()=>{for(const page of book.current?.querySelectorAll('.book-page')??[])page.scrollTop=0;},[index]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,select,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler);});
 return <div className="reading-book"><header className="book-toolbar"><button onClick={()=>setContents(!contents)} aria-expanded={contents}><List size={16}/>目录</button><span>关于钱，也关于日子</span><span><Bookmark size={13}/>自动夹好书签</span></header>
  <div className="book-editor-note">正文与例子由本作编者整理；仅斜体引号内为核实的原文短引。每章附作者、作品和篇章信息。</div>
  <div className="book-spread" ref={book} data-book-chapter={chapter.id}>
   <BookPage chapter={chapter} side="left" index={index}/><BookPage chapter={chapter} side="right" index={index}/><div className="book-spine"/>
   {turn&&<div aria-hidden="true" className={`book-turn ${turn.direction===1?'forward':'backward'}`}><div className="book-leaf-front"><BookPage chapter={READING_CHAPTERS[turn.from]} side={turn.direction===1?'right':'left'} index={turn.from}/></div><div className="book-leaf-back"><BookPage chapter={READING_CHAPTERS[turn.to]} side={turn.direction===1?'left':'right'} index={turn.to}/></div></div>}
  </div>
  <footer className="book-pagination"><button disabled={index===0||!!turn} onClick={()=>go(index-1)}><ArrowLeft size={16}/>上一章</button><span>第 {index*2+1}–{index*2+2} 页 / 共 {READING_CHAPTERS.length*2} 页</span><button disabled={index===READING_CHAPTERS.length-1||!!turn} onClick={()=>go(index+1)}>翻到下一章<ArrowRight size={16}/></button></footer>
  {contents&&<nav className="book-contents" aria-label="阅读册目录"><header><span>十二章 · 读到哪里，都可以停</span><button onClick={()=>setContents(false)}>合上目录</button></header>{READING_CHAPTERS.map((chapter,i)=><button key={chapter.id} aria-current={index===i?'page':undefined} onClick={()=>{if(i===index)setContents(false);else go(i);}}><span>{String(i+1).padStart(2,'0')}</span><strong>{chapter.title}</strong><small>{chapter.subtitle}</small></button>)}</nav>}
 </div>;
}
