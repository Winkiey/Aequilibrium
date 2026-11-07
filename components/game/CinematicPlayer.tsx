'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, X } from 'lucide-react';
import { Stage } from './Stage';
import { CAST, getScript, OBJECTS, outcomeBeats, outcomeScene } from '@/lib/game/visuals';
import { optionError, type Game, type StoryEvent } from '@/lib/game/engine';
import type { Beat, VisualScript } from '@/lib/game/cinematic-content';
import type { ReadingProgress } from '@/lib/game/presentation';

export function CinematicPlayer({game,event,answered,progress,speed=30,reducedMotion=false,paused=false,preview=false,previewBranch,epilogue=false,scriptOverride,onChoose,onFinish,onLedger,onProgress,onStep}:{game:Game;event:StoryEvent;answered:0|1|null;progress?:ReadingProgress;speed?:number;reducedMotion?:boolean;paused?:boolean;preview?:boolean;previewBranch?:0|1;epilogue?:boolean;scriptOverride?:VisualScript;onChoose:(i:0|1)=>boolean;onFinish:(reason:'complete'|'exit')=>void;onLedger:()=>void;onProgress:(p:ReadingProgress)=>void;onStep?:(step:'dialogue'|'decision')=>void}){
 const script=scriptOverride??getScript(event);
 const start=progress?.eventId===event.id?progress:undefined;
 const [phase,setPhase]=useState<ReadingProgress['phase']>(previewBranch!==undefined?'outcome':start?.phase==='choice'&&answered!==null?'outcome':start?.phase==='outcome'&&answered===null?'story':start?.phase??'story');
 const [index,setIndex]=useState(previewBranch!==undefined?0:start?.index??0),[choice,setChoice]=useState<0|1|null>(previewBranch??answered??start?.choice??null),[inspection,setInspection]=useState(false),[inspected,setInspected]=useState(start?.inspected??false),[transcript,setTranscript]=useState(false);
 const beats=useMemo(()=>phase==='outcome'?outcomeBeats(event,script,choice??0):script.beats,[phase,event,script,choice]);
 const safeIndex=Math.min(index,beats.length-1);
 const original=beats[safeIndex];
 const beat:Beat=inspection?{speaker:'narrator',text:script.interaction.line,camera:'detail',focus:script.interaction.object,emotion:'quiet'}:phase==='choice'?{speaker:'self',text:'你停了一会儿。接下来，想怎样答复？',camera:'medium'}:original;
 const chars=useMemo(()=>Array.from(beat.text),[beat.text]);
 const beatKey=`${event.id}-${phase}-${safeIndex}-${inspection}`;
 const [typing,setTyping]=useState({key:beatKey,count:0});
 const count=typing.key===beatKey?typing.count:0,complete=reducedMotion||count>=chars.length;
 useEffect(()=>{if(reducedMotion||paused||complete)return;const timer=setTimeout(()=>setTyping({key:beatKey,count:Math.min(count+1,chars.length)}),/[，。！？；]/u.test(chars[count-1]??'')?speed*5:speed);return()=>clearTimeout(timer);},[beatKey,count,chars,reducedMotion,speed,paused,complete]);
 useEffect(()=>{onProgress({eventId:event.id,phase,index:safeIndex,choice,inspected});},[event.id,phase,safeIndex,choice,inspected]);
 useEffect(()=>{onStep?.(phase==='choice'?'decision':'dialogue');},[phase]);
 function advance(){if(paused||transcript||phase==='choice')return;if(!complete){setTyping({key:beatKey,count:chars.length});return;}if(inspection){setInspection(false);return;}if(safeIndex<beats.length-1){setIndex(safeIndex+1);return;}if(phase==='outcome'||epilogue)onFinish('complete');else{if(answered!==null){setChoice(answered);setPhase('outcome');}else setPhase('choice');setIndex(0);}}
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(paused||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;if((e.target as HTMLElement)?.closest('input,button,select,textarea,a'))return;if(e.code==='Space'||e.code==='Enter'){e.preventDefault();advance();}if(e.code==='ArrowLeft'&&index>0){e.preventDefault();setIndex(index-1);}if(e.code==='Escape'){if(transcript)setTranscript(false);else onFinish('exit');}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);});
 const npc=beat.speaker!=='self'&&beat.speaker!=='narrator'?CAST[beat.speaker]:null;
 const location=phase==='outcome'?outcomeScene(event.id,choice??0,script.scene):script.scene;
 const focus=phase==='outcome'?(beat.focus??script.outcomeFocus[choice??0]):beat.focus;
 function select(i:0|1){if(preview||onChoose(i)){setChoice(i);setPhase('outcome');setIndex(0);setInspection(false);}}
 const actors=npc?[beat.speaker as keyof typeof CAST,...script.cast.filter(id=>id!==beat.speaker)]:script.cast;
 return <div className="cinematic-player" data-event={event.id} data-phase={phase} data-branch={phase==='outcome'?choice:undefined}>
  <Stage scene={location} cast={actors} speaker={beat.speaker} pose={beat.pose??(phase==='outcome'?choice===0?1:2:0)} camera={beat.camera} focus={focus} emotion={beat.emotion} showObject={beat.camera==='detail'||phase==='outcome'} shotId={`${event.id}:${phase}:${phase==='outcome'?choice:'intro'}:${safeIndex}`}>
   <button className="scene-advance-hit" aria-label={inspection?'收起物件，继续':complete?'下一句':'立即显示完整对白'} onClick={advance} disabled={phase==='choice'}/>
   <div className="cinema-letterbox top"/><div className="cinema-letterbox bottom"/>
   <header className="cinema-header"><button className="scene-tool" onClick={()=>onFinish('exit')}><ArrowLeft size={15}/>{preview?'返回分镜':epilogue?'查看复盘':'回到书店'}</button><span>{event.title}<small>{event.sender}</small></span><button className="scene-tool" onClick={()=>setTranscript(!transcript)}><BookOpen size={15}/>回看</button></header>
   {phase!=='choice'&&<button className={`story-object-hotspot ${!inspected?'undiscovered':''}`} style={{left:`${OBJECTS[script.interaction.object].point[0]}%`,top:`${OBJECTS[script.interaction.object].point[1]}%`}} onClick={()=>{setInspection(true);setInspected(true);}} aria-label={script.interaction.label}><i/><span>{script.interaction.label}{inspected&&<small>已查看</small>}</span></button>}
   {phase==='choice'?<div className="cinema-choices"><p className="choice-intro">这一次，你决定——</p>{event.options.map((option,i)=>{const error=preview?null:optionError(game,option);return <div key={i}><button disabled={!!error} onClick={()=>select(i as 0|1)} className="cinema-choice"><span className="choice-index">0{i+1}</span><span><strong>{option.label}</strong><small>{option.detail}</small></span><ArrowRight size={19}/></button>{error&&<p className="scene-choice-error">{error}</p>}</div>;})}<button className="choice-ledger-link" onClick={onLedger}>先看一眼账本<ArrowRight size={14}/></button></div>:<>
    <div key={`${beat.speaker}-${event.id}`} className={`cinema-dialogue ${npc?'character-dialogue':'narrator-dialogue'} ${beat.speaker==='self'?'inner-voice':''}`} style={npc?{'--speaker-accent':npc.accent} as React.CSSProperties:undefined}>
     <div className="speaker-label"><span>{npc?.name??(beat.speaker==='self'?'你':'旁白')}</span>{npc&&<small>{npc.role}</small>}{phase==='outcome'&&<em>选择之后</em>}</div>
     <p className="dialogue-line" aria-label={beat.text}><span className="dialogue-reserve" aria-hidden="true">{beat.text}</span><span className="dialogue-typed" aria-hidden="true">{complete?beat.text:chars.slice(0,count).join('')}{!complete&&<i className="typing-caret"/>}</span></p>
     <span className="sr-only" aria-live="polite">{beat.text}</span>
     <button className="dialogue-next" onClick={advance} aria-label={inspection?'收起物件':!complete?'显示完整句子':phase==='outcome'&&safeIndex===beats.length-1?'收好这一段往事':'下一句'}><span>{!complete?'点击显示全句':inspection?'收起物件':phase==='outcome'&&safeIndex===beats.length-1?'回到书店':'点击继续'}</span><ChevronRight size={15}/></button>
    </div>
    <div className="cinema-progress"><button disabled={safeIndex===0||inspection} onClick={()=>setIndex(Math.max(0,safeIndex-1))} aria-label="上一句"><ArrowLeft size={13}/></button><span>{String(safeIndex+1).padStart(2,'0')}<i/> {String(beats.length).padStart(2,'0')}</span><span className="keyboard-hint">SPACE / ENTER</span></div>
   </>}
   {preview&&<span className="preview-watermark">分镜预览 · 不写入游戏账目</span>}
  </Stage>
  {transcript&&<div className="transcript-overlay"><div><button className="scene-tool transcript-close" onClick={()=>setTranscript(false)}><X size={18}/>收起</button><p className="eyebrow">这一段对话</p><h2>{event.title}</h2>{beats.slice(0,safeIndex+1).map((b,i)=><article key={i}><span>{b.speaker==='self'?'你':b.speaker==='narrator'?'旁白':CAST[b.speaker].name}</span><p>{b.text}</p></article>)}</div></div>}
 </div>;
}
