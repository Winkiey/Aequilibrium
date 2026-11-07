'use client';
import { ending, type Game, type StoryEvent } from '@/lib/game/engine';
import { epilogueScript } from '@/lib/game/epilogues';
import { CinematicPlayer } from './CinematicPlayer';
export function EndingPlayer({game,name,onFinish,speed,reducedMotion,preview=false,paused=false}:{game:Game;name?:string;onFinish:()=>void;speed:number;reducedMotion:boolean;preview?:boolean;paused?:boolean}){
 const end=ending(game),title=name??end.name;
 const event={id:`ending-${title}`,title:name??end.title,sender:'澄港，第三年夏末',paragraphs:[],options:[]} as unknown as StoryEvent;
 return <CinematicPlayer game={game} event={event} answered={null} speed={speed} reducedMotion={reducedMotion} preview={preview} paused={paused} epilogue scriptOverride={epilogueScript(game,title)} onChoose={()=>false} onFinish={onFinish} onLedger={()=>{}} onProgress={()=>{}}/>;
}
