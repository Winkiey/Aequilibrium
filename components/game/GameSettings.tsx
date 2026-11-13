'use client';
import type {ReactNode} from 'react';
import {ArrowRight,Download,Upload,Film,BookOpen,Volume2,VolumeX} from 'lucide-react';

export type SettingsTab='sound'|'save'|'resources';
const tabs=[{id:'sound',name:'声音与阅读',note:'听与读的节奏'},{id:'save',name:'存档与回看',note:'留住这一程'},{id:'resources',name:'版本与资源',note:'整理本机行囊'}] as const;
type Props={tab:SettingsTab;onTab:(tab:SettingsTab)=>void;sound:boolean;rain:number;music:number;voice:number;onSound:()=>void;onRain:(value:number)=>void;onMusic:(value:number)=>void;onVoice:(value:number)=>void;speed:number;reducedMotion:boolean;instantText?:boolean;onInstantText?:(value:boolean)=>void;onSpeed:(value:number)=>void;onMotion:(value:boolean)=>void;saved:boolean|null;inTitle:boolean;quarter:string;hasUpdate:boolean;saveError:boolean;onExport:()=>void;onImport:()=>void;onRestore:()=>void;onOpening:()=>void;onMemories:()=>void;onGuide:()=>void;onReset:()=>void;resources:ReactNode};

export function GameSettings(p:Props){
 const selected=tabs.find(t=>t.id===p.tab)!;
 const slider=(label:string,value:number,onChange:(value:number)=>void)=><label className="preference-level"><span>{label}<output>{value}<small>%</small></output></span><input type="range" min="0" max="100" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
 return <div className="settings-folio">
  <nav className="settings-index" aria-label="偏好分类">{tabs.map((tab,index)=><button key={tab.id} onClick={()=>p.onTab(tab.id)} aria-pressed={p.tab===tab.id}><span className="settings-index-number">0{index+1}</span><span>{tab.name}<small>{tab.note}{tab.id==='resources'&&p.hasUpdate&&<em>有新版</em>}</small></span></button>)}</nav>
  <section className="settings-leaf" aria-label={selected.name}>
   <header className="settings-leaf-heading"><div><p className="paper-kicker">旅程与偏好</p><h2>{selected.name}</h2></div><span>{p.inTitle?'出发以前':p.quarter}</span></header>
   {p.tab==='sound'&&<div className="listening-preferences">
    <section className="listening-levels" aria-label="声音设置">
     <div className="settings-sound-switch"><span>聆听澄港<small>人物对白、四季配乐与环境声</small></span><button onClick={p.onSound} aria-pressed={p.sound} aria-label={p.sound?'关闭游戏声音':'开启游戏声音'}>{p.sound?<Volume2 size={16}/>:<VolumeX size={16}/>}<span>{p.sound?'已开启':'已关闭'}</span></button></div>
     {slider('人物对白',p.voice,p.onVoice)}{slider('四季配乐',p.music,p.onMusic)}{slider('场景环境声',p.rain,p.onRain)}
    </section>
    <section className="reading-preferences" aria-label="阅读设置"><h3>读得从容一些</h3>
     <label className="reading-preference"><span>对白出现速度</span><select aria-label="对白出现速度" value={p.speed} onChange={e=>p.onSpeed(Number(e.target.value))}><option value={50}>慢一点</option><option value={30}>自然</option><option value={15}>快一点</option></select></label>
     <label className="reading-preference motion-preference"><span>减少画面动画<small>不改变剧情与阅读位置</small></span><input type="checkbox" checked={p.reducedMotion} onChange={e=>p.onMotion(e.target.checked)}/></label><label className="reading-preference"><span>文字直接显示<small>每句一次点击继续，保留画面演出</small></span><input type="checkbox" checked={p.instantText??p.reducedMotion} onChange={e=>p.onInstantText?.(e.target.checked)}/></label>
     <p className="settings-margin-note">进入游戏时会开启声音。若想安静游玩，可在这里关闭；设为零的音量会继续保留。</p>
     {p.saved!==null&&<p className="settings-persistence" role="status">{p.saved?'音量已保存在本机。阅读与对白播放时，配乐会自动放轻。':'音量本次有效，浏览器暂未保存设置。'}</p>}
    </section>
   </div>}
   {p.tab==='save'&&<div className="journey-preferences">
    <section aria-label="存档"><h3>留下这一段日子</h3><p className="settings-margin-note">{p.quarter} · {p.saveError?'本机保存遇到问题，请先导出留存。':'进度会自动保存在当前浏览器。'}</p>
     <div className="settings-save-pair"><button onClick={p.onExport}><Download size={15}/><span>导出这一程<small>保存为存档文件</small></span></button><button onClick={p.onImport}><Upload size={15}/><span>接回一段日子<small>导入已有存档</small></span></button></div>
     <button className="settings-line-action" onClick={p.onRestore}><span>恢复上一次自动备份</span><ArrowRight size={14}/></button>
     <button className="settings-line-action settings-reset-action" onClick={p.onReset}><span>新的三年<small>先备份，再回到那个雨夜</small></span><ArrowRight size={14}/></button>
    </section>
    <section aria-label="回看与说明"><h3>再翻一页</h3><button className="settings-line-action" onClick={p.onOpening}><span>重看开场影片</span><Film size={15}/></button><button className="settings-line-action" onClick={p.onMemories}><span>翻看往事收藏</span><BookOpen size={15}/></button><button className="settings-line-action" onClick={p.onGuide}><span>第一次来到澄港<small>游玩说明与新手指引</small></span><ArrowRight size={14}/></button></section>
   </div>}
   {p.tab==='resources'&&<div className="settings-resources">{p.resources}</div>}
  </section>
 </div>;
}
