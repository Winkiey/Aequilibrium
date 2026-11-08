'use client';
import {ArrowLeft,Home,Pause,UsersRound} from 'lucide-react';
import type {Place} from '@/lib/game/places';
import type {Game} from '@/lib/game/engine';
import {debtTotal,quarterName} from '@/lib/game/engine';
import type {Lesson} from '@/lib/game/tutorial';
import {warmScene} from '@/lib/game/assets';
import {Stage} from './Stage';

export function PlaceScene({place,game,lesson,onGo,onAction,onTitle,onPause,onPeople,bankMessage}:{place:Exclude<Place,'hub'>;game:Game;lesson:Lesson;onGo:(place:Place)=>void;onAction:(action:'buy'|'sell'|'borrow'|'repay')=>void;onTitle:()=>void;onPause:()=>void;onPeople:()=>void;bankMessage?:string}){
 const info={street:{scene:'district-street' as const,name:'澄港 · 老街',line:'几步路，就能走到另一种安排里。'},broker:{scene:'securities-office' as const,name:'老街证券营业室',line:'公司的公开资料放在桌上。先读，再决定。'},bank:{scene:'neighborhood-bank' as const,name:'沿海银行',line:bankMessage||'姚宁把材料放平：“借款和还款，都先核对日期。”'}}[place];
 const hotspot=(label:string,x:number,y:number,action:()=>void,guided=false)=><button key={label} className={`place-hotspot ${guided?'guided':''}`} style={{left:x+'%',top:y+'%'}} onClick={action}><span className="hotspot-ring"/><span>{label}</span></button>;
 const world=place==='street'?<>
  {hotspot('回泊灯书屋',45,51,()=>onGo('hub'))}
  {hotspot('证券营业室',21,58,()=>onGo('broker'),lesson==='broker'||lesson==='company')}
  {hotspot('沿海银行',87,49,()=>onGo('bank'))}
 </>:place==='broker'?<>
  {hotspot('公司资料 · 买入',26,68,()=>onAction('buy'),lesson==='company')}
  {hotspot('卖出已有持仓',34,55,()=>onAction('sell'))}
 </>:<>
  {hotspot('办理借款',28,55,()=>onAction('borrow'))}
  {hotspot('办理还款',54,55,()=>onAction('repay'))}
 </>;
 return <Stage quarter={game.quarter} scene={info.scene} cast={place==='bank'?['yao']:[]} speaker={place==='bank'?'yao':undefined} pose={1} shotId={`place-${place}-${game.quarter}`} sceneLayer={world}>
  <header className="game-hud place-hud"><nav className="hud-navigation"><button className="scene-tool" onClick={onTitle}><Home size={15}/>返回标题</button><button className="scene-tool" onClick={onPause}><Pause size={15}/>暂停</button></nav><div><span>{quarterName(game.quarter)}</span><strong>{info.name}</strong></div><button className="scene-tool" onClick={onPeople} aria-label="打开人物图鉴"><UsersRound size={18}/></button></header>
  <div className="place-caption"><span>{place==='street'?'出门走走':place==='bank'?'银行柜台':'营业室的下午'}</span><p>{info.line}</p>{place==='bank'&&<small>{debtTotal(game)>0?'有未还本金，可以在柜台查看还款安排。':'目前没有未还本金。'}</small>}</div>
  <footer className="place-navigation"><button onClick={()=>onGo(place==='street'?'hub':'street')} onPointerEnter={()=>warmScene(place==='street'?'bookshop-night':'district-street')}><ArrowLeft size={15}/>{place==='street'?'回到书屋':'回到老街'}</button>{place!=='street'&&<button onClick={()=>onGo('hub')}>直接回书屋</button>}<span>走动与阅读不推进季度</span></footer>
 </Stage>;
}
