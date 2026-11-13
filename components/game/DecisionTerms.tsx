import type {Game,Option} from '@/lib/game/engine';
import {decisionSections} from '@/lib/game/decision-info';
export function DecisionTerms({option,game}:{option:Option;game?:Game}){
 return <span className="decision-terms" role="group" aria-label="收支、日期与责任">{decisionSections(option,game).map(section=><span key={section.id} className={`decision-term decision-term-${section.id}`}><span className="decision-term-label">{section.title}</span><span>{section.facts.length?section.facts.map((f,i)=><em key={i}>{f.label!=='现在'&&<b>{f.label} · </b>}{f.text}</em>):<small>{section.empty}</small>}</span></span>)}</span>;
}
