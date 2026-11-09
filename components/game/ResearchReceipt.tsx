import type {Game} from '@/lib/game/engine';
import {evidenceFor} from '@/lib/game/research';
export function ResearchReceipt({game,asset,onCompany}:{game:Game;asset:string;onCompany:()=>void}){
 const record=evidenceFor(game,asset)??[...(game.evidence??[])].reverse().find(e=>e.asset===asset);
 if(!record)return <p>这份资料尚未核验。可以在证券营业室查看公开报道和可用附件。</p>;
 return <article className="research-receipt"><p className="paper-kicker">第{record.quarter}季 · 核验文件</p><h2 className="paper-title">{record.title}</h2><p className="research-source">材料来源：{record.source}</p><p>本次实际核验费用 ¥{record.cost.toFixed(2)}。同一家公司同一季的这份材料可反复阅读，不重复收费。</p><ol>{record.facts.map((text,index)=><li key={index}>{text}</li>)}</ol><p className="research-unknown">仍未确定：{record.unresolved}</p><p className="form-note">文件按核验时的日期保存。之后的实际结果，会出现在公司资料的季末核验中。</p><button className="ink-button full" onClick={onCompany}>对照公司资料 / 安排持仓</button></article>;
}
