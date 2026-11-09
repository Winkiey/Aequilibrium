import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,endQuarter,validateSave,netWealth,random,CHAPTER_QUARTERS,selectSide} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,CHAPTER_EVENTS,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {shopDepositValue,shopOperatingResult,shopSummary,shopWealthContribution,closeShopTerm,openShopQuarter} from '../.sites-runtime/test-modules/shop.mjs';
import {getScript,outcomeBeats,hasAuthoredOutcome,outcomeScene} from '../.sites-runtime/test-modules/visuals.mjs';
import {ShopStatement,ShopContribution} from '../.sites-runtime/test-modules/ShopStatement.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.03,`${a} != ${b}`);
function answer(game,index){game=choose(game,materialize(mainEvent(game),game),index,'main');const id=CHAPTER_QUARTERS[game.quarter];if(id)game=choose(game,materialize(CHAPTER_EVENTS.find(c=>c.id===id),game),1,'chapter');return game;}
function at(q,roof=0,seed=73){let g=createGame(seed);while(g.quarter<q){g=answer(g,[0,0,1,1,roof,1,1,1,0,1,1,1][g.quarter-1]);g=endQuarter(g);}return g;}

test('takeover separates refundable principal from expense and never creates spendable cash',()=>{
 const game=createGame(73),paid=answer(game,0);assert.equal(game.cash,120000);assert.equal(paid.cash,102000);assert.equal(shopDepositValue(paid),12000);assert.equal(netWealth(paid),114000);assert.equal(shopSummary(paid).costs,6000);assert.ok(validateSave(paid));
 assert.throws(()=>choose(paid,materialize(mainEvent(paid),paid),0,'main'),/已经回复/);
});
test('renewal tops up the existing deposit instead of charging the total twice',()=>{
 let game=at(6);game=answer(game,0);const p=game.promises.find(p=>p.shopKind==='deposit');assert.equal(p.amount,3000);assert.equal(p.due,10);
 while(game.quarter<11){if(game.mainChoice===null)game=answer(game,game.quarter===9?0:1);game=endQuarter(game);}
 assert.equal(shopDepositValue(game),15000);assert.equal(game.shop.deposits.length,2);assert.ok(validateSave(game));
});
test('handover returns deposit principal without counting it as profit or changing wealth',()=>{
 let game=at(12);game=answer(game,1);const continuing=structuredClone(game);continuing.shop.plan='continue';
 const exit=endQuarter(game),stay=endQuarter(continuing);assert.equal(shopDepositValue(exit),0);assert.equal(shopDepositValue(stay),12000);near(exit.cash-stay.cash,12000);near(netWealth(exit),netWealth(stay));near(shopSummary(exit).total,shopSummary(stay).total);assert.ok(validateSave(exit));
});
test('selecting an unfunded roof job does not grant completed protection',()=>{
 let game=at(5),choice=answer(game,0),closed=endQuarter(choice);assert.equal(choice.shop.roof,'unrepaired');assert.equal(closed.shop.roof,'sound');assert.equal(closed.shop.periods.at(-1).roof,'unrepaired');assert.ok(validateSave(closed));
 game.journal.push({quarter:5,amount:1000-game.cash,label:'isolated cash stress fixture',category:'event'});game.cash=1000;
 const unfunded=endQuarter(answer(game,0));assert.equal(unfunded.shop.roof,'unrepaired');assert.ok(unfunded.promises.some(p=>p.shopKind==='repair'&&p.status==='missed'));assert.ok(validateSave(unfunded));
});
test('the same rain causes less book loss and interruption after actual repairs',()=>{
 let cases=0;for(let seed=1;seed<=30;seed++){const game=createGame(seed);game.flags.shop=1;game.quarter=6;game.shop.openedQuarter=1;const a=shopOperatingResult(game,random);if(!a.rain)continue;cases++;game.shop.roof='patched';const b=shopOperatingResult(game,random);game.shop.roof='sound';const c=shopOperatingResult(game,random);assert.ok(a.damage>b.damage&&b.damage>c.damage);assert.ok(a.lostSales>b.lostSales&&b.lostSales>c.lostSales);assert.ok(c.profit>b.profit&&b.profit>a.profit);assert.equal(c.damage,0);}assert.ok(cases>0);
});
test('the actual patched-roof follow-up offers both completion and a cash-preserving route',()=>{
 const game=at(6,1);assert.equal(game.shop.roof,'patched');const offered=selectSide(game,SIDE_EVENTS);assert.equal(offered.id,'s49');const e=materialize(offered,game);assert.equal(e.options[0].effects.cash,-17000);
 for(const i of [0,1]){const after=choose(game,e,i,'side');assert.equal(after.shop.roof,i===0?'sound':'patched');near(after.cash,game.cash-(i===0?17000:0));assert.ok(validateSave(after));const script=getScript(e),beats=outcomeBeats(e,script,i);assert.equal(beats.length,2);assert.ok(hasAuthoredOutcome(e,i));assert.equal(outcomeScene(e.id,i,script.scene,e),i===0?'bookshop-roof-sound':'bookshop-roof-patch');}
});
test('reviewed bookshop replies play once and unfamiliar older replies retain their own amounts',()=>{
 const game=at(5),event=materialize(mainEvent(game),game),script=getScript(event);
 for(const i of [0,1]){assert.ok(hasAuthoredOutcome(event,i));assert.equal(outcomeBeats(event,script,i).length,2);}
 const legacy=structuredClone(event);legacy.options[0].response='旧约定的维修费是3800元。';assert.equal(hasAuthoredOutcome(legacy,0),false);assert.match(outcomeBeats(legacy,getScript(legacy),0).map(b=>b.text).join(''),/3800/);
});
test('shared keys lower the real paid care expense instead of only adding a social flag',()=>{
 let game=at(10);game=choose(game,materialize(mainEvent(game),game),1,'main');const event=materialize(CHAPTER_EVENTS.find(e=>e.id==='chapter-10'),game),shared=choose(game,event,0,'chapter'),paid=choose(game,event,1,'chapter');assert.equal(shopOperatingResult(shared,random).care,500);assert.equal(shopOperatingResult(paid,random).care,800);assert.ok(validateSave(shared));
});
test('the actual previous engine closes an existing shop quarter identically before migrating',()=>{
 const {before,after}=JSON.parse(readFileSync('tests/fixtures/shop-legacy-quarter.json','utf8'));assert.ok(validateSave(before));const next=endQuarter(before),{shop,...rest}=next;assert.deepEqual(rest,after);assert.equal(shop.startedQuarter,5);assert.equal(shop.legacy,true);assert.equal(shopDepositValue(next),0);assert.ok(validateSave(next));
 const finished=JSON.parse(readFileSync('tests/fixtures/market-v2-transition.json','utf8')).before;assert.ok(validateSave(finished));
});
test('unbacked deposits, edited profit, duplicated quarters and invalid shop terms fail save validation',()=>{
 const game=endQuarter(answer(createGame(73),0));
 for(const mutate of [g=>g.shop.deposits[0].amount=17000,g=>g.shop.periods[0].profit+=100,g=>g.shop.periods.push({...g.shop.periods[0]}),g=>g.shop.roof='imaginary',g=>g.mainSnapshot.options[0].effects.shop.deposit=999999]){const copy=structuredClone(game);if(!copy.mainSnapshot)copy.mainSnapshot=materialize(mainEvent(copy),copy);if(!copy.mainSnapshot.options[0].effects.shop)copy.mainSnapshot.options[0].effects.shop={};mutate(copy);assert.equal(validateSave(copy),false);}
});
test('a dated shop file shows operating results, deposit principal and uncertain rain losses separately',()=>{
 const game=at(6,1),markup=renderToStaticMarkup(h(ShopStatement,{game,reducedMotion:true}));assert.match(markup,/选择书屋经营季度/);assert.match(markup,/可退押金/);assert.match(markup,/少卖/);assert.match(markup,/不再重复扣款/);assert.match(markup,/bookshop/);const report=renderToStaticMarkup(h(ShopContribution,{game}));assert.match(report,/本段经营净贡献/);assert.match(report,/不计作营业收入/);
});

