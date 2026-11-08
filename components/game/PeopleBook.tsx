'use client';
import {useState} from 'react';
import {UserRound} from 'lucide-react';
import {CAST} from '@/lib/game/visuals';
import {PEOPLE,characterHistory,recoverPeople} from '@/lib/game/people';
import {imageURL} from '@/lib/game/assets';
import {quarterName,type Game} from '@/lib/game/engine';
import type {Presentation} from '@/lib/game/presentation';
import type {CastId} from '@/lib/game/cinematic-content';

export default function PeopleBook({game,presentation}:{game:Game;presentation:Presentation}){
 const people=recoverPeople(game,presentation.people),known=(Object.keys(CAST) as CastId[]).filter(id=>people[id]);
 const [selected,setSelected]=useState<CastId|undefined>(known[0]);
 const cast=selected?CAST[selected]:undefined,profile=selected?PEOPLE[selected]:undefined,history=selected?characterHistory(game,selected):[];
 return <div className="people-book"><header><p className="paper-kicker">相识的人，留下的事</p><h2>澄港人物簿</h2><span>已经认识 {known.length} / {Object.keys(CAST).length} 人</span></header>
  <nav aria-label="已认识的人物">{known.map(id=><button key={id} onClick={()=>setSelected(id)} className={selected===id?'selected':''}>{CAST[id].name}<small>{CAST[id].role}</small></button>)}{known.length<10&&<span className="unknown-people"><UserRound size={16}/>还有 {10-known.length} 位尚未相识的人</span>}</nav>
  {selected&&cast&&profile?<article className="person-dossier"><div className="dossier-portrait"><div><img src={imageURL(cast.sprite)} alt={cast.name}/></div><span>{cast.name}</span><small>{cast.role}</small></div><div className="dossier-text"><p className="paper-kicker">初次相识 · {quarterName(people[selected]!.quarter)}</p><h3>关于{cast.name}</h3><p>{profile.introduction}</p>{profile.details.map(line=><p key={line}>{line}</p>)}
   <h3>你们之间发生的事</h3>{history.length?history.map((h,i)=><section className="person-memory" key={i}><span>{quarterName(h.quarter)}</span><h4>{h.title}</h4><p>你的答复：{h.choice}</p><p>{h.response}</p></section>):<p className="paper-empty">第一次对话还在继续。答复以后，这一段经历会记在这里。</p>}
  </div></article>:<div className="people-empty"><UserRound size={38} strokeWidth={1}/><h3>先去拆开第一封信吧。</h3><p>故事里认识的人，会逐一出现在这本簿子里。</p></div>}
 </div>;
}
