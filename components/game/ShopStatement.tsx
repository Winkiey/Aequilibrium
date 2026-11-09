'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {money,type Game} from '@/lib/game/engine';
import {shopSummary,type ShopPeriod} from '@/lib/game/shop';
import {Stage} from './Stage';
import type {SceneId} from '@/lib/game/cinematic-content';

const signed=(n:number)=>`${n>=0?'+':'−'}¥${money(Math.abs(n))}`;
const roofNames={unrepaired:'尚待修缮',patched:'局部修补',sound:'完整修缮'};
export function ShopGlance({game,onOpen}:{game:Game;onOpen?:()=>void}){
 const s=shopSummary(game);if(!game.flags.shop&&!s.costs&&!s.held&&!s.periods.length)return null;
 return <section className="shop-glance"><div><h3>泊灯书屋</h3><span>{game.finished&&game.shop?.plan!=='continue'?'这段租期已经交清':game.flags.shop?'经营与约定':'你为书屋留下的安排'}</span></div><dl><div><dt>最近一季营业</dt><dd>{s.last?signed(s.last.profit):'尚待结算'}</dd></div><div><dt>已登记可退押金</dt><dd>¥{money(s.held)}</dd></div></dl>{onOpen&&<button className="paper-back-link" onClick={onOpen}>翻看书屋经营单<ArrowRight size={14}/></button>}</section>;
}
export function ShopQuarterNote({game,quarter,onOpen}:{game:Game;quarter:number;onOpen:()=>void}){
 const p=game.shop?.periods.find(p=>p.quarter===quarter);if(!p)return null;
 return <section className="shop-quarter-note"><span className="paper-kicker">阿棠夹在账本里的一页</span><h3>书屋这一季 {signed(p.profit)}</h3><p>{p.notes[0]}</p><button className="paper-back-link" onClick={onOpen}>听他讲讲，再核对经营单<ArrowRight size={14}/></button></section>;
}
export function ShopContribution({game}:{game:Game}){
 const s=shopSummary(game);if(!game.shop||(!s.periods.length&&!s.costs&&!s.paid))return null;
 return <section className="shop-contribution"><h3>书屋留下了什么</h3><dl><div><dt>营业利润合计</dt><dd>{signed(s.operating)}</dd></div><div><dt>整理、活动与修缮费用</dt><dd>−¥{money(s.costs)}</dd></div><div><dt>来信中的售书等收入</dt><dd>{signed(s.receipts)}</dd></div><div><dt>本段经营净贡献</dt><dd>{signed(s.total)}</dd></div><div><dt>仍作为资产保留的押金</dt><dd>¥{money(s.held)}</dd></div><div><dt>期满退回的押金</dt><dd>¥{money(s.returned)}</dd></div><div><dt>押金抵付未付书屋费用</dt><dd>¥{money(s.applied)}</dd></div></dl><p>押金退回是收回自己的钱，不计作营业收入；营业利润已包含应付但尚未付清的本期费用。继续经营时，押金仍计入净资产，但不能当作可用现金。{s.legacy?'旧季度没有拆分的接手费用保留原记录，本表只合计新登记的经营与费用。':''}</p></section>;
}

