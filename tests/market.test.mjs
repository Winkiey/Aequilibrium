import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,trade,endQuarter,pendingChapter,validateSave} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,CHAPTER_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {publicBusiness} from '../.sites-runtime/test-modules/market.mjs';
import {companyNews} from '../.sites-runtime/test-modules/news.mjs';
import {BusinessBrief} from '../.sites-runtime/test-modules/BusinessBrief.mjs';

function legacy(game){const old=structuredClone(game);delete old.market;for(const asset of old.assets)delete asset.business;return old;}
function next(game){
 game=choose(game,materialize(mainEvent(game),game),game.quarter===9?0:1,'main');
 if(pendingChapter(game))game=choose(game,materialize(CHAPTER_EVENTS.find(e=>e.id===`chapter-${game.quarter}`),game),1,'chapter');
 return endQuarter(game);
}
test('all six entry notices survive serialization; viewing public news does not draw or change a result',()=>{
 const game=createGame(100),snapshot=structuredClone(game);
 assert.equal(game.market.version,3);
 for(const a of game.assets){const first=companyNews(a);assert.equal(first.business.notice.quarter,1);assert.ok(first.business.notice.fact&&first.business.notice.uncertainty);assert.deepEqual(companyNews(a),first);}
 assert.deepEqual(game,snapshot);assert.ok(validateSave(JSON.parse(JSON.stringify(game))));
 const privateChange=structuredClone(game);
 for(const a of privateChange.assets){a.trueRevenue=888888;a.trueCashflow=-9999;a.fundamental=999;a.business.referencePrice=1234;a.business.referenceRevenue=99999;}
 assert.deepEqual(privateChange.assets.map(companyNews),game.assets.map(companyNews));
});
test('revenue, operating cash and debt each change next valuation under identical external shocks',()=>{
 const base=createGame(123);base.mainChoice=1;const original=endQuarter(base).assets[1];
 for(const change of [a=>a.revenue*=1.5,a=>a.cashflow=-1000,a=>a.debtRatio=90]){
  const changed=structuredClone(base);change(changed.assets[1]);const result=endQuarter(changed).assets[1];
  assert.notEqual(result.fundamental,original.fundamental);assert.notEqual(result.price,original.price);
 }
});
test('the same announced matter drives its cash outcome, account disclosure and closing review',()=>{
 const base=createGame(83);base.mainChoice=1;
 const positive=structuredClone(base),negative=structuredClone(base);
 for(const [game,direction]of [[positive,1],[negative,-1]])game.assets[0].business.notice={...game.assets[0].business.notice,kind:'collection',direction};
 const good=endQuarter(positive).assets[0],bad=endQuarter(negative).assets[0];
 assert.ok(good.cashflow>bad.cashflow);assert.ok(good.fundamental>bad.fundamental);
 const result=publicBusiness(good).last;
 assert.equal(result.quarter,1);assert.equal(result.title,base.assets[0].business.notice.title);
 assert.equal(result.cashChange,Math.round((good.cashflow-base.assets[0].cashflow)*100)/100);
 assert.equal(good.disclosures.at(-1).cashflow,good.cashflow);
 assert.equal(publicBusiness(good).notice.quarter,2);
});
test('same seed and story answers reproduce quotes; own purchases do not move market paths',()=>{
 for(const seed of [1,13,99,217,829]){
  let a=createGame(seed),b=trade(createGame(seed),'power','buy',10000);
  while(!a.finished){a=next(a);b=next(b);assert.deepEqual(a.assets.map(x=>x.history),b.assets.map(x=>x.history));assert.ok(validateSave(a)&&validateSave(b));}
 }
});
test('old in-progress quarter uses its original market, then migrates without rewriting history or positions',()=>{
 const original=legacy(createGame(77));original.mainChoice=1;
 const before=structuredClone(original),result=endQuarter(original);
 const fixture=JSON.parse(readFileSync('tests/fixtures/legacy-market-77.json','utf8'));
 assert.deepEqual(original,before);assert.equal(result.market.startedQuarter,2);
 assert.equal(result.cash,fixture.cash);
 for(let i=0;i<6;i++){
  const {business,...asset}=result.assets[i];assert.deepEqual(asset,fixture.assets[i]);assert.equal(business.notice.quarter,2);assert.deepEqual(business.outcomes,[]);
 }
 assert.ok(validateSave(result));assert.equal(result.history.length,before.history.length);
 const terminal=legacy(createGame(77));terminal.quarter=12;terminal.mainChoice=1;
 const done=endQuarter(terminal);assert.equal(done.finished,true);assert.equal(done.market,undefined);
});
test('bookshop settlement and cycle remain exactly equal under new and legacy stock rules',()=>{
 for(const seed of [1,19,77,207,500]){
  let modern=createGame(seed),old=legacy(createGame(seed));
  for(const g of [modern,old])g.flags={shop:1,readers:2,catalog:1};
  while(!modern.finished){modern=next(modern);old=next(legacy(old));assert.equal(modern.regime,old.regime);assert.deepEqual(modern.journal.filter(j=>j.category==='shop'),old.journal.filter(j=>j.category==='shop'));}
 }
});
test('damaged or future-dated market data is rejected without invalidating genuine legacy saves',()=>{
 const game=createGame(31);assert.ok(validateSave(legacy(game)));
 for(const change of [s=>s.market.version=99,s=>s.assets[0].business.notice.quarter=13,s=>s.assets[0].business.referenceRevenue=0,s=>s.assets[0].business.outcomes=[{quarter:1}],s=>delete s.assets[0].business]){
  const broken=structuredClone(game);change(broken);assert.equal(validateSave(broken),false);
 }
});
test('the company brief distinguishes entry facts, unresolved conditions and the recorded close',()=>{
 const before=createGame(43),initial=renderToStaticMarkup(h(BusinessBrief,{asset:before.assets[0]}));
 assert.match(initial,/第1季初/);assert.match(initial,/还有什么不能确定/);assert.doesNotMatch(initial,/第1季核验/);
 const closed=next(before),html=renderToStaticMarkup(h(BusinessBrief,{asset:closed.assets[0]}));
 assert.match(html,/第2季初/);assert.match(html,/第1季核验/);assert.match(html,/公司整体/);assert.match(html,/经营现金变动/);
});
