import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';

// Read source, not browser storage. All generated files stay in ignored runtime output.
const repo=process.cwd();
const sampleSize=Number(process.argv[2]??1000);
if(!Number.isInteger(sampleSize)||sampleSize<1||sampleSize>10000)throw new Error('Provide a seed count between 1 and 10000.');
const out=path.resolve('.sites-runtime/mechanics-audit');
mkdirSync(out,{recursive:true});
const sourceFingerprints={};
function source(file){
 const text=readFileSync(path.join(repo,file),'utf8').replace(/\r\n/g,'\n');
 sourceFingerprints[file]=createHash('sha256').update(text).digest('hex');
 return text;
}
for(const file of ['engine','stories','expansion','news']){
 const result=ts.transpileModule(source(`lib/game/${file}.ts`),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
 writeFileSync(path.join(out,`${file}.mjs`),result.outputText.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'"));
}
source('components/game/CinematicGame.tsx');
const E=await import(pathToFileURL(path.join(out,'engine.mjs')).href);
const S=await import(pathToFileURL(path.join(out,'stories.mjs')).href);
const shopRoute=[0,0,1,1,0,0,1,1,0,1,0,1];

function finishQuarter(state,mainIndex,sideGrowth){
 // Match CinematicGame.prepare(): freeze all three offers at quarter entry,
 // before the main/chapter answer can change eligibility or draw weights.
 const main=S.materialize(S.mainEvent(state),state);
 const chapter=S.CHAPTER_EVENTS.find(e=>e.id===E.CHAPTER_QUARTERS[state.quarter]);
 const frozenChapter=chapter?S.materialize(chapter,state):null;
 const side=sideGrowth?E.selectSide(state,S.SIDE_EVENTS):null;
 const frozenSide=side?S.materialize(side,state):null;
 if(E.optionError(state,main.options[mainIndex]))mainIndex=1-mainIndex;
 let next=E.choose(state,main,mainIndex,'main');
 if(E.pendingChapter(next))next=E.choose(next,frozenChapter,1,'chapter');
 if(frozenSide){
  const score=option=>(option.effects.flags?.readers??0)*350+(option.effects.flags?.catalog??0)*220;
  const index=score(frozenSide.options[0])>score(frozenSide.options[1])?0:1;
  if(!E.optionError(next,frozenSide.options[index]))next=E.choose(next,frozenSide,index,'side');
 }
 return E.endQuarter(next);
}
function play(seed,{shop=false,growth=false,buy=false}={}){
 let game=E.createGame(seed);
 if(buy)game=E.trade(game,'power','buy',10000);
 while(!game.finished)game=finishQuarter(game,shop?shopRoute[game.quarter-1]:1,growth);
 if(!E.validateSave(game))throw new Error(`Simulation produced invalid state for seed ${seed}.`);
 return game;
}
function summarize(values){
 const sorted=[...values].sort((a,b)=>a-b);
 return {min:sorted[0],median:sorted[Math.floor(sorted.length/2)],max:sorted.at(-1),mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2),positive:values.filter(value=>value>0).length};
}
const rows=[];
let priceMismatch=0;
for(let seed=1;seed<=sampleSize;seed++){
 const base=play(seed),bought=play(seed,{buy:true}),shop=play(seed,{shop:true}),growth=play(seed,{shop:true,growth:true});
 const answers=game=>game.history.map(h=>[h.eventId,h.optionIndex]);
 if(JSON.stringify(answers(base))!==JSON.stringify(answers(bought)))throw new Error('Price comparison must use the same story answers.');
 if(JSON.stringify(base.assets.map(a=>a.history))!==JSON.stringify(bought.assets.map(a=>a.history)))priceMismatch++;
 const operating=game=>game.journal.filter(j=>j.category==='shop').reduce((sum,j)=>sum+j.amount,0);
 rows.push({seed,shopNet:operating(shop),growthNet:operating(growth),growthProfitableQuarters:growth.journal.filter(j=>j.category==='shop'&&j.amount>0).length,readers:growth.flags.readers??0,catalog:growth.flags.catalog??0});
}
// A deliberately synthetic, isolated intervention probes a dependency, not a playable save.
const baseline=E.createGame(123);baseline.mainChoice=1;
const finance=structuredClone(baseline);
for(const asset of finance.assets){asset.revenue*=10;asset.cashflow=-100000;asset.debtRatio=95;asset.trueRevenue*=10;asset.trueCashflow=-100000;}
const original=E.endQuarter(baseline),changed=E.endQuarter(finance);
const result={
 auditVersion:2,sampleSize,sourceFingerprints,
 method:{seeds:'1..N',shopMainOptionIndices:shopRoute,chapterOptionIndex:1,sideDraw:'Frozen at quarter entry, matching CinematicGame.prepare()',sidePolicy:'Only the actually drawn side offer; prefer readers*350 + catalog*220; ties use option 1; skip if unaffordable.',scope:'Operating shop journal only; excludes initial takeover, activity investment, roof, renewal deposit and terminal upkeep. Not an optimal-policy search or total wealth.',priceComparison:'Identical main/chapter answers, no sides; add one 10000 power buy at entry.'},
 pricePathMismatchesAfterPlayerBuy:priceMismatch,
 shopRouteOperatingOnly:summarize(rows.map(row=>row.shopNet)),
 shopGrowthOperatingOnly:summarize(rows.map(row=>row.growthNet)),
 growthProfitableQuarters:summarize(rows.map(row=>row.growthProfitableQuarters)),
 financialCounterexample:{sameNextPrices:original.assets.every((asset,index)=>asset.price===changed.assets[index].price),original:original.assets.map(a=>a.price),changedAccounts:changed.assets.map(a=>a.price),description:'Isolated intervention: revenue x10, operating cashflow deeply negative, debt ratio 95%; same seed/regime/price/fundamental.'}
};
writeFileSync(path.join(out,'results.json'),JSON.stringify({...result,rows},null,2)+'\n');
writeFileSync(path.join(out,'summary.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
