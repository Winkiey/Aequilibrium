// Public-information policy comparison. No hidden values or future outcomes are read.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const count=Number(process.argv[2]??500);
if(!Number.isInteger(count)||count<2||count>2000)throw new Error('Choose 2..2000 seeds.');
const out=path.resolve('.sites-runtime/market-benchmark');mkdirSync(out,{recursive:true});
for(const file of ['shop','shop-stories','engine','market','research','investment','stories','expansion','news']){
 const text=ts.transpileModule(readFileSync(`lib/game/${file}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 writeFileSync(path.join(out,file+'.mjs'),text.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'"));
}
const E=await import(pathToFileURL(path.join(out,'engine.mjs')).href);
const S=await import(pathToFileURL(path.join(out,'stories.mjs')).href);
const {companyNews}=await import(pathToFileURL(path.join(out,'news.mjs')).href);
function pick(game,policy){
 if(policy==='random')return game.assets[Math.floor(E.random(game.seed,game.quarter,'benchmark-pick')*6)].id;
 const score=asset=>{
  const c=companyNews(asset),initial=asset.disclosures?.[0]??c.current;
  const quotedGrowth=asset.price/initial.price-1,revenueGrowth=c.current.revenue/initial.revenue-1;
  return (policy==='informed'?(c.business?.notice.direction??0)*.6:0)+c.current.cashflow/c.current.revenue*4-c.current.debtRatio/100-Math.max(0,quotedGrowth-revenueGrowth)*1.8;
 };
 return [...game.assets].sort((a,b)=>score(b)-score(a))[0].id;
}
function play(seed,policy){
 let game=E.createGame(seed),held=null;
 while(!game.finished){
  const main=S.materialize(S.mainEvent(game),game),chapter=S.CHAPTER_EVENTS.find(e=>e.id===E.CHAPTER_QUARTERS[game.quarter]);
  const frozenChapter=chapter?S.materialize(chapter,game):null;
  if(held){const asset=game.assets.find(a=>a.id===held);game=E.trade(game,held,'sell',E.positionValue(asset));held=null;}
  game=E.choose(game,main,game.quarter===9?0:1,'main');
  if(frozenChapter)game=E.choose(game,frozenChapter,1,'chapter');
  if(policy!=='cash'){held=pick(game,policy);game=E.trade(game,held,'buy',10000);}
  game=E.endQuarter(game);
 }
 let exitAdjustment=0;
 if(held){const asset=game.assets.find(a=>a.id===held),value=E.positionValue(asset);exitAdjustment=E.quoteTrade({...game,finished:false,transactions:[]},held,'sell',value).total-value;}
 return E.investmentProfit(game)+exitAdjustment;
}
const rows=[];
for(let seed=1;seed<=count;seed++)rows.push({seed,informed:play(seed,'informed'),accountsOnly:play(seed,'accountsOnly'),random:play(seed,'random'),cash:play(seed,'cash')});
function describe(values){const mean=values.reduce((a,b)=>a+b,0)/values.length;return {mean:+mean.toFixed(2),min:+Math.min(...values).toFixed(2),max:+Math.max(...values).toFixed(2),positive:values.filter(v=>v>0).length};}
function paired(a,b){const values=rows.map(r=>r[a]-r[b]),mean=values.reduce((a,b)=>a+b,0)/count,variance=values.reduce((sum,v)=>sum+(v-mean)**2,0)/(count-1),margin=1.96*Math.sqrt(variance/count);return {mean:+mean.toFixed(2),approx95PercentInterval:[+(mean-margin).toFixed(2),+(mean+margin).toFixed(2)]};}
const result={sampleSize:count,method:'Seeds 1..N, same twelve-quarter story choices, no sides or borrowing. Each non-cash policy buys one company for 10000 each quarter, sells next quarter, and reserves a hypothetical net sale at the final quote. Real fees, slippage, received dividends and recorded research costs included. All policies pay the same quarter-nine research cost; the cash policy therefore has investment P/L of -700 under market v3. Public policy uses notice wording direction, published cash/revenue, debt and quote growth relative to disclosed revenue growth; accountsOnly omits notices. Synthetic benchmark, not a promise of player profit.',strategies:Object.fromEntries(['informed','accountsOnly','random','cash'].map(p=>[p,describe(rows.map(r=>r[p]))])),informedMinusRandom:paired('informed','random'),informedMinusAccountsOnly:paired('informed','accountsOnly')};
writeFileSync(path.join(out,'results.json'),JSON.stringify({...result,rows},null,2)+'\n');writeFileSync(path.join(out,'summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
