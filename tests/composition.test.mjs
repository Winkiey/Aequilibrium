import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Stage} from '../.sites-runtime/test-modules/Stage.mjs';
import {SCENES,CAST} from '../.sites-runtime/test-modules/visuals.mjs';
import {SCENE_LAYOUTS,ACTOR_FEET,actorSpriteOffset,materialPlacement,materialIsPainted,sceneFocusPoint} from '../.sites-runtime/test-modules/composition.mjs';
import {coverFrame,assetSource} from '../.sites-runtime/test-modules/assets.mjs';

test('every original painting has a measured support or an explicit outdoor insert',()=>{
 assert.deepEqual(Object.keys(SCENE_LAYOUTS).sort(),Object.keys(SCENES).sort());
 for(const [scene,p] of Object.entries(SCENE_LAYOUTS)){
  assert.equal(p.actors.length,2);for(const a of p.actors)assert.ok(a.y>a.height&&a.height>=50&&a.height<=65);
  for(const point of Object.values(p.painted))assert.ok(point.every(n=>n>0&&n<100));
  if(p.surface)for(const f of ['letter','ledger','contract','phone','cup']){const m=materialPlacement(scene,f);assert.ok(m.x-m.width/2>=0&&m.x+m.width/2<=100);assert.ok(m.y>=50&&m.y<=86);}
 }
 for(const id of ['coldstore','district-street','old-street','station','roof','ferry-spring','seawall-evening'])assert.equal(materialPlacement(id,'contract'),null);
 assert.deepEqual(sceneFocusPoint('tea-room','letter'),[21,78]);assert.equal(materialIsPainted('bookshop-pledge','key'),true);
});
test('all thirty measured foot points stay fixed while changing sprite poses',()=>{
 assert.deepEqual(Object.keys(ACTOR_FEET).sort(),Object.keys(CAST).sort());
 for(const id of Object.keys(CAST))for(let pose=0;pose<3;pose++){
  const [x,y]=ACTOR_FEET[id][pose],o=actorSpriteOffset(id,pose);
  assert.ok(Math.abs(x+o.left*512/100-256)<1e-8);assert.ok(Math.abs(y+o.top*1024/100-1024)<1e-8);
 }
 assert.ok(Math.abs(actorSpriteOffset('lu',0).left-actorSpriteOffset('lu',2).left)>10,'Lu needs the measured lateral correction');
});
test('raw painting proportions produce matching person height and projection for every screen',()=>{
 for(const [scene,p] of Object.entries(SCENE_LAYOUTS))for(const [w,h] of [[667,375],[844,390],[1440,1000],[2560,720]]){
  const a=assetSource(SCENES[scene].image),f=coverFrame(w,h,a.width,a.height,p.framing==='desk'?0:.5,p.framing==='desk'?1:.5);
  for(const slot of p.actors){const width=f.width*slot.height/(a.width/a.height*2)/100;assert.ok(Math.abs(width*2-f.height*slot.height/100)<1e-6);}
  const point=sceneFocusPoint(scene,'contract'),paintedX=f.left+f.width*point[0]/100,paintedY=f.top+f.height*point[1]/100;
  assert.ok(Number.isFinite(paintedX)&&Number.isFinite(paintedY));
 }
});
test('actual scene markup separates outdoor reading from supported objects and uses the world cast',()=>{
 const render=props=>renderToStaticMarkup(createElement(Stage,{scene:'neighborhood-bank',shotId:'composition-test',...props}));
 const bank=render({cast:['yao'],speaker:'yao'});assert.ok(bank.indexOf('stage-set')<bank.indexOf('world-actor'));assert.ok(bank.includes('--figure-x:71%'));assert.ok(bank.includes('--figure-y:87%'));
 const street=render({scene:'old-street',focus:'contract',showObject:true});assert.ok(street.includes('material-reading-insert'));assert.ok(!street.includes('data-material="contract"'));
 const paper=render({scene:'attic',focus:'contract',showObject:true});assert.ok(paper.includes('data-material="contract"'));assert.ok(!paper.includes('material-reading-insert'));
 const window=render({scene:'attic',focus:'window',showObject:true});assert.ok(!window.includes('data-material="window"'));assert.ok(!window.includes('material-reading-insert'));
});
