// Development search only. Records ordinary legal actions from createGame(),
// never injects cash, flags, relationships, prices or future event results.
import{mkdirSync,writeFileSync,readFileSync}from'node:fs';
import{createGame,choose,trade,borrow,endQuarter,selectSide,optionError,quoteTrade,pendingChapter,ending,validateSave,netWealth}from'../.sites-runtime/test-modules/engine.mjs';
import{mainEvent,materialize,CHAPTER_EVENTS,SIDE_EVENTS}from'../.sites-runtime/test-modules/stories.mjs';
import{EPILOGUES}from'../.sites-runtime/test-modules/epilogues.mjs';

const wanted=Object.keys(EPILOGUES),found={};try{Object.assign(found,JSON.parse(readFileSync('tests/fixtures/ending-routes.json','utf8')).routes);}catch{}
// Revalidate previously recorded routes whenever the economics changes.
function replays(route){
 try{let s=createGame(route.seed),cache=null;
  for(const action of route.actions){
   if(cache?.quarter!==s.quarter){const picked=selectSide(s,SIDE_EVENTS);cache={quarter:s.quarter,main:materialize(mainEvent(s),s),side:picked?materialize(picked,s):null,chapter:CHAPTER_EVENTS.find(e=>e.id===`chapter-${s.quarter}`)};if(cache.chapter)cache.chapter=materialize(cache.chapter,s);}
   if(action.quarter!==s.quarter)return false;
   if(action.kind==='choice'){const event=[cache.main,cache.side,cache.chapter].find(e=>e?.id===action.id);if(!event||optionError(s,event.options[action.index]))return false;s=choose(s,event,action.index,event.id.startsWith('chapter-')?'chapter':event.id.startsWith('main-')?'main':'side');}
   else if(action.kind==='trade')s=trade(s,action.asset,action.side,action.amount);
   else if(action.kind==='borrow')s=borrow(s);
   else if(action.kind==='end')s=endQuarter(s);else return false;
   if(!validateSave(s))return false;
  }
  return s.finished&&ending(s).name===route.name;
 }catch{return false;}
}
for(const [name,route]of Object.entries(found))if(!replays(route)){delete found[name];console.log(`Rebuilding changed route: ${name}`);}
const targets={paper:'纸上春秋',family:'归途有约',coast:'潮声入梦',mutual:'同灯共守',ordinary:'寻常岁月',retire:'激流勇退',shop:'泊灯长明',community:'长桌人间',fraud:'铁窗四季',signal:'知止乘潮',harbor:'知止乘潮',urban:'知止乘潮',ruin:'余烬重燃',lonely:'独自抵达'};
const plans=['paper','family','coast','mutual','ordinary','retire','shop','community','fraud','signal','harbor','urban','ruin','lonely'];
const metrics={};
function play(seed,plan){
 let s=createGame(seed);const actions=[];
 const act=(kind,data,fn)=>{try{const next=fn();if(!validateSave(next))throw Error('Invalid route');s=next;actions.push({quarter:s.quarter,kind,...data});return true;}catch{return false;}};
 while(!s.finished){const quarter=s.quarter,main=materialize(mainEvent(s),s),picked=selectSide(s,SIDE_EVENTS),side=picked?materialize(picked,s):null,chapterSource=CHAPTER_EVENTS.find(e=>e.id===`chapter-${s.quarter}`),chapter=chapterSource?materialize(chapterSource,s):null;
  let index=1;if(['paper','family','coast','mutual','ordinary','community'].includes(plan)&&quarter===11)index=0;
  if(plan==='shop'&&[1,6,11].includes(quarter))index=0;
  if(plan==='community'&&[2,11,12].includes(quarter))index=0;
  if(plan==='fraud'&&quarter===10)index=0;
  if(plan==='retire'&&quarter===9)index=0;
  if(plan==='ruin')index=[1,3,4,6,7,9,11].includes(quarter)?0:1;
  if(plan==='lonely'){index=[1,4,5,6].includes(quarter)?0:1;if(quarter===5&&s.cash<4500){const a=s.assets.find(a=>a.id==='power');if(a.units>0){const amount=Math.min(a.units*a.price,(4500-s.cash)*1.1);act('trade',{asset:'power',side:'sell',amount},()=>trade(s,'power','sell',amount));}}}
  const required=Math.max(0,(main.options[index].effects.buy?.budget??0)-(main.options[index].effects.cash??0));
  if(s.cash<required)for(const a of s.assets.filter(a=>a.units>0).sort((a,b)=>b.units*b.price-a.units*a.price)){if(s.cash>=required)break;const amount=Math.min(a.units*a.price,(required-s.cash)*1.12+10);act('trade',{asset:a.id,side:'sell',amount},()=>trade(s,a.id,'sell',amount));}
  if(optionError(s,main.options[index]))index=1-index;if(optionError(s,main.options[index]))return null;
  act('choice',{id:main.id,index},()=>choose(s,main,index,'main'));
  if(chapter){let ci=(plan==='family'&&quarter===2)||(plan==='coast'&&quarter===4)||(plan==='paper'&&quarter===7)||(plan==='mutual'&&quarter===10)?0:1;if(optionError(s,chapter.options[ci]))ci=1-ci;act('choice',{id:chapter.id,index:ci},()=>choose(s,chapter,ci,'chapter'));}
  if(side){let si=1;
   if((plan==='paper'&&side.id==='s57')||(plan==='family'&&side.id==='s53')||(plan==='coast'&&side.id==='s54')||(plan==='mutual'&&['s56','s59'].includes(side.id)))si=0;
   if(plan==='community'&&(side.options[0].effects.flags?.community??0)>0)si=0;
   if(plan==='fraud'&&side.options[0].effects.fraud)si=0;
   if(plan==='ruin')si=side.options[0].effects.cash<0?0:1;
   if(plan==='lonely'){const promises=i=>(side.options[i].effects.promises??[]).filter(p=>p.kind==='payment').length;si=promises(0)>promises(1)?0:1;}
   if(plan==='retire'&&side.options[si].effects.buy)si=1-si;
   if(optionError(s,side.options[si]))si=1-si;if(!optionError(s,side.options[si]))act('choice',{id:side.id,index:si},()=>choose(s,side,si,'side'));
  }
  if(['signal','harbor','urban'].includes(plan)&&quarter===1){const amount=Math.max(0,s.cash-1000);act('trade',{asset:plan,side:'buy',amount},()=>trade(s,plan,'buy',amount));}
  if(plan==='ruin'){
   if(quarter<=8&&s.debt.length<2)act('borrow',{},()=>borrow(s));
   for(const a of s.assets.filter(a=>a.units>0))act('trade',{asset:a.id,side:'sell',amount:a.units*a.price},()=>trade(s,a.id,'sell',a.units*a.price));
   const asset='signal';if(s.cash>1)act('trade',{asset,side:'buy',amount:s.cash},()=>trade(s,asset,'buy',s.cash));
  }
  if(plan==='lonely'){if(quarter<=8&&s.debt.length<2)act('borrow',{},()=>borrow(s));if(s.cash>1)act('trade',{asset:'power',side:'buy',amount:s.cash},()=>trade(s,'power','buy',s.cash));}
  if(plan==='retire'&&quarter>=11)for(const a of s.assets.filter(a=>a.units>0))act('trade',{asset:a.id,side:'sell',amount:a.units*a.price},()=>trade(s,a.id,'sell',a.units*a.price));
  if(pendingChapter(s))return null;
  s=endQuarter(s);actions.push({quarter,kind:'end'});if(!validateSave(s))throw Error('Invalid settlement');
 }
 const m=metrics[plan]??{minWealth:Infinity,maxBroken:0};m.minWealth=Math.min(m.minWealth,netWealth(s));m.maxBroken=Math.max(m.maxBroken,s.promises.filter(p=>p.kind==='payment'&&p.status==='missed').length);metrics[plan]=m;
 return{seed,plan,name:ending(s).name,actions};
}
for(let seed=0;seed<1600&&Object.keys(found).length<wanted.length;seed++)for(const plan of plans){if(found[targets[plan]])continue;const route=play(seed,plan);if(route&&!found[route.name]){found[route.name]=route;console.log(`Found ${route.name}: seed ${seed}, ${plan}`);}}
mkdirSync('tests/fixtures',{recursive:true});writeFileSync('tests/fixtures/ending-routes.json',JSON.stringify({method:'Legal createGame/choose/trade/borrow/endQuarter actions; daily events selected by actual seeded selector before quarter choices.',routes:found},null,2)+'\n');
console.log(JSON.stringify({found:Object.keys(found),missing:wanted.filter(name=>!found[name]),metrics}));
if(wanted.some(name=>!found[name]))process.exitCode=1;
