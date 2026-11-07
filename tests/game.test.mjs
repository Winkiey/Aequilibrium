import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, trade, quoteTrade, choose, endQuarter, borrow, repay, selectSide, optionError, validateSave, investmentProfit, investments, ending, debtTotal } from '../.sites-runtime/test-modules/engine.mjs';
import { mainEvent, SIDE_EVENTS, materialize } from '../.sites-runtime/test-modules/stories.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<0.1,`${a} != ${b}`);
function decision(s,index=1){const e=mainEvent(s);const chosen=optionError(s,e.options[index])?1-index:index;return choose(s,e,chosen,'main');}
function next(s,index=1){return endQuarter(decision(s,index));}
function balance(s){near(s.cash,s.journal.reduce((n,e)=>n+e.amount,0));assert.ok(validateSave(s),'state remains valid');assert.ok(s.assets.every(a=>a.units>=0&&a.basis>=0&&a.price>0));}
test('64 independent event nodes, two choices each, no bereavement premise',()=>{
 assert.equal(SIDE_EVENTS.length,52);const ids=SIDE_EVENTS.map(e=>e.id);let s=createGame(1);
 for(let q=1;q<=12;q++){s.quarter=q;ids.push(mainEvent(s).id);assert.equal(mainEvent(s).options.length,2);}
 assert.equal(new Set(ids).size,64);assert.ok(SIDE_EVENTS.every(e=>e.options.length===2&&e.paragraphs.join('').length>30));
 const source=readFileSync('lib/game/stories.ts','utf8');assert.doesNotMatch(source,/父亲去世|父亲留下|父亲年轻|父亲的遗/);
});
test('buy / sell charges actual fees and keeps cash and basis consistent',()=>{
 let s=createGame(12),q=quoteTrade(s,'harbor','buy',10000);s=trade(s,'harbor','buy',10000);near(s.cash,110000);assert.ok(q.fee>0&&q.impact>0);balance(s);
 s=trade(s,'harbor','sell',s.assets[0].units*s.assets[0].price);assert.ok(s.cash<120000);near(s.assets[0].units,0);near(investmentProfit(s),s.cash-120000);balance(s);
});
test('quotes reject invalid sizes and enforce the three-adjustment limit',()=>{
 let s=createGame(2);for(const amount of [0,-1,NaN,Infinity,200000])assert.throws(()=>quoteTrade(s,'harbor','buy',amount));
 for(let i=0;i<3;i++)s=trade(s,'harbor','buy',1000);assert.throws(()=>trade(s,'harbor','buy',1000),/三次/);
});
test('a reply is atomic and cannot charge twice',()=>{
 const original=createGame(23),e=mainEvent(original),s=choose(original,e,0,'main');assert.equal(original.cash,120000);assert.equal(s.cash,102000);assert.throws(()=>choose(s,e,0,'main'));assert.throws(()=>endQuarter(original));balance(s);
});
test('four-quarter loan: equal cash and debt on origination, four interest payments',()=>{
 let s=borrow(createGame(4));assert.equal(s.cash,140000);assert.equal(debtTotal(s),20000);for(let i=0;i<4;i++)s=next(s);
 near(s.journal.filter(e=>e.category==='interest').reduce((n,e)=>n+e.amount,0),-1600);assert.equal(debtTotal(s),0);balance(s);
});
test('early repayment reduces principal without inventing wealth',()=>{
 const s=repay(borrow(createGame(5)));assert.equal(s.cash,120000);assert.equal(debtTotal(s),0);balance(s);
});
test('loan expiry sells available assets before leaving arrears',()=>{
 let s=borrow(createGame(90));s=trade(s,'power','buy',138000);for(let i=0;i<4;i++)s=next(s);
 assert.ok(s.transactions.some(t=>s.journal.some(e=>e.category==='forced')));assert.equal(debtTotal(s),0);balance(s);
});
test('promise amendments cancel the old payment instead of charging both',()=>{
 let s=createGame(61);s=decision(s,0);s=endQuarter(s);s=next(s);s=next(s);s=next(s);assert.equal(s.quarter,5);
 s=choose(s,mainEvent(s),1,'main');s=endQuarter(s);assert.equal(s.promises.find(p=>p.id==='main-4-0').status,'cancelled');assert.equal(s.promises.find(p=>p.id==='main-5-0').status,'paid');
 near(s.journal.filter(e=>e.category==='promise').reduce((n,e)=>n+e.amount,0),-9000);balance(s);
});
test('print-shop settlement removes the full claim and receives only the agreed cash',()=>{
 let s=createGame(55);s=next(s);s=next(s);s=next(s,0);while(s.quarter<7)s=next(s);
 const before=s.cash;s=choose(s,mainEvent(s),1,'main');assert.equal(s.cash,before+6000);assert.equal(s.promises.find(p=>p.id==='main-3-0').status,'cancelled');const after=endQuarter(s);assert.ok(!after.journal.some(e=>e.label==='印坊借款回收'));balance(after);
});
test('event-relative deadlines resolve before choice and do not expose future facts',()=>{
 const s=createGame(8);s.quarter=3;const event=materialize(SIDE_EVENTS.find(e=>e.id==='s16'),s);assert.equal(event.options[0].effects.promises[0].due,5);
 assert.equal(SIDE_EVENTS.find(e=>e.id==='s16').options[0].effects.promises[0].due,-2);assert.ok(!JSON.stringify(event).includes('trueRevenue'));
});
test('same seed and orders reproduce prices, reading and feelings do not change prices',()=>{
 let a=createGame(13),b=createGame(13);b.stress=99;b.confidence=99;for(let i=0;i<12;i++){mainEvent(a);mainEvent(a);a=next(a);b=next(b);assert.deepEqual(a.assets.map(x=>x.price),b.assets.map(x=>x.price));}
});
test('malformed save rejected; serialization round-trip preserves a valid game',()=>{
 const s=next(createGame(6));assert.ok(validateSave(JSON.parse(JSON.stringify(s))));const damaged=structuredClone(s);damaged.cash+=5000;assert.equal(validateSave(damaged),false);assert.equal(validateSave({version:1}),false);
});
test('displayed letter survives its own choice and clears only at the next season',()=>{
 let s=createGame(42);s.quarter=6;s.mainSnapshot=materialize(mainEvent(s),s);const original=JSON.stringify(s.mainSnapshot);
 s=choose(s,s.mainSnapshot,0,'main');assert.equal(s.flags.shop,1);assert.equal(JSON.stringify(s.mainSnapshot),original);s=endQuarter(s);assert.equal(s.mainSnapshot,undefined);balance(s);
});
test('low-cash shop expenses leave explicit arrears instead of negative money',()=>{
 let arrears=0;for(let seed=0;seed<30;seed++){let s=createGame(seed);s.cash=0;s.journal[0].amount=0;s.flags.shop=1;s.mainChoice=1;s=endQuarter(s);if(s.debt.length)arrears++;balance(s);assert.ok(s.cash>=0);}assert.ok(arrears>0);
});
test('ordinary losses never imply imprisonment, explicit misconduct requires a chain',()=>{
 const s=createGame(17);s.cash=0;assert.notEqual(ending(s).name,'执念入狱');s.flags.fraud=3;s.investigation=2;assert.notEqual(ending(s).name,'执念入狱');s.investigation=3;assert.equal(ending(s).name,'执念入狱');
});
test('500 full playthroughs preserve money, nonnegative positions and finish in 12 seasons',()=>{
 for(let seed=0;seed<100;seed++)for(const strategy of ['cash','diversified','churn','leveraged','random']){
  let s=createGame(seed);if(strategy==='leveraged')s=borrow(s);
  while(!s.finished){
   const side=selectSide(s,SIDE_EVENTS);s=decision(s,strategy==='random'?seed%2:1);
   if(side){const e=materialize(side,s);const prefer=(seed+s.quarter)%2;const index=optionError(s,e.options[prefer])?1-prefer:prefer;if(!optionError(s,e.options[index]))s=choose(s,e,index,'side');}
   if(strategy==='diversified'&&s.quarter===1)for(const id of ['power','retail','medical']){try{s=trade(s,id,'buy',12000);}catch{}}
   if((strategy==='leveraged'||strategy==='churn')&&s.quarter<10){try{if(s.assets[0].units)s=trade(s,'harbor','sell',s.assets[0].units*s.assets[0].price);s=trade(s,'harbor','buy',Math.max(1,s.cash-500));}catch{}}
   s=endQuarter(s);balance(s);
  }
  assert.equal(s.quarter,12);assert.equal(s.quarters.length,12);assert.ok(ending(s).title);
 }
});
