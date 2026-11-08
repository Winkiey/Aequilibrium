import type {Beat} from './cinematic-content';
import {STORYBOARDS} from './cinematic-content';
import type {Game,StoryEvent} from './engine';
import {CAST_ENTRANCES,EVENT_CONTEXTS,MAIN_REVISED_BEATS} from './narrative-content';
import {historyEventId} from './people';
import {shortLines} from './dialogue';
const NARRATIVE_LINKS:Record<string,string[]>={
 'main-2':['main-1'],'main-3':['main-2'],'main-4':['main-3'],'main-5':['main-4'],
 'main-6':['main-1'],'main-7':['main-3'],'main-8':['chapter-2','main-2'],
 'main-9':['main-4'],'main-10':['main-6'],'main-11':['main-6'],'main-12':['main-11'],
 'chapter-2':['main-2'],'chapter-4':['main-4'],'chapter-7':['main-7'],'chapter-10':['main-10'],
};
export function previousAnswer(game:Game,event:StoryEvent){
 const cast=STORYBOARDS[event.id]?.cast??[],q=event.atQuarter??game.quarter;
 const past=game.history.filter(h=>h.quarter<=q&&historyEventId(h)!==event.id);
 for(const id of NARRATIVE_LINKS[event.id]??[]){const linked=[...past].reverse().find(h=>historyEventId(h)===id);if(linked)return linked;}
 return [...past].reverse().find(h=>{const id=historyEventId(h);return id&&STORYBOARDS[id]?.cast.some(c=>cast.includes(c));})??past.at(-1);
}
export function prepareNarrative(game:Game,event:StoryEvent,revision:number):StoryEvent{
 if(revision<2||event.opening||!STORYBOARDS[event.id])return event;
 const script=STORYBOARDS[event.id],context=EVENT_CONTEXTS[event.id],opening:Beat[]=[];
 const add=(text:string)=>{for(const line of shortLines(text))opening.push({speaker:'narrator',text:line,camera:'wide',emotion:'quiet'});};
 const previous=previousAnswer(game,event);
 if(previous)add(`上次在「${previous.title}」，你的答复是：${previous.choice}。`);
 if(!MAIN_REVISED_BEATS[event.id]){
  add(context.bridge);
  const met=new Set(game.history.flatMap(h=>{const id=historyEventId(h);return id?STORYBOARDS[id]?.cast??[]:[];}));
  for(const id of script.cast)if(!met.has(id))add(CAST_ENTRANCES[id].intro);
 }
 opening.push(...(MAIN_REVISED_BEATS[event.id]??script.beats).map(b=>({...b})));
 return{...event,opening};
}
export function currentThread(game:Game,event:StoryEvent){
 if(game.finished)return '十二季已经走完。可以回看三年，也能翻阅书柜留下的人与事。';
 const context=EVENT_CONTEXTS[event.id];
 if(game.mainChoice===null)return context?.question??'先听完这一季的来信，再给一个明确答复。';
 const due=game.promises.filter(p=>p.status==='pending'&&p.kind==='payment'&&p.due<=game.quarter);
 return due.length?`答复已经记下。本季还有${due.length}项付款到期，可以先翻账本核对。`:'答复已经记下。可以读另一件小事、安排资金，准备好再结束这一季。';
}