test('only unpaid shop expenses can be applied directly against refundable deposit principal',()=>{
 let game=at(12);game=answer(game,1);game.debt.push({principal:4000,due:13,rate:0,source:'shop'},{principal:9000,due:13,rate:0});
 const wealth=netWealth(game),cash=game.cash;closeShopTerm(game,(g,amount,label,category,_asset,shopRef)=>{g.cash+=amount;g.journal.push({quarter:g.quarter,amount,label,category,shopRef});});
 assert.equal(game.cash-cash,8000);assert.equal(shopSummary(game).applied,4000);assert.equal(shopSummary(game).returned,8000);assert.equal(game.debt.length,1);assert.equal(game.debt[0].principal,9000);near(netWealth(game),wealth);assert.ok(validateSave(game));
});
test('a completed legacy game remains unchanged when another settlement is requested',()=>{
 let game=createGame(53);delete game.shop;while(!game.finished){game=answer(game,1);game=endQuarter(game);if(!game.finished)delete game.shop;}delete game.shop;
 const copy=structuredClone(game);assert.ok(validateSave(copy));assert.equal(openShopQuarter(copy),false);assert.deepEqual(copy,game);assert.throws(()=>endQuarter(copy),/请先回复/);assert.equal(copy.shop,undefined);
});
test('recorded shop terms and approved performances survive later seasons without being rewritten',()=>{
 const game=at(5),event=materialize(mainEvent(game),game),snapshot=JSON.stringify(event),paid=choose(game,event,1,'main'),next=endQuarter(paid);
 const prior=next.history.find(x=>x.eventId==='main-5');assert.ok(prior);assert.equal(JSON.stringify(event),snapshot);assert.equal(next.shop.roof,'patched');assert.ok(validateSave(next));
 const art=JSON.parse(readFileSync('docs/ASSET_MANIFEST.json','utf8'));const text=JSON.stringify(art);for(const id of ['bookshop-roof-sound','bookshop-roof-patch','bookshop-quarter-counter'])assert.ok(text.includes(id));
});

test('bookshop daily expenses and one-off book sales are included without changing original cash or dialogue',()=>{
 for(const [id,index,amount] of [['s07',0,-1200],['s09',0,-700],['s12',1,-260],['s43',0,-500],['s44',1,1200],['s52',1,-400],['s55',0,-260]]){
  const game=at(7),base=SIDE_EVENTS.find(e=>e.id===id),event=materialize(base,game),before=shopSummary(game),after=choose(game,event,index,'side'),summary=shopSummary(after);
  near(after.cash-game.cash,amount);near(summary.total-before.total,amount);assert.equal(event.options[index].response,base.options[index].response);assert.ok(validateSave(after));
 }
});

test('the final wealth breakdown includes bookshop investments once and does not mistake returned deposits for income',()=>{
 let game=at(12);game=endQuarter(answer(game,1));const cashBy=cat=>game.journal.filter(j=>j.category===cat).reduce((sum,j)=>sum+j.amount,0);
 const story=['event','promise','receipt'].reduce((sum,cat)=>sum+cashBy(cat),0); 
 near(netWealth(game),120000+cashBy('salary')+cashBy('living')+shopWealthContribution(game)+story);assert.ok(shopWealthContribution(game)<cashBy('shop'));assert.ok(validateSave(game));
});
