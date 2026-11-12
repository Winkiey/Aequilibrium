'use client';
import {ArrowRight} from 'lucide-react';

export function TitleMenu({hasProgress,quarter,onBegin,onShelf,onSettings,onGuide,hasUpdate=false}:{hasProgress:boolean;quarter:string;onBegin:()=>void;onShelf:()=>void;onSettings:()=>void;onGuide:()=>void;hasUpdate?:boolean}){
 return <div className="game-title">
  <p>AEQUILIBRIUM</p><h1>均衡之渊</h1><div className="title-hairline"/>
  <span>雨夜、来信，和未定的三年。</span>
  <nav aria-label="开始菜单">
   <button className="title-start" onClick={onBegin}>{hasProgress?'继续这段日子':'从那个雨夜开始'}<ArrowRight size={22}/></button>
   <p className="title-progress">{hasProgress?`${quarter} · 日子留在你上次停下的地方`:'从一封来信，走进澄港。'}</p>
   <div className="title-secondary">
    <button onClick={onShelf}>翻开书柜<small>人物 · 往事 · 读物</small></button>
    <button onClick={onSettings} aria-label={hasUpdate?'旅程与偏好，有可用更新':'旅程与偏好'}>旅程与偏好{hasUpdate&&<i className="title-edition-dot" aria-hidden="true"/>}<small>声音 · 进度 · 行囊{hasUpdate&&<em>有新版</em>}</small></button>
   </div>
   <button className="title-guide" onClick={onGuide}>第一次来到澄港<ArrowRight size={12}/></button>
  </nav>
 </div>;
}
