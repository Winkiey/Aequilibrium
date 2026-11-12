import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {TitleMenu} from '../.sites-runtime/test-modules/TitleMenu.mjs';
import {GameSettings} from '../.sites-runtime/test-modules/GameSettings.mjs';
import OfflinePack from '../.sites-runtime/test-modules/OfflinePack.mjs';
const require=createRequire(new URL('../package.json',import.meta.url));
const {createElement}=await import(pathToFileURL(require.resolve('react')));
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')));
const noop=()=>{},render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
const base={tab:'sound',onTab:noop,sound:false,rain:35,music:42,voice:70,onSound:noop,onRain:noop,onMusic:noop,onVoice:noop,speed:30,reducedMotion:false,onSpeed:noop,onMotion:noop,saved:true,inTitle:true,quarter:'第一年 · 秋',hasUpdate:false,saveError:false,onExport:noop,onImport:noop,onRestore:noop,onOpening:noop,onMemories:noop,onGuide:noop,onReset:noop,resources:createElement('p',null,'资源面板')};
function all(node,predicate,result=[]){if(!node||typeof node!=='object')return result;if(predicate(node))result.push(node);for(const child of Array.isArray(node.props?.children)?node.props.children:[node.props?.children]){if(Array.isArray(child))child.forEach(c=>all(c,predicate,result));else all(child,predicate,result);}return result;}
const text=node=>typeof node==='string'?node:!node||typeof node!=='object'?'':(Array.isArray(node)?node:([node.props?.children].flat(Infinity))).map(text).join('');

test('the title keeps literary invitations and one settings destination rather than download/update administration',()=>{
 const html=render(TitleMenu,{hasProgress:false,quarter:'第一年 · 秋',onBegin:noop,onShelf:noop,onSettings:noop,onGuide:noop,hasUpdate:true});
 assert.match(html,/从那个雨夜开始/);assert.match(html,/翻开书柜/);assert.match(html,/旅程与偏好/);assert.match(html,/第一次来到澄港/);
 assert.doesNotMatch(html,/更新 \/ 离线资源|下载完整资源|保存后更新|声音与阅读/);assert.match(html,/旅程与偏好，有可用更新/);
 const continued=render(TitleMenu,{hasProgress:true,quarter:'第二年 · 冬',onBegin:noop,onShelf:noop,onSettings:noop,onGuide:noop});
 assert.match(continued,/继续这段日子/);assert.match(continued,/第二年 · 冬/);assert.doesNotMatch(continued,/新的三年/);
});
test('title actions lead to start, collection, one preferences folio and guidance',()=>{
 const calls=[],tree=TitleMenu({hasProgress:false,quarter:'秋',onBegin:()=>calls.push('start'),onShelf:()=>calls.push('shelf'),onSettings:()=>calls.push('settings'),onGuide:()=>calls.push('guide')});
 for(const button of all(tree,n=>n.type==='button'))button.props.onClick();
 assert.deepEqual(calls,['start','shelf','settings','guide']);
});
test('settings partitions sound/reading, saves/replay and version/resources instead of showing them all at once',()=>{
 for(const tab of ['sound','save','resources']){
  const html=render(GameSettings,{...base,tab});
  assert.match(html,/aria-label="偏好分类"/);assert.equal((html.match(/aria-pressed="true"/g)??[]).length,1);
  if(tab==='sound'){assert.match(html,/人物对白/);assert.match(html,/对白出现速度/);assert.doesNotMatch(html,/导出这一程|资源面板/);}
  if(tab==='save'){assert.match(html,/导出这一程/);assert.match(html,/新的三年/);assert.match(html,/恢复上一次自动备份/);assert.doesNotMatch(html,/type="range"|资源面板/);}
  if(tab==='resources'){assert.match(html,/资源面板/);assert.doesNotMatch(html,/type="range"|导出这一程/);}
 }
});
test('the preferences view preserves zero levels and exposes complete labels for all five input controls',()=>{
 const html=render(GameSettings,{...base,voice:0,music:0,rain:0,reducedMotion:true});
 assert.equal((html.match(/type="range"/g)??[]).length,3);assert.equal((html.match(/value="0"/g)??[]).length,3);
 assert.match(html,/checked=""/);assert.match(html,/aria-label="对白出现速度"/);assert.match(html,/aria-label="开启游戏声音"/);
});
test('preferences callbacks change the intended level, speed, motion or tab; save callbacks remain distinct',()=>{
 const calls=[],tree=GameSettings({...base,onTab:t=>calls.push(t),onVoice:n=>calls.push(['voice',n]),onMusic:n=>calls.push(['music',n]),onRain:n=>calls.push(['environment',n]),onSpeed:n=>calls.push(['speed',n]),onMotion:n=>calls.push(['motion',n])});
 const levels=all(tree,n=>n.type==='input'&&n.props.type==='range');
 levels.forEach(n=>n.props.onChange({target:{value:'0'}}));all(tree,n=>n.type==='select')[0].props.onChange({target:{value:'15'}});all(tree,n=>n.type==='input'&&n.props.type==='checkbox')[0].props.onChange({target:{checked:true}});
 all(tree,n=>n.type==='button'&&text(n).includes('版本与资源'))[0].props.onClick();
 assert.deepEqual(calls,[['voice',0],['music',0],['environment',0],['speed',15],['motion',true],'resources']);
 const saveCalls=[],save=GameSettings({...base,tab:'save',onExport:()=>saveCalls.push('export'),onImport:()=>saveCalls.push('import'),onRestore:()=>saveCalls.push('restore'),onReset:()=>saveCalls.push('reset'),onOpening:()=>saveCalls.push('opening'),onMemories:()=>saveCalls.push('memories'),onGuide:()=>saveCalls.push('guide')});
 for(const button of all(save,n=>n.type==='button'&&!('aria-pressed'in n.props)))button.props.onClick();
 assert.deepEqual(saveCalls,['export','import','restore','reset','opening','memories','guide']);
});
test('the resource page is SSR safe, has a compact version row and keeps large illustrated copy outside settings',()=>{
 const html=render(OfflinePack,{compact:true,onContinue:noop,onUpdate:noop});
 assert.match(html,/游戏更新/);assert.match(html,/检查版本/);assert.doesNotMatch(html,/把澄港，先收进行囊|resource-illustration/);
});
