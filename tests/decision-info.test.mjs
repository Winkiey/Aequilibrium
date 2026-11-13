import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionSections,researchOffer} from '../.sites-runtime/test-modules/decision-info.mjs';
import {decisionFacts} from '../.sites-runtime/test-modules/learning.mjs';
import {createGame,researchCompany,validateSave} from '../.sites-runtime/test-modules/engine.mjs';
import {CHAPTER_EVENTS,mainEvent,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {DecisionTerms} from '../.sites-runtime/test-modules/DecisionTerms.mjs';
import {ResearchOffer} from '../.sites-runtime/test-modules/ResearchOffer.mjs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
const {createElement}=await import(pathToFileURL(require.resolve('react')));
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')));
test('grouping preserves every existing fact across every option, including dates, liabilities and receipts',()=>{
 const game=createGame(8);let count=0;
 const main=Array.from({length:12},(_,index)=>mainEvent({...game,quarter:index+1}));
 for(const event of [...main,...CHAPTER_EVENTS,...SIDE_EVENTS])for(const option of event.options){
  const original=decisionFacts(option,game),grouped=decisionSections(option,game).flatMap(s=>s.facts);
  assert.deepEqual([...grouped].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),[...original].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),event.id);count++;
 }
 assert.equal(count,152);
});
test('current payment, deposit included in it, and future payment stay distinct without an invented combined amount',()=>{
 const option={label:'安排修屋',detail:'原条款',response:'',effects:{cash:-18000,shop:{deposit:12000},promises:[{kind:'payment',label:'后续工程',amount:24000,due:5}]}};
 const sections=decisionSections(option);assert.match(sections[0].facts[0].text,/18,000/);assert.match(sections[1].facts[0].text,/第5季.*24,000/);assert.match(sections[2].facts[0].text,/其中.*12,000/);
 const html=renderToStaticMarkup(createElement(DecisionTerms,{option}));assert.match(html,/眼前收支/);assert.match(html,/到期安排/);assert.doesNotMatch(html,/42,000|54,000/);
});
test('viewing research scope changes no state, discloses no unpaid contract result, and quotes the actual engine fee',()=>{
 const game=createGame(11),before=JSON.stringify(game),offer=researchOffer(game,'retail');
 assert.equal(JSON.stringify(game),before);assert.equal(offer.cost,300);assert.equal(offer.error,null);assert.ok(offer.limits.some(s=>s.includes('同店')));
 const changed=structuredClone(game);changed.assets.find(a=>a.id==='retail').business.terms.status='confirmed';changed.assets.find(a=>a.id==='retail').trueRevenue*=5;
 assert.deepEqual(researchOffer(changed,'retail'),offer,'unpaid terms and hidden fundamentals cannot leak through preview');
 const paid=researchCompany(game,'retail');assert.equal(game.cash-paid.cash,offer.cost);assert.equal(validateSave(paid),true);
 assert.equal(researchOffer(paid,'retail').cost,0);assert.equal(researchCompany(paid,'retail').cash,paid.cash);
});
test('cancel does not charge, confirm remains deliberate, and unavailable or insufficient purchases are disabled',()=>{
 const game=createGame(11),before=JSON.stringify(game);let confirmed=0,cancelled=0;
 const tree=ResearchOffer({game,asset:'harbor',onConfirm:()=>confirmed++,onCancel:()=>cancelled++});
 const find=(node,match)=>{if(!node||typeof node!=='object')return null;if(match(node))return node;return[node.props?.children].flat(Infinity).map(c=>find(c,match)).find(Boolean);};
 find(tree,n=>n.type==='button'&&n.props.className==='paper-back-link').props.onClick();assert.equal(cancelled,1);assert.equal(confirmed,0);assert.equal(JSON.stringify(game),before);
 find(tree,n=>n.type==='button'&&n.props.className==='ink-button').props.onClick();assert.equal(confirmed,1);
 game.cash=299;const poor=researchOffer(game,'harbor');assert.ok(poor.error);assert.match(renderToStaticMarkup(createElement(ResearchOffer,{game,asset:'harbor',onConfirm:()=>{},onCancel:()=>{}})),/disabled/);
 game.cash=10000;game.market.version=2;assert.ok(researchOffer(game,'harbor').error);game.market.version=3;game.finished=true;assert.ok(researchOffer(game,'harbor').error);
});
