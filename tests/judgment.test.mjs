import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,trade,endQuarter,pendingChapter,researchCompany,validateSave,investmentProfit,netWealth} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,CHAPTER_EVENTS,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {companyReturn,investmentSummary,orderImpact} from '../.sites-runtime/test-modules/investment.mjs';
import {companyNews} from '../.sites-runtime/test-modules/news.mjs';
import {decisionFacts} from '../.sites-runtime/test-modules/learning.mjs';
import {ResearchReceipt} from '../.sites-runtime/test-modules/ResearchReceipt.mjs';
import {InvestmentContribution,QuarterInvestmentReview} from '../.sites-runtime/test-modules/InvestmentContribution.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
function next(game){game=choose(game,materialize(mainEvent(game),game),game.quarter===9?0:1,'main');if(pendingChapter(game))game=choose(game,materialize(CHAPTER_EVENTS.find(e=>e.id===`chapter-${game.quarter}`),game),1,'chapter');return endQuarter(game);}
test('paid research returns dated source documents, charges once and never changes future luck',()=>{
 const base=createGame(64),before=structuredClone(base),paid=researchCompany(base,'harbor');
 assert.deepEqual(base,before);assert.equal(paid.cash,119700);assert.equal(paid.evidence.length,1);assert.equal(paid.evidence[0].terms.quarter,1);assert.ok(paid.evidence[0].facts.some(t=>t.includes('覆盖')));assert.ok(validateSave(paid));
 const again=researchCompany(paid,'harbor');assert.deepEqual(again,paid);assert.equal(paid.transactions.length,0);
 assert.deepEqual(next(base).assets,next(paid).assets);near(investmentProfit(paid),-300);
});
test('a researched choice reuses its exact file without charging for it again',()=>{
 let game=createGame(42);while(game.quarter<9)game=next(game);
 game=researchCompany(game,'harbor');const event=materialize(mainEvent(game),game),cash=game.cash;
 assert.match(decisionFacts(event.options[0],game)[0].text,/没有即时/);
 const after=choose(game,event,0,'main');assert.equal(after.cash,cash);assert.equal(after.evidence.filter(e=>e.asset==='harbor'&&e.quarter===9).length,1);assert.equal(after.history.at(-1).cash,0);assert.ok(validateSave(after));
});
test('story investigation delivers a file and recognizes the cost in investment exactly once',()=>{
 let game=createGame(20);while(game.quarter<9)game=next(game);
 const before=game.cash,profit=investmentProfit(game),event=materialize(mainEvent(game),game),after=choose(game,event,0,'main');
 assert.equal(after.cash,before-700);near(investmentProfit(after),profit-700);assert.equal(after.evidence.at(-1).eventId,'main-9');assert.equal(after.evidence.at(-1).cost,700);
 const summary=investmentSummary(after);near(summary.companies.reduce((n,c)=>n+c.total,0),summary.total);near(summary.wealth-summary.sameCashflowBaseline,summary.total);assert.ok(validateSave(JSON.parse(JSON.stringify(after))));
});
test('the previously released market finishes its current quarter exactly, then upgrades without rewriting prices',()=>{
 const fixture=JSON.parse(readFileSync('tests/fixtures/market-v2-transition.json','utf8'));
 assert.ok(validateSave(fixture.before));const game=endQuarter(fixture.before);
 assert.equal(game.market.version,3);assert.equal(game.market.upgradedQuarter,2);near(game.cash,fixture.after.cash);assert.deepEqual(game.transactions,fixture.after.transactions);assert.deepEqual(game.history,fixture.after.history);
 for(let i=0;i<6;i++){const {business,...asset}=game.assets[i],{business:old,...expected}=fixture.after.assets[i];assert.deepEqual(asset,expected);assert.deepEqual(business.outcomes,old.outcomes);assert.equal(business.capital,0);}
 assert.ok(validateSave(game));
});
test('dividend comes from positive operating cash and is deducted from the ex-dividend quote',()=>{
 let game=trade(createGame(17),'power','buy',10000);game=next(game);
 const a=game.assets.find(a=>a.id==='power'),result=a.business.outcomes.at(-1),payment=game.journal.find(j=>j.category==='dividend'&&j.asset==='power');
 assert.ok(result.dividendPerUnit>=0);near(a.price+result.dividendPerUnit,result.cumDividendPrice);if(payment)near(payment.amount,a.units*result.dividendPerUnit);
 const stressed=createGame(17);stressed.assets[1].cashflow=-5000;stressed.assets[1].debtRatio=90;const bad=next(stressed).assets[1];assert.equal(bad.business.outcomes.at(-1).dividendPerUnit,0);
});
test('contract conditions affect completion and only paid evidence discloses them before closing',()=>{
 const base=createGame(8),publicBefore=base.assets.map(companyNews),changed=structuredClone(base);
 changed.assets[0].business.terms.status=changed.assets[0].business.terms.status==='confirmed'?'unconfirmed':'confirmed';
 assert.deepEqual(changed.assets.map(companyNews),publicBefore);
 const record=researchCompany(changed,'harbor').evidence[0];assert.equal(record.terms.status,changed.assets[0].business.terms.status);
 const close=next(changed).assets[0].business.outcomes.at(-1);assert.match(close.fact,/覆盖/);assert.match(close.fact,/落实/);
});
test('closed-company performance counts dividends and research, not just sale price differences',()=>{
 let game=trade(createGame(11),'power','buy',1000);game.cash+=100;game.dividends+=100;game.journal.push({quarter:1,amount:100,label:'澄川能源 分红',category:'dividend'});
 const asset=game.assets[1];game=trade(game,asset.id,'sell',asset.units*asset.price);
 const c=companyReturn(game,game.assets[1]),summary=investmentSummary(game);
 assert.ok(c.priceOnly<0);assert.ok(c.total>0);assert.equal(summary.wins,1);assert.equal(summary.closed.length,1);near(c.total,investmentProfit(game));assert.ok(validateSave(game));
});
test('exposure uses actual fills and a hypothetical ten-percent move, with existing commitments retained',()=>{
 const game=createGame(54);game.promises.push({id:'due',label:'已接受付款',kind:'payment',status:'pending',amount:24000,due:2});
 const small=orderImpact(game,game.assets[0],'buy',5000),large=orderImpact(game,game.assets[0],'buy',60000);
 assert.ok(small.exposure<.05);assert.ok(large.exposure>.49);assert.equal(small.due,24000);assert.ok(large.tenPercentMove>small.tenPercentMove*11);assert.equal(game.cash,120000);
});
test('a document archive survives later quarters and malformed or unbacked charges are rejected',()=>{
 const researched=researchCompany(createGame(65),'retail'),copy=structuredClone(researched.evidence[0]),later=next(researched);
 assert.deepEqual(later.evidence[0],copy);assert.ok(validateSave(later));
 for(const change of [s=>s.evidence[0].quarter=13,s=>s.evidence[0].cost=999,s=>s.evidence[0].terms.coverage=999,s=>s.evidence.push({...s.evidence[0]})]){const broken=structuredClone(researched);change(broken);assert.equal(validateSave(broken),false);}
});
test('real paper views expose evidence limits, wealth attribution and quarter-specific outcomes',()=>{
 const paid=researchCompany(trade(createGame(31),'power','buy',10000),'power'),closed=next(paid);
 const evidence=renderToStaticMarkup(h(ResearchReceipt,{game:paid,asset:'power',onCompany(){}}));assert.match(evidence,/材料来源/);assert.match(evidence,/仍未确定/);assert.match(evidence,/不重复收费/);
 const attribution=renderToStaticMarkup(h(InvestmentContribution,{game:closed}));assert.match(attribution,/投资净贡献/);assert.match(attribution,/不计投资损益的收支基准/);assert.match(attribution,/没有模拟另一条人生/);
 const researchOnly=renderToStaticMarkup(h(InvestmentContribution,{game:researchCompany(createGame(31),'harbor')}));assert.match(researchOnly,/仅核验资料/);assert.doesNotMatch(researchOnly,/仍在持有/);
 const quarter=renderToStaticMarkup(h(QuarterInvestmentReview,{game:closed,quarter:1}));assert.match(quarter,/当时核验/);assert.match(quarter,/本季每份派息/);assert.match(quarter,/除息/);
 near(netWealth(closed)-investmentProfit(closed),investmentSummary(closed).sameCashflowBaseline);
});

