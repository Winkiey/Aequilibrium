// Same savings, story choices and principal. Source directory may point to an older checkout.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
const count=Number(process.argv[2]??200),sourceRoot=path.resolve(process.argv[3]??'.');
if(!Number.isInteger(count)||count<2||count>1000)throw new Error('Choose 2..1000 seeds.');
const out=path.resolve('.sites-runtime/wealth-benchmark'),modules=path.join(out,'modules');mkdirSync(modules,{recursive:true});
const sourceFingerprints={};
for(const file of ['engine','market','research','investment','stories','expansion','news']){
 const filePath=path.join(sourceRoot,'lib/game',file+'.ts');if(!existsSync(filePath))continue;
 const source=readFileSync(filePath,'utf8').replace(/\r\n/g,'\n');sourceFingerprints[file]=createHash('sha256').update(source).digest('hex');
 const text=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 writeFileSync(path.join(modules,file+'.mjs'),text.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'"));
}
const E=await import(pathToFileURL(path.join(modules,'engine.mjs')).href),S=await import(pathToFileURL(path.join(modules,'stories.mjs')).href),N=await import(pathToFileURL(path.join(modules,'news.mjs')).href);
const version=E.createGame(1).market.version;
function score(asset){const c=N.companyNews(asset),base=asset.disclosures[0];return(c.business?.notice.direction??0)*.6+c.current.cashflow/c.current.revenue*4-c.current.debtRatio/100-Math.max(0,asset.price/base.price-c.current.revenue/base.revenue)*1.8;}
function play(seed,budget,style){
 let game=E.createGame(seed);
 while(!game.finished){
  const main=S.materialize(S.mainEvent(game),game),source=S.CHAPTER_EVENTS.find(e=>e.id===E.CHAPTER_QUARTERS[game.quarter]),chapter=source?S.materialize(source,game):null;
  if(['rotate','random'].includes(style))for(const a of game.assets.filter(a=>a.units>0))game=E.trade(game,a.id,'sell',E.positionValue(a));
  game=E.choose(game,main,game.quarter===9?0:1,'main');if(chapter)game=E.choose(game,chapter,1,'chapter');
  if(style==='hold'&&game.quarter===1)game=E.trade(game,'power','buy',budget);
  if(style==='balanced'&&game.quarter===1){const third=Math.floor(budget/3*100)/100;for(const [i,id]of ['power','retail','harbor'].entries())game=E.trade(game,id,'buy',i===2?budget-third*2:third);}
  if(style==='rotate'||style==='random'){
   const id=style==='random'?game.assets[Math.floor(E.random(seed,game.quarter,'wealth-random')*6)].id:[...game.assets].sort((a,b)=>score(b)-score(a))[0].id;
   game=E.trade(game,id,'buy',budget);
  }
  game=E.endQuarter(game);if(!E.validateSave(game))throw new Error('Invalid simulated save.');
 }
 let exit=0;for(const a of game.assets.filter(a=>a.units>0))exit+=E.quoteTrade({...game,finished:false,transactions:[]},a.id,'sell',E.positionValue(a)).total-E.positionValue(a);
 return {wealth:E.netWealth(game)+exit,investment:E.investmentProfit(game)+exit,dividends:game.dividends,drawdown:game.drawdown};
}
function stats(values){const sorted=[...values].sort((a,b)=>a-b);return {mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2),median:+sorted[Math.floor(values.length/2)].toFixed(2),min:+sorted[0].toFixed(2),max:+sorted.at(-1).toFixed(2),positive:values.filter(v=>v>0).length};}
const cash=[];for(let seed=1;seed<=count;seed++)cash.push(play(seed,0,'cash'));
const allocations={},rows={};
for(const budget of [10000,30000,60000]){
 const samples=[];for(let seed=1;seed<=count;seed++){const row={seed};for(const style of ['hold','balanced','rotate','random'])row[style]=play(seed,budget,style);samples.push(row);}
 rows[budget]=samples;allocations[budget]=Object.fromEntries(['hold','balanced','rotate','random'].map(style=>[style,{wealth:stats(samples.map(r=>r[style].wealth)),investment:stats(samples.map(r=>r[style].investment)),differenceFromCash:stats(samples.map((r,i)=>r[style].wealth-cash[i].wealth)),meanDrawdown:+(samples.reduce((sum,r)=>sum+r[style].drawdown,0)/count*100).toFixed(2)}]));
}
const result={version,sampleSize:count,sourceFingerprints,method:'Seeds 1..N; initial 120000, same non-shop story and chapter answers, no daily events or borrowing. hold=energy only; balanced=energy/retail/cold-chain equal initial allocation; rotate=public notices, cash/revenue, debt and relative price growth; random=same quarterly frequency. Each budget is principal allocated, not borrowed; final net-sale costs included hypothetically. All story costs including quarter-nine research are paid in every policy. Wealth comparisons remain valid when expense classifications differ between source versions.',cash:stats(cash.map(r=>r.wealth)),allocations};
writeFileSync(path.join(out,`results-v${version}.json`),JSON.stringify({...result,rows},null,2)+'\n');writeFileSync(path.join(out,`summary-v${version}.json`),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({version,sampleSize:count,cash:result.cash,allocation60000:allocations[60000]},null,2));
