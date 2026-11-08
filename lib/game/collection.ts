import { ending, normalizeEndingName, type Game, type StoryEvent } from './engine';
import { STORYBOARDS } from './cinematic-content';
import { EPILOGUES } from './epilogues';
import { historyEventId } from './people';
import { CHAPTER_EVENTS, mainEvent, materialize, SIDE_EVENTS } from './stories';
import type { ReadingProgress } from './presentation';

export const COLLECTION_KEY='aequilibrium.collection.v1';
export type StoryMemory={intro:StoryEvent;branches:Partial<Record<0|1,StoryEvent>>};
export type Collection={version:1;stories:Record<string,StoryMemory>;endings:Record<string,{text:string}>};
const owns=(object:object,key:string)=>Object.prototype.hasOwnProperty.call(object,key);
export function freshCollection():Collection{return{version:1,stories:{},endings:{}};}

// Replays keep the words that were actually encountered, never executable effects.
function copyEvent(e:StoryEvent):StoryEvent{return{id:e.id,title:e.title,sender:e.sender,location:e.location,category:e.category,principle:e.principle,atQuarter:e.atQuarter,paragraphs:[...e.paragraphs],options:e.options.map(o=>({label:o.label,detail:o.detail,response:o.response,effects:{}})) as StoryEvent['options']};}
function validEvent(value:unknown,id:string):value is StoryEvent{
 if(!value||typeof value!=='object')return false;const e=value as StoryEvent;
 return e.id===id&&(e.atQuarter===undefined||(Number.isInteger(e.atQuarter)&&e.atQuarter>=1&&e.atQuarter<=12))&&['title','sender','location','category','principle'].every(k=>typeof e[k as keyof StoryEvent]==='string')&&Array.isArray(e.paragraphs)&&e.paragraphs.every(p=>typeof p==='string')&&Array.isArray(e.options)&&e.options.length===2&&e.options.every(o=>o&&['label','detail','response'].every(k=>typeof o[k as keyof typeof o]==='string'));
}
export function readCollection(value:unknown):Collection{
 const result=freshCollection();if(!value||typeof value!=='object'||(value as Collection).version!==1)return result;
 const data=value as Collection;
 if(data.stories&&typeof data.stories==='object')for(const [id,m] of Object.entries(data.stories)){
  if(!owns(STORYBOARDS,id)||!m||!validEvent(m.intro,id))continue;
  const branches:StoryMemory['branches']={};for(const i of [0,1] as const)if(validEvent(m.branches?.[i],id))branches[i]=copyEvent(m.branches[i]!);
  result.stories[id]={intro:copyEvent(m.intro),branches};
 }
 if(data.endings&&typeof data.endings==='object')for(const [old,m] of Object.entries(data.endings)){const name=normalizeEndingName(old);if(owns(EPILOGUES,name)&&m&&typeof m.text==='string')result.endings[name]={text:m.text};}
 return result;
}
export function rememberIntro(collection:Collection,event:StoryEvent):Collection{
 if(!owns(STORYBOARDS,event.id))return collection;
 const existing=collection.stories[event.id];if(existing){if(existing.intro.atQuarter===undefined&&event.atQuarter!==undefined)return{...collection,stories:{...collection.stories,[event.id]:{...existing,intro:{...existing.intro,atQuarter:event.atQuarter}}}};return collection;}
 return{...collection,stories:{...collection.stories,[event.id]:{intro:copyEvent(event),branches:{}}}};
}
export function rememberChoice(collection:Collection,event:StoryEvent,branch:0|1):Collection{
 const next=rememberIntro(collection,event),memory=next.stories[event.id];if(!memory)return next;
 const existing=memory.branches[branch];if(existing){if(existing.atQuarter===undefined&&event.atQuarter!==undefined)return{...next,stories:{...next.stories,[event.id]:{...memory,branches:{...memory.branches,[branch]:{...existing,atQuarter:event.atQuarter}}}}};return next;}
 return{...next,stories:{...next.stories,[event.id]:{...memory,branches:{...memory.branches,[branch]:copyEvent(event)}}}};
}
export function mergeCollections(current:Collection,incoming:Collection):Collection{
 let next=current;for(const m of Object.values(incoming.stories)){next=rememberIntro(next,m.intro);for(const i of [0,1] as const)if(m.branches[i])next=rememberChoice(next,m.branches[i]!,i);}
 for(const [name,m] of Object.entries(incoming.endings))if(!next.endings[name])next={...next,endings:{...next.endings,[name]:{...m}}};return next;
}
export function recoverCollection(collection:Collection,game:Game,reading:ReadingProgress|null=null):Collection{
 let next=collection;
 for(const h of game.history){
  if(!Number.isInteger(h.quarter)||h.quarter<1||h.quarter>12)continue;
  const id=historyEventId(h);if(!id||!owns(STORYBOARDS,id))continue;
  let event=h.snapshot;
  if(!validEvent(event,id)){
   // Old saves did not keep a snapshot. Recover only the recorded answer, and
   // use its original response instead of inventing a second earned branch.
   const promises=game.promises.filter(p=>p.id!=='main-3-0');
   if(h.title==='再借我一个春天')promises.push({id:'main-3-0',label:'旧版记录',due:7,amount:0,status:'pending',kind:'receipt'});
   const state={...game,quarter:h.quarter,promises};
   const source=id.startsWith('main-')?mainEvent(state):[...CHAPTER_EVENTS,...SIDE_EVENTS].find(e=>e.id===id);if(!source||source.id!==id)continue;
   event={...materialize(source,state),title:h.title};
  }
  if(!event)continue;event={...event,atQuarter:event.atQuarter??h.quarter};const branch=h.optionIndex===0||h.optionIndex===1?h.optionIndex:event.options.findIndex(o=>o.label===h.choice);
  next=rememberIntro(next,event);
  if(branch===0||branch===1){const snapshot=copyEvent(event);snapshot.options[branch]={...snapshot.options[branch],label:h.choice,response:h.response};next=rememberChoice(next,snapshot,branch);}
 }
 // Finishing the opening dialogue unlocks that opening alone; merely receiving
 // a prepared event or looking at the collection never unlocks anything.
 if(reading&&reading.phase!=='story'){
  const event=[game.mainSnapshot,game.sideSnapshot,game.chapterSnapshot].find(e=>e?.id===reading.eventId);if(event)next=rememberIntro(next,event);
 }
 if(game.finished){const end=ending(game);if(!next.endings[end.name])next={...next,endings:{...next.endings,[end.name]:{text:end.text}}};}
 return next;
}
export function collectionReplay(collection:Collection,id:string,branch?:0|1):StoryEvent|undefined{
 const memory=collection.stories[id];return branch===undefined?memory?.intro:memory?.branches[branch];
}
export function collectionStats(collection:Collection){return{stories:Object.keys(collection.stories).length,branches:Object.values(collection.stories).reduce((n,m)=>n+Object.keys(m.branches).length,0),endings:Object.keys(collection.endings).length};}