test('a full cash order respects a cent budget after actual rounded fees',()=>{
 for(const seed of [1,12,77,486]){
  let game=trade(createGame(seed),'power','buy',1111.19);
  const asset=game.assets[1];game=trade(game,'power','sell',asset.units*asset.price);
  const remaining=game.cash;game=trade(game,'harbor','buy',remaining);
  assert.ok(game.cash>=0&&game.cash<=.02);assert.ok(validateSave(game));
 }
});

test('earlier retained deficits and excessive debt block a payout despite positive current cash',()=>{
 const debt=createGame(17);debt.assets[1].debtRatio=90;const a=next(debt).assets[1];assert.ok(a.cashflow>0);assert.equal(a.business.outcomes.at(-1).dividendPerUnit,0);
 const deficit=createGame(17);deficit.assets[1].business.capital=-100;const b=next(deficit).assets[1];assert.ok(b.cashflow>0);assert.equal(b.business.outcomes.at(-1).dividendPerUnit,0);
});
test('the telecom investigation supplies an archived file instead of only a verified flag',()=>{
 const game=createGame(19),event=materialize(SIDE_EVENTS.find(e=>e.id==='s23'),game);game.sideSnapshot=event;
 const paid=choose(game,event,0,'side');assert.equal(paid.evidence[0].asset,'signal');assert.equal(paid.evidence[0].cost,600);assert.ok(validateSave(paid));
});
