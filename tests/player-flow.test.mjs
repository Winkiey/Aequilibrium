import test from 'node:test';
import assert from 'node:assert/strict';
import {readingKey,sideInvitation} from '../.sites-runtime/test-modules/reading-controls.mjs';
import {freshPresentation,restartPresentation,validPresentation,motionPreferences} from '../.sites-runtime/test-modules/presentation.mjs';
import {createGame} from '../.sites-runtime/test-modules/engine.mjs';
import {SettlementAction} from '../.sites-runtime/test-modules/SettlementAction.mjs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
const {createElement}=await import(pathToFileURL(require.resolve('react')));
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')));
const keys={paused:false,repeat:false,modified:false,editable:false,interactive:false,advanceControl:false};
test('Space and Enter advance from the reading region and the focused advance button exactly once',()=>{
 for(const code of ['Space','Enter']){assert.equal(readingKey(code,keys),'advance');assert.equal(readingKey(code,{...keys,interactive:true,advanceControl:true}),'advance');assert.equal(readingKey(code,{...keys,repeat:true}),null);}
});
test('native choice, replay, details and form keys are preserved; Escape still exits focused tools',()=>{
 assert.equal(readingKey('Space',{...keys,interactive:true}),null);assert.equal(readingKey('Enter',{...keys,editable:true}),null);
 assert.equal(readingKey('Escape',{...keys,interactive:true}),'close');assert.equal(readingKey('Escape',{...keys,editable:true}),null);
 assert.equal(readingKey('ArrowLeft',keys),'previous');assert.equal(readingKey('Space',{...keys,paused:true}),null);assert.equal(readingKey('Space',{...keys,modified:true}),null);
});
test('completed small stories leave the invitation, while interrupted selected outcomes remain reachable',()=>{
 const progress={eventId:'s1',phase:'outcome',index:1,choice:0,inspected:false,outcomeRevision:2};
 assert.deepEqual(sideInvitation(false,false,'s1',null),{visible:true,continuing:false});
 assert.deepEqual(sideInvitation(false,true,'s1',progress),{visible:true,continuing:true});
 assert.deepEqual(sideInvitation(false,true,'s1',null),{visible:false,continuing:false});
 assert.equal(sideInvitation(true,true,'s1',progress).visible,false);
});
test('old cursors and reduced-motion preferences validate unchanged; instant text is optional and survives restart',()=>{
 const game=createGame(4),old=freshPresentation(game);old.reducedMotion=true;old.reading={eventId:'main-1',phase:'outcome',index:2,choice:1,inspected:true,outcomeRevision:2};
 const original=JSON.stringify(old);assert.equal(validPresentation(old,game),true);assert.equal(JSON.stringify(old),original);
 assert.equal(validPresentation({...old,instantText:false},game),true);assert.equal(validPresentation({...old,instantText:'fast'},game),false);
 assert.equal(restartPresentation(createGame(5),{...old,instantText:true}).instantText,true);
});
test('the final-quarter primary action remains outside scrolling summary content and keeps the same callback',()=>{
 let opened=0;const node=SettlementAction({finished:true,onContinue:()=>opened++});
 assert.equal(node.type,'footer');assert.equal(node.props.className,'paper-fixed-action');
 const button=node.props.children.find(c=>c?.type==='button');button.props.onClick();assert.equal(opened,1);
 const html=renderToStaticMarkup(createElement(SettlementAction,{finished:true,onContinue:()=>{}}));assert.match(html,/回望这三年/);
 assert.match(renderToStaticMarkup(createElement(SettlementAction,{finished:false,onContinue:()=>{}})),/走进下一季/);
});
test('the first motion toggle in a legacy save preserves its prior text behavior and reading cursor',()=>{
 const game=createGame(4),old={...freshPresentation(game),reducedMotion:true,reading:{eventId:'main-1',phase:'story',index:3,choice:null,inspected:false}};
 const changed={...old,...motionPreferences(old,false)};assert.equal(changed.instantText,true);assert.equal(changed.reducedMotion,false);assert.deepEqual(changed.reading,old.reading);assert.equal(validPresentation(changed,game),true);
 assert.deepEqual(motionPreferences({instantText:false,reducedMotion:true},false),{instantText:false,reducedMotion:false});
});
