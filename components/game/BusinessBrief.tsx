import type {Asset,Game} from '@/lib/game/engine';
import {publicBusiness} from '@/lib/game/market';
import {evidenceFor} from '@/lib/game/research';
const signed=(value:number)=>`${value>0?'+':''}${value.toFixed(1)}`;
export function BusinessBrief({asset,game,onResearch}:{asset:Asset;game?:Game;onResearch?:(id:string)=>void}){
 const data=publicBusiness(asset);if(!data)return null;
 const {notice,last}=data;const evidence=game?evidenceFor(game,asset.id):undefined;
 return <section className="business-brief" aria-label="经营事项与核验">
  <header><span>第{notice.quarter}季初 · 已披露事项</span><h4>{notice.title}</h4></header>
  <p>{notice.fact}</p>
  <details><summary>还有什么不能确定</summary><p>{notice.uncertainty}</p><p>季末核对：{notice.check}</p></details>
  {game&&onResearch&&<button className="research-file-link" onClick={()=>onResearch(asset.id)} disabled={!evidence&&(game.finished||game.market?.version!==3)}>{evidence?'阅读本季已核验文件':'核验本季附件 · ¥300'}</button>}
  {evidence&&<details><summary>已核验：{evidence.source}</summary>{evidence.facts.map((text,i)=><p key={i}>{text}</p>)}<p>{evidence.unresolved}</p></details>}
  {last&&<details className="business-result"><summary>第{last.quarter}季核验 · {last.title}</summary><p>{last.fact??last.description}</p><dl><div><dt>营收变动</dt><dd>{signed(last.revenueChange)} 万元</dd></div><div><dt>经营现金变动</dt><dd>{signed(last.cashChange)} 万元</dd></div><div><dt>负债水平变动</dt><dd>{signed(last.debtChange)} 个百分点</dd></div><div><dt>报价变动</dt><dd>{signed(last.priceChange)}%</dd></div></dl>{last.dividendPerUnit!==undefined&&<p>本季每份派息 ¥{last.dividendPerUnit.toFixed(2)}；除息前报价 ¥{last.cumDividendPrice?.toFixed(2)}，公告报价已扣除这笔股息。</p>}<p className="business-caveat">这是公司整体的季末变化；市场报价还包含预期修正与其他冲击，不能把全部涨跌归因于一条消息。</p></details>}
 </section>;
}
