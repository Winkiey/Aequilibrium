import type {Game} from '@/lib/game/engine';
import {endingEvidence,type EndingCheck} from '@/lib/game/ending-evidence';
function Checks({checks}:{checks:EndingCheck[]}){
 return <div className="ending-evidence-scroll"><table><thead><tr><th>核对项目</th><th>本局记录</th><th>原有条件与差距</th></tr></thead><tbody>{checks.map(c=><tr key={c.label}><th>{c.label}</th><td>{c.actual}</td><td>{c.target}<small className={c.met?'condition-met':'condition-unmet'}>{c.gap}</small></td></tr>)}</tbody></table></div>;
}
export function EndingEvidence({game}:{game:Game}){
 const evidence=endingEvidence(game);if(!evidence)return null;
 return <details className="ending-evidence"><summary>这一次，为什么走到这里？</summary><p>{evidence.explanation}</p><p className="ending-priority">{evidence.priority}</p>
  {evidence.selected.checks.length>0&&<details className="ending-numbers"><summary>展开《{evidence.name}》的判定数字</summary><p>{evidence.selected.mode==='any'?'以下任一条件满足即可；不要求同时满足。':'以下条件须同时满足。'}</p><Checks checks={evidence.selected.checks}/></details>}
  {evidence.paths.length>0&&<details className="ending-other-records"><summary>我已经走过的其他方向</summary><p>只核对本局留下的相关记录。这里不会解锁别的结局，也不把记录分当作真实人物的感情刻度。</p>{evidence.paths.map(path=><details key={path.id}><summary>{path.title}<span>{path.satisfied?'条件在本局成立':'仍有条件未满足'}</span></summary><Checks checks={path.checks}/></details>)}</details>}
 </details>;
}
