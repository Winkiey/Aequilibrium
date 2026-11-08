'use client';
import {useState} from 'react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { LESSON_COPY, lessonMilestone, type Lesson } from '@/lib/game/tutorial';

export function LessonCoach({lesson,onAction,onSkip,detail,title,actionLabel}:{lesson:Lesson;onAction?:()=>void;onSkip:()=>void;detail?:string;title?:string;actionLabel?:string}){
  const [folded,setFolded]=useState(false),copy=LESSON_COPY[lesson],step=lessonMilestone(lesson);
  return <aside className={`lesson-coach ${folded?'lesson-folded':''}`} role="region" aria-label="手把手教学" data-lesson={lesson}>
    <div><span>初到澄港 · {step.index+1} / {step.total} · {step.label}</span><button onClick={()=>setFolded(!folded)} aria-expanded={!folded} aria-label={folded?'展开当前指引':'折叠指引，保留教学进度'}>{folded?<ChevronDown size={15}/>:<ChevronUp size={15}/>}</button></div>
    <h3>{title??copy.title}</h3>
    {!folded&&<><p>{detail??copy.text}</p>{(copy.action||actionLabel)&&onAction&&<button className="lesson-action" onClick={onAction}>{actionLabel??copy.action}<ArrowRight size={15}/></button>}<button className="lesson-explore" onClick={onSkip}>我想自行探索</button></>}
    {folded&&<button className="lesson-unfold" onClick={()=>setFolded(false)}>展开，接着这一步<ChevronDown size={13}/></button>}
  </aside>;
}
