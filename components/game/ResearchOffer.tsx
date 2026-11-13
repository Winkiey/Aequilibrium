import type {Game} from '@/lib/game/engine';
import {researchOffer} from '@/lib/game/decision-info';
import {ArrowRight} from 'lucide-react';
export function ResearchOffer({game,asset,onConfirm,onCancel}:{game:Game;asset:string;onConfirm:()=>void;onCancel:()=>void}){
 const offer=researchOffer(game,asset);
 if(!offer)return <p>没有找到这家公司的记录。<button onClick={onCancel}>返回资料</button></p>;
 return <article className="research-offer">
  <p className="paper-kicker">第{offer.quarter}季 · 付费以前</p><h2 className="paper-title">{offer.name}的这份材料</h2>
  <p className="research-subject">{offer.subject}</p><p className="paper-intro">先看清范围，再决定是否核验。收起这一页不会收费。</p>
  <div className="research-offer-columns"><section><h3>会核对什么</h3><ul>{offer.scope.map(s=><li key={s}>{s}</li>)}</ul></section><section><h3>仍然查不到什么</h3><ul>{offer.limits.map(s=><li key={s}>{s}</li>)}</ul></section></div>
  <dl className="research-offer-price"><div><dt>本次费用</dt><dd>¥{offer.cost.toFixed(2)}</dd></div><div><dt>当前现金</dt><dd>¥{game.cash.toFixed(2)}</dd></div><div><dt>核验后现金</dt><dd>{offer.error?'尚不能办理':'¥'+offer.afterCash.toFixed(2)}</dd></div></dl>
  <p className="form-note">同一家公司同一季的同份材料不重复收费，剧情中已取得的文件也可直接阅读。</p>
  {offer.error&&<p role="status" className="research-offer-error">{offer.error}</p>}
  <div className="research-offer-actions"><button className="ink-button" disabled={!!offer.error} onClick={onConfirm}>{offer.alreadyPaid?'阅读已有文件':`确认支付 ¥${offer.cost.toFixed(2)} 并核验`}<ArrowRight size={15}/></button><button className="paper-back-link" onClick={onCancel}>先不核验，返回资料</button></div>
 </article>;
}
