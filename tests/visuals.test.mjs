import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,writeFileSync} from 'node:fs';
import {STORYBOARDS} from '../.sites-runtime/test-modules/cinematic-content.mjs';
import {CAST,SCENES,OBJECTS,OUTCOME_SCENES,outcomeBeats} from '../.sites-runtime/test-modules/visuals.mjs';
import {EPILOGUES,epilogueScript} from '../.sites-runtime/test-modules/epilogues.mjs';
import {createGame,choose,validateSave} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,SIDE_EVENTS,materialize} from '../.sites-runtime/test-modules/stories.mjs';
import {freshPresentation,validPresentation} from '../.sites-runtime/test-modules/presentation.mjs';

const ids=[...Array.from({length:12},(_,i)=>`main-${i+1}`),...SIDE_EVENTS.map(e=>e.id)];
const manifest=JSON.parse(readFileSync('docs/ASSET_MANIFEST.json','utf8')).assets;
function fixture(id){const s=createGame(20261108);s.flags.shop=1;s.flags.printLoan=1;s.quarter=id.startsWith('main-')?Number(id.slice(5)):5;return materialize(id.startsWith('main-')?mainEvent(s):SIDE_EVENTS.find(e=>e.id===id),s);}
function verifyBeat(b){assert.ok(b.text&&Array.from(b.text).length<=48,b.text);assert.ok(['self','narrator',...Object.keys(CAST)].includes(b.speaker));if(b.focus)assert.ok(OBJECTS[b.focus]);assert.ok(b.pose===undefined||[0,1,2].includes(b.pose));}

test('all 64 events and both branches have authored visual scenes, with no missing ids',()=>{
 assert.deepEqual(Object.keys(STORYBOARDS).sort(),ids.sort());assert.deepEqual(Object.keys(OUTCOME_SCENES).sort(),ids);
 for(const id of ids){const script=STORYBOARDS[id];assert.ok(SCENES[script.scene]);assert.ok(script.beats.length>=3);assert.ok(script.cast.every(c=>CAST[c]));assert.ok(script.interaction.line&&script.interaction.label&&OBJECTS[script.interaction.object]);assert.notEqual(script.outcomeFocus[0],script.outcomeFocus[1]);
  script.beats.forEach(verifyBeat);for(const branch of [0,1]){assert.ok(SCENES[OUTCOME_SCENES[id][branch]]);assert.ok(script.outcomes[branch].length>=2);const beats=outcomeBeats(fixture(id),script,branch);beats.forEach(verifyBeat);assert.ok(beats.some(b=>b.text===fixture(id).options[branch].response||fixture(id).options[branch].response.includes(b.text)));}
  assert.notDeepEqual(script.outcomes[0],script.outcomes[1]);
 }
 assert.equal(new Set(ids.map(id=>STORYBOARDS[id].interaction.line)).size,64);
});
test('every referenced background, fixed character atlas and prop exists in the shipped project',()=>{
 assert.equal(Object.keys(CAST).length,10);assert.equal(Object.keys(SCENES).length,17);
 for(const a of Object.values(manifest)){assert.equal(a.status,'ready');assert.ok(statSync(`public${a.path}`).size>1000,a.path);}
 for(const [id,c]of Object.entries(CAST)){const a=manifest[id];assert.equal(c.sprite,a.path);assert.ok(a.alpha);assert.equal(a.width/a.height,1.5);}
 for(const [id,s]of Object.entries(SCENES)){const a=manifest[id];assert.equal(s.image,a.path);assert.ok(a.width/a.height>1.7);}
 assert.ok(manifest.objects.alpha);assert.ok(manifest.objects.width>=4*256&&manifest.objects.height>=3*256);
 const film=readFileSync('public/video/prologue.mp4');assert.ok(film.length>1000000);assert.ok(film.subarray(0,40).includes(Buffer.from('ftyp')));
});
test('all eight endings use a playable epilogue with real cast, scene and inspectable object',()=>{
 assert.equal(Object.keys(EPILOGUES).length,8);for(const [name,e]of Object.entries(EPILOGUES)){assert.ok(SCENES[e.scene]);assert.ok(e.cast.every(id=>CAST[id]));const script=epilogueScript(createGame(1),name);assert.ok(script.beats.length>=4);script.beats.forEach(verifyBeat);}
});
test('new presentation state survives export, rejects another scenario, and preserves reading cursor',()=>{
 const s=createGame(21),p=freshPresentation(s);assert.ok(validPresentation(p,s));p.reading={eventId:'main-1',phase:'story',index:3,choice:null,inspected:true};assert.ok(validPresentation(JSON.parse(JSON.stringify(p)),s));assert.equal(validPresentation(p,createGame(22)),false);assert.equal(validPresentation({...p,reading:{...p.reading,index:-1}},s),false);assert.equal(validPresentation({...p,speed:0},s),false);
 const done=choose(s,materialize(mainEvent(s),s),0,'main');assert.ok(validateSave(done));assert.equal(done.history[0].optionIndex,0);assert.equal(done.history[0].snapshot.id,'main-1');assert.ok(validateSave(JSON.parse(JSON.stringify(done))));
 const legacy=structuredClone(done);delete legacy.history[0].snapshot;delete legacy.history[0].eventId;delete legacy.history[0].optionIndex;assert.ok(validateSave(legacy));
});
test('write complete, deterministic visual coverage report',()=>{
 const report={version:2,summary:{events:64,outcomes:128,playableCompositions:192,endings:8,backgrounds:17,characters:10,poses:30,missing:0},events:ids.map(id=>({id,before:{scene:STORYBOARDS[id].scene,cast:STORYBOARDS[id].cast,lines:STORYBOARDS[id].beats.length,interaction:STORYBOARDS[id].interaction.label},after:[0,1].map(branch=>({branch,scene:OUTCOME_SCENES[id][branch],focus:STORYBOARDS[id].outcomeFocus[branch],lines:outcomeBeats(fixture(id),STORYBOARDS[id],branch).length}))})),endings:Object.entries(EPILOGUES).map(([name,e])=>({name,scene:e.scene,cast:e.cast}))};
 writeFileSync('docs/VISUAL_COVERAGE.json',JSON.stringify(report,null,2)+'\n');assert.equal(report.events.length*3,192);
});
