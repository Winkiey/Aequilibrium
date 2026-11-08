'use client';
import { ArrowRight, X } from 'lucide-react';
import { LESSON_COPY, LESSONS, lessonIndex, type Lesson } from '@/lib/game/tutorial';

export function LessonCoach({lesson,onAction,onSkip,detail,title,actionLabel}:{lesson:Lesson;onAction?:()=>void;onSkip:()=>void;detail?:string;title?:string;actionLabel?:string}){
  const copy=LESSON_COPY[lesson];
  return <aside className="lesson-coach" role="region" aria-label="手把手教学" data-lesson={lesson}>
    <div><span>初到澄港 · {lessonIndex(lesson)+1} / {LESSONS.length-1}</span><button onClick={onSkip} aria-label="跳过手把手教学"><X size={14}/></button></div>
    <h3>{title??copy.title}</h3><p>{detail??copy.text}</p>
    {(copy.action||actionLabel)&&onAction&&<button className="lesson-action" onClick={onAction}>{actionLabel??copy.action}<ArrowRight size={15}/></button>}
  </aside>;
}
