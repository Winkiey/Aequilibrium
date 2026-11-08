'use client';
import {useState} from 'react';
import { ending, type Game, type StoryEvent } from '@/lib/game/engine';
import { EPILOGUES, epilogueScript } from '@/lib/game/epilogues';
import { CinematicPlayer } from './CinematicPlayer';
import {filmForEnding,filmMedia} from '@/lib/game/films';
import {FilmPlayer} from './FilmPlayer';
export function EndingPlayer({game,name,recordedText,onFinish,speed,reducedMotion,preview=false,paused=false,sound=false,onSound,onAudioFocus}:{game:Game;name?:string;recordedText?:string;onFinish:()=>void;speed:number;reducedMotion:boolean;preview?:boolean;paused?:boolean;sound?:boolean;onSound?:()=>void;onAudioFocus?:(active:boolean)=>void}){
 const [textFallback,setTextFallback]=useState(false);
 const end=ending(game),title=name??end.name;
 const script=filmForEnding(title),media=script&&filmMedia(script.id);
 if(script&&media&&!textFallback)return <FilmPlayer media={media} script={script} sound={sound} onSound={onSound} onAudioFocus={onAudioFocus} paused={paused} reducedMotion={reducedMotion} onFinish={onFinish} onFallback={()=>setTextFallback(true)}/>;
 const event={id:`ending-${title}`,title,sender:'澄港，三年以后',atQuarter:EPILOGUES[title].quarter??game.quarter,paragraphs:[],options:[]} as unknown as StoryEvent;
 return <CinematicPlayer game={game} event={event} answered={null} speed={speed} reducedMotion={reducedMotion} preview={preview} paused={paused} epilogue scriptOverride={epilogueScript(game,title,recordedText)} onChoose={()=>false} onFinish={onFinish} onLedger={()=>{}} onProgress={()=>{}}/>;
}
