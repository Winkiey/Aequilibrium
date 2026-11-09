'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, X } from 'lucide-react';
import { warmScene } from '@/lib/game/assets';
import { Stage } from './Stage';
import { CAST, getScript, OBJECTS, OBJECT_INSPECTIONS, outcomeBeats, outcomeScene, resumeOutcome, OUTCOME_REVISION } from '@/lib/game/visuals';
import { optionError, type Game, type StoryEvent } from '@/lib/game/engine';
import type { Beat, VisualScript } from '@/lib/game/cinematic-content';
import {materialPlacement,SCENE_LAYOUTS,sceneFocusPoint} from '@/lib/game/composition';
import {EVENT_CONTEXTS} from '@/lib/game/narrative-content';
import {decisionFacts} from '@/lib/game/learning';
import {resolveStaging} from '@/lib/game/staging';
import type { ReadingProgress } from '@/lib/game/presentation';

export function CinematicPlayer({game,event,answered,progress,speed=30,reducedMotion=false,paused=false,preview=false,previewBranch,introOnly=false,epilogue=false,scriptOverride,guided=false,onChoose,onFinish,onLedger,onProgress,onStep}:{game:Game;event:StoryEvent;answered:0|1|null;progress?:ReadingProgress;speed?:number;reducedMotion?:boolean;paused?:boolean;preview?:boolean;previewBranch?:0|1;introOnly?:boolean;epilogue?:boolean;scriptOverride?:VisualScript;guided?:boolean;onChoose:(i:0|1)=>boolean;onFinish:(reason:'complete'|'exit')=>void;onLedger:()=>void;onProgress:(p:ReadingProgress)=>void;onStep?:(step:'dialogue'|'decision')=>void}){
 const [sceneReady,setSceneReady]=useState(false);
 const sourceScript=scriptOverride??getScript(event);
 const script=event.opening&&!scriptOverride?{...sourceScript,beats:event.opening}:sourceScript;
 const context=EVENT_CONTEXTS[event.id];
 const start=progress?.eventId===event.id?progress:undefined;
 const [phase,setPhase]=useState<ReadingProgress['phase']>(previewBranch!==undefined?'outcome':start?.phase==='choice'&&answered!==null?'outcome':start?.phase==='outcome'&&answered===null?'story':start?.phase??'story');
 const [restoredOutcome]=useState(()=>resumeOutcome(event,script,previewBranch??answered??start?.choice??0,start));
 const [legacyCompleted]=useState(()=>!preview&&phase==='outcome'&&restoredOutcome.finished);
 const [index,setIndex]=useState(previewBranch!==undefined?0:phase==='outcome'?restoredOutcome.index:start?.index??0),[choice,setChoice]=useState<0|1|null>(previewBranch??answered??start?.choice??null),[inspection,setInspection]=useState<NonNullable<Beat['focus']>|null>(null),[inspected,setInspected]=useState(start?.inspected??false),[transcript,setTranscript]=useState(false);
 const beats=useMemo(()=>phase==='outcome'?outcomeBeats(event,script,choice??0):script.beats,[phase,event,script,choice]);
 const safeIndex=Math.min(index,beats.length-1);
 const original=beats[safeIndex];
 const interest=original.focus??(phase==='outcome'?script.outcomeFocus[choice??0]:script.interaction.object);
 const beat:Beat=inspection?{speaker:'narrator',text:inspection===script.interaction.object&&phase!=='outcome'?script.interaction.line:OBJECT_INSPECTIONS[inspection],camera:'detail',focus:inspection,emotion:'quiet'}:phase==='choice'?{speaker:'self',text:'你停了一会儿。接下来，想怎样答复？',camera:'medium'}:original;
 const chars=useMemo(()=>Array.from(beat.text),[beat.text]);
 const beatKey=`${event.id}-${phase}-${safeIndex}-${inspection}`;
 const [typing,setTyping]=useState({key:beatKey,count:0});
 const count=typing.key===beatKey?typing.count:0,complete=!!inspection||reducedMotion||count>=chars.length;
 useEffect(()=>{if(reducedMotion||paused||!sceneReady||complete)return;const timer=setTimeout(()=>setTyping({key:beatKey,count:Math.min(count+1,chars.length)}),/[，。！？；]/u.test(chars[count-1]??'')?speed*5:speed);return()=>clearTimeout(timer);},[beatKey,count,chars,reducedMotion,speed,paused,sceneReady,complete]);
 useEffect(()=>{if(!legacyCompleted)onProgress({eventId:event.id,phase,index:safeIndex,choice,inspected,...(phase==='outcome'?{outcomeRevision:OUTCOME_REVISION}:{})});},[event.id,phase,safeIndex,choice,inspected,legacyCompleted]);
 useEffect(()=>{if(legacyCompleted)onFinish('complete');},[legacyCompleted]);
 useEffect(()=>{onStep?.(phase==='choice'?'decision':'dialogue');},[phase]);
 function advance(){if(paused||!sceneReady||transcript||phase==='choice')return;if(!complete){setTyping({key:beatKey,count:chars.length});return;}if(inspection){setInspection(null);return;}if(safeIndex<beats.length-1){setIndex(safeIndex+1);return;}if(phase==='outcome'||epilogue||introOnly)onFinish('complete');else{if(answered!==null){setChoice(answered);setPhase('outcome');}else setPhase('choice');setIndex(0);}}
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(paused||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;if((e.target as HTMLElement)?.closest('input,button,select,textarea,a,summary'))return;if(e.code==='Space'||e.code==='Enter'){e.preventDefault();advance();}if(e.code==='ArrowLeft'&&index>0){e.preventDefault();setIndex(index-1);}if(e.code==='Escape'){if(transcript)setTranscript(false);else onFinish('exit');}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);});
 const npc=beat.speaker!=='self'&&beat.speaker!=='narrator'?CAST[beat.speaker]:null;
 const location=phase==='outcome'?outcomeScene(event.id,choice??0,script.scene):script.scene;
 const focus=phase==='outcome'?(beat.focus??script.outcomeFocus[choice??0]):beat.focus;
 function select(i:0|1){if(introOnly)return;if(preview||onChoose(i)){setChoice(i);setPhase('outcome');setIndex(0);setInspection(null);}}
 const hotspotPoint=sceneFocusPoint(location,interest);
 const hasWorldObject=!!SCENE_LAYOUTS[location].painted[interest]||!!materialPlacement(location,interest);
 const inspectLabel=interest===script.interaction.object&&phase!=='outcome'?script.interaction.label:`查看${OBJECTS[interest].name}`;
 const direction=resolveStaging({eventId:event.id,phase,branch:choice??0,beat,index:safeIndex,script,scene:location});
 useEffect(()=>{if(phase==='choice'||(phase==='story'&&safeIndex>=script.beats.length-2)){for(const branch of [0,1] as const)warmScene(outcomeScene(event.id,branch,script.scene),script.cast);}},[event.id,phase,safeIndex,script]);
 const actors=direction.cast;
 if(legacyCompleted)return null;
 return <div className="cinematic-player" data-event={event.id} data-phase={phase} data-branch={phase==='outcome'?choice:undefined}>
  <Stage quarter={event.atQuarter??game.quarter} staging={direction} framing={SCENE_LAYOUTS[location].framing} sceneLayer={phase!=='choice'&&interest!=='window'&&hasWorldObject&&<button className={`story-object-hotspot ${!inspected?'undiscovered':''}`} style={{'--object-x':`${hotspotPoint[0]}%`,'--object-y':`${hotspotPoint[1]}%`} as React.CSSProperties} onClick={()=>{setInspection(value=>value?null:interest);setInspected(true);}} aria-label={inspectLabel}><i/><span>{inspectLabel}{inspected&&<small>已查看</small>}</span></button>} onReadyChange={setSceneReady} scene={location} cast={actors} speaker={beat.speaker} pose={beat.pose??(phase==='outcome'?choice===0?1:2:0)} camera={beat.camera} focus={focus} emotion={beat.emotion} showObject={beat.camera==='detail'||phase==='outcome'} shotId={`${event.id}:${phase}:${phase==='outcome'?choice:'intro'}:${safeIndex}`}>
   <button className="scene-advance-hit" aria-label={inspection?'收起物件，继续':complete?'下一句':'立即显示完整对白'} onClick={advance} disabled={phase==='choice'}/>
   <div className="cinema-letterbox top"/><div className="cinema-letterbox bottom"/>
   <header className="cinema-header"><button className="scene-tool" onClick={()=>onFinish('exit')}><ArrowLeft size={15}/>{preview?'返回往事':epilogue?'查看复盘':'回到书店'}</button><span>{event.title}<small>{event.sender}</small></span><div className="cinema-header-tools">{phase!=='choice'&&<button className="scene-tool" onClick={()=>{setInspection(value=>value?null:interest);setInspected(true);}} aria-label={inspectLabel}>{inspection?'收起物件':'查看物件'}</button>}<button className="scene-tool" onClick={()=>setTranscript(!transcript)}><BookOpen size={15}/>回看</button></div></header>

   {guided&&!transcript&&<p className="story-lesson-hint" role="status">{phase==='choice'?'选择一条答复。费用与之后的约定，都写在选项下面。':phase==='outcome'?'答复已记下。看完这一段，再回书屋核对现金。':complete?'读完这句，点“继续”。读完来信后，你会亲自答复。':'点一下显示完整句子，再点一下继续。'}</p>}
   {phase==='choice'?<div className="cinema-choices"><p className="choice-intro">{context?.question??'这一次，你决定——'}</p>{event.options.map((option,i)=>{const error=preview?null:optionError(game,option);return <div key={i}><button disabled={!!error} onClick={()=>select(i as 0|1)} className="cinema-choice"><span className="choice-index">0{i+1}</span><span><strong>{context&&!['main-5','main-6','main-7'].includes(event.id)?context.options[i].label:option.label}</strong><small>{context?.options[i].reason??option.detail}</small><span className="choice-cash-fact">{decisionFacts(option,game).map(f=><em key={f.label+f.text}>{f.label} · {f.text}</em>)}</span></span><ArrowRight size={19}/></button><details className="choice-clarification"><summary>问清条件 / 原始条款</summary><p>{option.label}：{option.detail}</p>{decisionFacts(option,game).map((f,n)=><p key={n}><b>{f.label}</b> {f.text}</p>)}</details>{error&&<p className="scene-choice-error">{error}</p>}</div>;})}<button className="choice-ledger-link" onClick={onLedger}>先看一眼账本<ArrowRight size={14}/></button></div>:<>
    <div key={`${beat.speaker}-${event.id}`} className={`cinema-dialogue ${npc?'character-dialogue':'narrator-dialogue'} ${beat.speaker==='self'?'inner-voice':''} dialogue-side-${direction.dialogueSide}`} style={npc?{'--speaker-accent':npc.accent} as React.CSSProperties:undefined}>
     <div className="speaker-label"><span>{npc?.name??(beat.speaker==='self'?'你':'旁白')}</span>{npc&&<small>{direction.channel==='letter'?'来信':direction.channel==='phone'?'远处的声音':npc.role}</small>}{phase==='outcome'&&<em>选择之后</em>}</div>
     <p className="dialogue-line" aria-label={beat.text}><span className="dialogue-reserve" aria-hidden="true">{beat.text}</span><span className="dialogue-typed" aria-hidden="true">{complete?beat.text:chars.slice(0,count).join('')}{!complete&&<i className="typing-caret"/>}</span></p>
     <span className="sr-only" aria-live="polite">{beat.text}</span>
     <button className="dialogue-next" disabled={paused||!sceneReady} onClick={advance} aria-label={inspection?'收起物件':!complete?'显示完整句子':safeIndex===beats.length-1&&(phase==='outcome'||introOnly||epilogue)?'收好这一段往事':'下一句'}><span>{!complete?'点击显示全句':inspection?'收起物件':safeIndex===beats.length-1&&(phase==='outcome'||introOnly||epilogue)?preview?'返回往事':epilogue?'查看复盘':guided?'回书屋，核对现金':'回到书店':guided&&safeIndex===beats.length-1?'看看两种答复':'点击继续'}</span><ChevronRight size={15}/></button>
    </div>
    <div className="cinema-progress"><button disabled={safeIndex===0||!!inspection} onClick={()=>setIndex(Math.max(0,safeIndex-1))} aria-label="上一句"><ArrowLeft size={13}/></button><span>{String(safeIndex+1).padStart(2,'0')}<i/> {String(beats.length).padStart(2,'0')}</span><span className="keyboard-hint">SPACE / ENTER</span></div>
   </>}
   {preview&&<span className="preview-watermark">往事回看 · 不改变当时的答复</span>}
  </Stage>
  {transcript&&<div className="transcript-overlay"><div><button className="scene-tool transcript-close" onClick={()=>setTranscript(false)}><X size={18}/>收起</button><p className="eyebrow">这一段对话</p><h2>{event.title}</h2>{(phase==='choice'?script.beats:beats.slice(0,safeIndex+1)).map((b,i)=><article key={i}><span>{b.speaker==='self'?'你':b.speaker==='narrator'?'旁白':CAST[b.speaker].name}</span><p>{b.text}</p></article>)}</div></div>}
 </div>;
}
