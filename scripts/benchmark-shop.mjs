import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const size=Number(process.argv[2]??200),source=path.resolve(process.argv[3]??'.');
if(!Number.isInteger(size)||size<2||size>2000)throw Error('Use 2..2000 seeds.');
const out=path.resolve('.sites-runtime/shop-benchmark');mkdirSync(out,{recursive:true});const sourceFingerprints={};
for(const name of ['engine','shop','shop-stories','market','research','investment','stories','expansion','news']){
 const file=path.join(source,'lib/game',name+'.ts');if(!existsSync(file))continue;
 const code=readFileSync(file,'utf8').replace(/\r\n/g,'\n');sourceFingerprints[name]=createHash('sha256').update(code).digest('hex');
 const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 writeFileSync(path.join(out,name+'.mjs'),js.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'"));
}
const E=await import(pathToFileURL(path.join(out,'engine.mjs')).href),S=await import(pathToFileURL(path.join(out,'stories.mjs')).href);
const modern=!!E.createGame(1).shop;
function play(seed,style){
 let game=E.createGame(seed);
 while(!game.finished){
  const q=game.quarter,main=S.materialize(S.mainEvent(game),game),c=S.CHAPTER_EVENTS.find(e=>e.id===E.CHAPTER_QUARTERS[q]),chapter=c?S.materialize(c,game):null;
  const offered=E.selectSide(game,S.SIDE_EVENTS),side=offered?S.materialize(offered,game):null;
  let choice=[0,0,1,1,0,0,1,1,0,1,0,1][q-1];
  if(style==='cautious'){if([2,5,6,11].includes(q))choice=1;}
  if(['staged','communityPatch'].includes(style)&&q===5)choice=1;
  if(style==='handover'&&[6,11].includes(q))choice=1;
  if(style==='late'&&[1,2,5].includes(q))choice=1;
  if(style==='cash')choice=q===9?0:1;
  if(E.optionError(game,main.options[choice]))choice=1-choice;
  game=E.choose(game,main,choice,'main');
  if(chapter)game=E.choose(game,chapter,['community','communityPatch'].includes(style)&&q===10?0:1,'chapter');
  if(side&&style!=='cash'){
   const score=o=>(o.effects.flags?.readers??0)*350+(o.effects.flags?.catalog??0)*220;
   const chosen=side.id==='s49'?(style==='staged'?0:1):['community','communityPatch'].includes(style)&&(score(side.options[0])>0||score(side.options[1])>0)?score(side.options[0])>=score(side.options[1])?0:1:null;
   if(chosen!==null&&!E.optionError(game,side.options[chosen]))game=E.choose(game,side,chosen,'side');
  }
  game=E.endQuarter(game);if(!E.validateSave(game))throw Error('Invalid save '+seed+'/'+style+'/'+q);
 }
 const periods=game.shop?.periods??[];
 return{wealth:E.netWealth(game),cash:game.cash,operatingCash:game.journal.filter(j=>j.category==='shop').reduce((s,j)=>s+j.amount,0),newOperatingProfit:periods.length?periods.reduce((s,p)=>s+p.profit,0):null,newCost:-game.journal.filter(j=>j.category==='shop-investment').reduce((s,j)=>s+j.amount,0),net:periods.length?periods.reduce((s,p)=>s+p.profit,0)+game.journal.filter(j=>['shop-investment','shop-receipt'].includes(j.category)).reduce((s,j)=>s+j.amount,0):null,positiveQuarters:periods.length?periods.filter(p=>p.profit>0).length:game.journal.filter(j=>j.category==='shop'&&j.amount>0).length,damage:periods.reduce((s,p)=>s+p.damage,0),depositsHeld:(game.shop?.deposits??[]).filter(d=>d.status==='held').reduce((s,d)=>s+d.amount,0),depositsReturned:(game.shop?.deposits??[]).reduce((s,d)=>s+(d.returned??0),0),ending:E.ending(game).name};
}
const rows=[];for(let seed=1;seed<=size;seed++){const row={seed};for(const style of ['full','staged','cautious','community','communityPatch','handover','late','cash']){try{row[style]=play(seed,style);}catch(error){throw new Error('Shop benchmark failed at seed '+seed+', policy '+style,{cause:error});}}rows.push(row);if(seed%10===0&&globalThis.gc)globalThis.gc();}
function stats(values){const sorted=[...values].sort((a,b)=>a-b);return{mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2),median:+sorted[Math.floor(sorted.length/2)].toFixed(2),min:+sorted[0].toFixed(2),max:+sorted.at(-1).toFixed(2),positive:values.filter(v=>v>0).length};}
const policies={};for(const style of ['full','staged','cautious','community','communityPatch','handover','late','cash']){policies[style]={};for(const key of ['wealth','operatingCash','net','positiveQuarters','damage','depositsHeld','depositsReturned'])if(rows[0][style][key]!==null)policies[style][key]=stats(rows.map(r=>r[style][key]));}
const result={modern,sampleSize:size,sourceFingerprints,method:'Seeds 1..N, twelve quarters, no trading or borrowing. Offers frozen at entry. Full: takeover/reading/full roof/renewal/upkeep. Staged: same but patch then complete the actually offered follow-up. Cautious: takeover, no reading event, patch, no renewal, handover, decline extra repair. Community: full path, prefer reader/catalogue choices only among actually offered daily events and choose shared keys. CommunityPatch: community choices but retain the partial repair. Handover: full roof then no renewal/upkeep. Late: caretaker then takeover at quarter six. Cash: no shop. Same non-shop main/chapter answers except the explicitly stated shared keys; actual costs and deposits are recorded. Operating cash and profit are distinct; returned deposits are not sales.',policies};
writeFileSync(path.join(out,modern?'summary-new.json':'summary-old.json'),JSON.stringify(result,null,2)+'\n');writeFileSync(path.join(out,modern?'results-new.json':'results-old.json'),JSON.stringify({...result,rows},null,2)+'\n');console.log(JSON.stringify({modern,sampleSize:size,policies},null,2));