function ShopVoice({lines,speed,reducedMotion}:{lines:string[];speed:number;reducedMotion:boolean}){
 const [index,setIndex]=useState(0),[count,setCount]=useState(0),line=lines[index];
 useEffect(()=>{setCount(0);},[index]);
 useEffect(()=>{if(reducedMotion||count>=line.length)return;const t=setTimeout(()=>setCount(c=>c+1),speed);return()=>clearTimeout(t);},[count,index,line,reducedMotion,speed]);
 const complete=reducedMotion||count>=line.length;
 return <div className="shop-voice"><span>阿棠 · 柜台旁</span><p aria-label={line}><span aria-hidden="true">{complete?line:line.slice(0,count)}</span></p><div><button disabled={index===0} aria-label="上一段经营说明" onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={14}/></button><small>{index+1} / {lines.length}</small><button onClick={()=>complete?setIndex(i=>Math.min(lines.length-1,i+1)):setCount(line.length)} disabled={complete&&index===lines.length-1}>{complete?index===lines.length-1?'都记在单上了':'听下一段':'显示完整句子'}<ArrowRight size={14}/></button></div></div>;
}
export function ShopStatement({game,speed=30,reducedMotion=false}:{game:Game;speed?:number;reducedMotion?:boolean}){
 const s=shopSummary(game),[quarter,setQuarter]=useState(s.last?.quarter??game.quarter),p=s.periods.find(p=>p.quarter===quarter);
 const scene:SceneId=p?.roof==='sound'?'bookshop-roof-sound':p?.roof==='patched'?'bookshop-roof-patch':'bookshop-quarter-counter';
 const paidWork=game.promises.find(x=>x.kind==='payment'&&x.shopKind==='repair'&&x.status==='paid'&&x.due===quarter);
 const lines=p?[`这一季售书和补货相抵，再付房租、水电和照看费用，${p.profit>=0?'留下':'还差'}${money(Math.abs(p.profit))}元。${p.unpaid>0?'没付清的部分已经列为欠款。':''}`,paidWork?'这季的工程已经按约付款验收，下一季会按修好后的屋面安排营业。':p.notes.at(-1)!,s.next.length?`现在已约定${s.next.length}项书屋付款，具体金额和日期都在单上。`:`押金不是今天能用的现金。${game.shop?.plan==='continue'?'继续经营就留在合约里。':'期满交清书屋费用，再把余额退回。'}`]:['先把接手与押金的条款分清，营业过一季，再来核对实际卖出了多少书。','平时开门与补货照常进行。活动、修缮和轮值，会在后来的经营单上留下变化。',game.flags.shop?'押金已登记为资产，整理费单独列支；交接初期的营业收入不一定覆盖全部成本。':'店仍由程姨经营时，你不会领取她的营业收入；自愿出资与自己的经营分开记录。'];
 return <div className="shop-statement"><header><div><span className="paper-kicker">泊灯书屋 · 随季归档</span><h2>日子，也要算清楚。</h2></div>{s.periods.length>0&&<label>翻到<select aria-label="选择书屋经营季度" value={quarter} onChange={e=>setQuarter(Number(e.target.value))}>{[...s.periods].reverse().map(p=><option key={p.quarter} value={p.quarter}>第{p.quarter}季</option>)}</select></label>}</header><div className="shop-statement-body"><section className="shop-statement-scene"><Stage scene={scene} quarter={quarter} cast={['tang']} speaker="tang" pose={1} camera="wide" shotId={`shop-statement-${quarter}`} framing="center"/><ShopVoice key={quarter} lines={lines} speed={speed} reducedMotion={reducedMotion}/></section><section className="shop-statement-paper"><div className="shop-statement-totals"><div><span>第{quarter}季营业利润</span><strong>{p?signed(p.profit):'尚待结算'}</strong></div><div><span>截至目前经营净贡献</span><strong>{signed(s.total)}</strong></div><div><span>当前可退押金 · 仍占用</span><strong>¥{money(s.held)}</strong></div></div>{p&&<><p className="shop-weather">第{p.quarter}季 · {p.rain?p.heavy?'雨势较重':'有雨':'雨水较少'} · 当季屋面：{roofNames[p.roof]}</p><details className="shop-details"><summary>展开这一季的收支</summary><dl>{([['售书收入',p.sales],['补货支出',-p.purchases],['店铺房租',-p.rent],['水电',-p.utilities],['整理与照看',-p.care],['书损与清理',-p.damage]] as const).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{signed(value)}</dd></div>)}</dl><p>移书、临时停业少卖约 ¥{money(p.lostSales)}，已体现在售书收入中，不再重复扣款。营业现金实际入账 {signed(p.cash)}；本季新增未付费用 ¥{money(p.unpaid)}。</p></details><details className="shop-details"><summary>旧选择，怎样走到这一季</summary>{p.notes.map((n,i)=><p key={i}>{n}</p>)}{paidWork&&<p>本季另已支付 {paidWork.label} ¥{money(paidWork.amount)}，列为修缮投入。保护从下一季起按验收状态计算。</p>}</details></>}
 <details className="shop-details"><summary>当前押金与未来付款</summary>{game.shop?.deposits.length?game.shop.deposits.map(d=><p key={d.id}>{d.label} ¥{money(d.amount)} · {d.status==='held'?'按合约保留，未计入现金':`已退回 ¥${money(d.returned??0)}，抵付书屋未付费用 ¥${money(d.applied??0)}`}</p>):<p>尚无已登记的可退押金。旧账未拆分的款项保持原记录。</p>}{s.next.map(x=><p key={x.id}>第{x.due}季末 · {x.label} · 须付 ¥{money(x.amount)}</p>)}{s.unpaid>0&&<p>书屋尚未付清的费用 ¥{money(s.unpaid)}。</p>}<p>期满交接时，押金先抵书屋未付费用，再退回余额；继续经营则保留为资产，不算收入。</p></details><details className="shop-details"><summary>这一段是否收回了投入</summary><ShopContribution game={game}/></details>{game.shop?.legacy&&<p className="form-note">已发生的旧账保持原样。这里从第{game.shop.startedQuarter}季起登记经营明细，不追溯补造原来的押金或利润。</p>}</section></div></div>;
}
