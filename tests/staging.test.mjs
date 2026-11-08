import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STORYBOARDS} from '../.sites-runtime/test-modules/cinematic-content.mjs';
import {CAST,outcomeScene} from '../.sites-runtime/test-modules/visuals.mjs';
import {resolveStaging,STORY_DIRECTIONS} from '../.sites-runtime/test-modules/staging.mjs';

const resolve=(id,phase,branch=0,index=0)=>{const script=STORYBOARDS[id];return resolveStaging({eventId:id,phase,branch,index,script,beat:phase==='outcome'?script.outcomes[branch][index]:script.beats[index]});};
const renderingSignature=d=>JSON.stringify({actors:d.actors,object:d.object,channel:d.channel,composition:d.composition,showObject:d.showObject});

test('every authored story and both choices have an intentional, renderable direction',()=>{
 assert.deepEqual(Object.keys(STORY_DIRECTIONS).sort(),Object.keys(STORYBOARDS).sort());
 for(const [id,script] of Object.entries(STORYBOARDS))for(const branch of [0,1]){
  const notes=STORY_DIRECTIONS[id].outcomes[branch];assert.ok(notes.intent.length>5,`${id}/${branch}: authored production intention`);
  for(const [index,beat] of script.outcomes[branch].entries()){
   const d=resolveStaging({eventId:id,phase:'outcome',branch,index,script,beat,scene:outcomeScene(id,branch,script.scene)});
   assert.ok(d.actors.length<=2);assert.deepEqual(d.cast,d.actors.map(a=>a.id));
   for(const actor of d.actors){assert.ok(CAST[actor.id]);assert.ok(actor.x>=40&&actor.x<=94);assert.ok(actor.y>=85&&actor.y<=95&&actor.height>=48&&actor.height<=65);assert.ok(actor.scale>=.7&&actor.scale<=1);assert.ok([0,1,2].includes(actor.pose));}
   const p=d.object;assert.ok(p.x>=25&&p.x<=70&&p.y>=30&&p.y<=50);assert.ok(p.width>=15&&p.width<=25);assert.ok(Math.abs(p.rotate)<=6);
  }
  assert.notEqual(renderingSignature(resolve(id,'outcome',0)),renderingSignature(resolve(id,'outcome',1)),`${id}: the material arrangement or interaction really differs`);
 }
});

test('actors retain physical world marks across viewport sizes and speaking poses',()=>{
 for(const [id,script] of Object.entries(STORYBOARDS))for(const phase of ['story','choice','outcome'])for(const branch of [0,1]){
  const scene=phase==='outcome'?outcomeScene(id,branch,script.scene):script.scene;
  const beats=phase==='outcome'?script.outcomes[branch]:script.beats;
  for(const [index,beat] of beats.entries())for(const a of resolveStaging({eventId:id,phase,branch,index,script,beat,scene}).actors){
   assert.ok(a.y-a.height>=25&&a.y<=95,`${id}: head and feet are authored on the painting`);
   assert.ok(a.x>=40&&a.x<=94);assert.equal(a.scale,1,'speaking does not inflate a person');
  }
 }
});

test('detail inserts remove full standing actors and distant Cheng stays a letter or voice',()=>{
 for(const [id,script] of Object.entries(STORYBOARDS))for(const phase of ['story','outcome'])for(const branch of [0,1]){
  const beats=phase==='outcome'?script.outcomes[branch]:script.beats;
  for(const [index,beat] of beats.entries())if(beat.camera==='detail'&&beat.focus){const d=resolveStaging({eventId:id,phase,branch,index,script,beat,scene:phase==='outcome'?outcomeScene(id,branch,script.scene):script.scene});assert.equal(d.actors.length,0);assert.equal(d.showObject,true);}
 }
 for(const id of ['main-1','main-6','s45','s47','s58'])for(const branch of [0,1]){const d=resolve(id,'outcome',branch);assert.equal(d.actors.length,0);assert.notEqual(d.channel,'room');}
 assert.equal(resolve('main-2','outcome',1,1).actors.length,0,'Tang is not physically upstairs after you went to work alone');
});

test('actual choices distinguish keeping originals, separating records, and gathering people',()=>{
 assert.equal(resolve('main-10','outcome',0).object.action,'withdrawn');
 assert.equal(resolve('main-10','outcome',1).object.action,'offered');
 assert.equal(resolve('s39','outcome',0).object.action,'withdrawn');
 assert.equal(resolve('s39','outcome',1).object.action,'placed');
 assert.equal(resolve('main-2','outcome',0,1).actors.length,2);
 assert.equal(resolve('main-2','outcome',1,1).actors.length,0);
 assert.equal(resolve('s42','outcome',1).object.companion.focus,'contract','loan terms remain beside the revenue ledger');
 assert.deepEqual(resolve('main-10','outcome',0,1).cast,['xu'],'the tea-room intermediary is separate from the bank teller');
 assert.deepEqual(resolve('main-10','outcome',1,1).cast,['yao'],'the bank verification shot cannot bring the intermediary into the teller room');
});

test('changing the speaker does not make the two characters exchange positions',()=>{
 const script=STORYBOARDS['chapter-2'];
 const first=resolveStaging({eventId:'chapter-2',phase:'story',index:1,script,beat:script.beats[1]});
 const second=resolveStaging({eventId:'chapter-2',phase:'story',index:2,script,beat:script.beats[2]});
 assert.deepEqual(first.actors.map(({id,x,y,scale})=>({id,x,y,scale})),second.actors.map(({id,x,y,scale})=>({id,x,y,scale})));
});

test('resolver never modifies the authored beat or script and unknown replay IDs stay safe',()=>{
 const script=structuredClone(STORYBOARDS['main-3']),before=structuredClone(script);
 resolveStaging({eventId:'main-3',phase:'outcome',branch:1,index:0,script,beat:script.outcomes[1][0]});assert.deepEqual(script,before);
 const d=resolveStaging({eventId:'ending-replay',phase:'story',index:0,script,beat:script.beats[0]});assert.ok(d.actors.every(a=>CAST[a.id]));
});
