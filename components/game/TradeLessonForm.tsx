'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check} from 'lucide-react';
import {money,positionValue,quoteTrade,type Asset,type Game} from '@/lib/game/engine';
import {LESSON_COPY,nextLesson,suggestedLessonAmount,TRADE_LESSONS,type Lesson} from '@/lib/game/tutorial';
import {LessonCoach} from './LessonCoach';
import {CompanyComparison,TradePractice} from './TradePractice';
import CompanyHistory from './CompanyHistory';
import {orderImpact} from '@/lib/game/investment';
import {orderMoney} from '@/lib/game/learning';
import {Sparkline} from './FinancialPanels';

export function TradeLessonForm({game,asset,onTrade,lesson='done',onLesson,onSkip,initialSide='buy',initialAmount,onAmount,onCompanies,onResearch}:{game:Game;asset:Asset;onTrade:(side:'buy'|'sell',amount:number)=>boolean;lesson?:Lesson;onLesson:(step:Lesson)=>void;onSkip:()=>void;initialSide?:'buy'|'sell';initialAmount?:number;onAmount?:(amount:number)=>void;onCompanies:()=>void;onResearch?:(id:string)=>void}){
 const training=TRADE_LESSONS.includes(lesson),root=useRef<HTMLDivElement>(null);
 const [side,setSide]=useState<'buy'|'sell'>(training?'buy':initialSide),[amount,setAmount]=useState(training?String(initialAmount??suggestedLessonAmount(game)):'5000');
 const [sellUnits,setSellUnits]=useState(asset.units.toFixed(4)),[saleFraction,setSaleFraction]=useState<number|null>(1);
 const [saleInput,setSaleInput]=useState<'value'|'units'>('value'),[sellValue,setSellValue]=useState((asset.units*asset.price).toFixed(2));
 const effectiveUnits=saleFraction===null?(saleInput==='value'?Number(sellValue)/asset.price:Number(sellUnits)):asset.units*saleFraction;
 const orderAmount=side==='sell'?effectiveUnits*asset.price:Number(amount);
 const submitting=useRef(false);
 const [deskView,setDeskView]=useState<'order'|'facts'>('order');
 let quote:ReturnType<typeof quoteTrade>|null=null,error='';try{quote=quoteTrade(game,asset.id,side,orderAmount);if(side==='sell'&&effectiveUnits>asset.units+1e-8){quote=null;error='卖出份额不能超过当前持仓。';}}catch(e){error=(e as Error).message;}
 const trades=game.transactions.filter(t=>t.quarter===game.quarter&&t.amount>0).length;
 const change=(asset.price/asset.history.at(-2)!-1)*100;
 useEffect(()=>{if(!training)return;const field=lesson==='confirm'?'confirm':lesson==='costs'?'costs':lesson==='amount'?'amount':lesson;root.current?.querySelector(`[data-lesson-field="${field}"]`)?.scrollIntoView({block:'nearest',behavior:'auto'});},[lesson,training]);
 const detail=lesson==='revenue'?`本期披露营收 ${money(asset.revenue)} 万元。这是收入规模，不是利润，也不是现金余额。`:
  lesson==='cashflow'?`本期经营现金${asset.cashflow>=0?'净流入':'净流出'} ${money(Math.abs(asset.cashflow))} 万元。它已扣去日常经营流出；与营收的差额不能直接当作欠款。还需要留意设备投入与到期债务。`:
  lesson==='debt'?`本期负债水平 ${asset.debtRatio.toFixed(1)}%。把它和现金流一起看，不能仅凭比例高低判断能否买入。`:
  lesson==='costs'&&quote?`这笔总预算为 ¥${orderMoney(quote.total)}；手续费 ¥${quote.fee.toFixed(2)}，成交冲击约 ¥${quote.impact.toFixed(2)}。预计买到 ${quote.units.toFixed(2)} 份，交易后现金 ¥${orderMoney(game.cash-quote.total)}。确认这笔钱不会挤掉生活和付款约定。`:undefined;
 function changeAmount(value:string){setAmount(value);if(value!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1e9)onAmount?.(Number(value));}
 function selectAmount(value:string){changeAmount(value);}
 function changeSaleInput(next:'value'|'units'){setSellUnits(effectiveUnits.toFixed(4));setSellValue((effectiveUnits*asset.price).toFixed(2));setSaleInput(next);}
 function submit(){if(submitting.current||!quote)return;submitting.current=true;if(!onTrade(side,orderAmount))submitting.current=false;}
 if(training)return <div ref={root}><GuidedTrade game={game} asset={asset} lesson={lesson} amount={amount} quote={quote} error={error} onAmount={changeAmount} onLesson={onLesson} onSkip={onSkip} onSubmit={submit} onCompanies={onCompanies}/></div>;
 return <div className="trade-lesson-form trade-desk" data-desk-view={deskView} data-order-side={side} ref={root}>
  <nav className="mobile-desk-tabs" aria-label="公司交易分区"><button aria-pressed={deskView==='order'} onClick={()=>setDeskView('order')}>买卖下单</button><button aria-pressed={deskView==='facts'} onClick={()=>setDeskView('facts')}>经营与分红</button></nav>
  <div className="trade-company-overview">
  {training&&<LessonCoach lesson={lesson} detail={detail} onAction={LESSON_COPY[lesson].action?()=>onLesson(nextLesson(lesson)):undefined} onSkip={onSkip}/>}
  <section data-lesson-field="business" className={lesson==='business'?'lesson-focus':''}><span className="eyebrow">{asset.code} · {asset.industry}</span><h2 id="dialog-title">{asset.name}</h2><p className="modal-description compact">{asset.description}</p></section>
  <div className="trade-price"><strong className="mono">{asset.price.toFixed(2)}</strong><span className={`mono change ${change>=0?'up':'down'}`}>{change>=0?'+':''}{change.toFixed(2)}%</span><span>最近公开报价 · 每份</span></div>
  <Sparkline large values={asset.history}/><div className="chart-labels mono"><span>早些时候</span><span>本季</span></div>
  <div className="company-facts">{[['revenue','披露营收',money(asset.revenue),'万'],['cashflow','经营现金流',money(asset.cashflow),'万'],['debt','负债水平',asset.debtRatio.toFixed(1),'%']].map(([field,label,value,unit])=><div key={field} data-lesson-field={field} className={lesson===field?'lesson-focus':''}><span>{label}</span><strong className="mono">{value}<small>{unit}</small></strong></div>)}</div>
  <p className="form-note">已披露资料存在时间差，经营信息不会预告下一季的价格。</p>
  </div><div className="trade-workspace"><div className="trade-tabs"><button className={side==='buy'?'selected':''} onClick={()=>setSide('buy')}>买入</button><button disabled={training} className={side==='sell'?'selected':''} onClick={()=>setSide('sell')}>卖出</button><span>本季已调整 <b className="mono">{trades} / 3</b></span></div>
  <div className="trade-order-body"><div data-lesson-field="amount" className="human-order-amount">
   {side==='buy'?<><label className="amount-label">这次愿意投入多少，含买入手续费<div className="amount-input"><span>¥</span><input type="number" min="0.01" step="100" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" aria-label="买入总预算"/><span>CNY</span></div></label><div className="quick-amounts">{[1000,3000,5000].map(n=><button key={n} onClick={()=>selectAmount(String(n))}>¥{money(n)}</button>)}</div><div className="quick-amounts">{[.1,.25,.5,1].map(n=><button key={n} onClick={()=>selectAmount(String(n===1?game.cash:Math.floor(game.cash*n*100)/100))}>{n===1?'全部现金':`现金的${n*100}%`}</button>)}</div><p>占现金 {game.cash>0?((Number(amount)||0)/game.cash*100).toFixed(1):'0'}%。先给生活和账本上的约定留钱。</p></>:<><div className="sale-input-mode" role="group" aria-label="卖出输入方式"><button aria-pressed={saleInput==='value'} onClick={()=>changeSaleInput('value')}>按金额</button><button aria-pressed={saleInput==='units'} onClick={()=>changeSaleInput('units')}>按份额</button></div>{saleInput==='value'?<label className="amount-label">想卖出多少市值<div className="amount-input"><span>¥</span><input type="number" min="0.01" step="0.01" value={saleFraction===null?sellValue:(effectiveUnits*asset.price).toFixed(2)} onChange={e=>{setSaleFraction(null);setSellValue(e.target.value);}} inputMode="decimal" aria-label="卖出市值金额"/><span>CNY</span></div></label>:<label className="amount-label">卖出多少份<div className="amount-input"><input type="number" min="0.0001" step="0.0001" max={asset.units} value={saleFraction===null?sellUnits:effectiveUnits.toFixed(4)} onChange={e=>{setSaleFraction(null);setSellUnits(e.target.value);}} inputMode="decimal" aria-label="卖出份额"/><span>份</span></div></label>}<p>持有 {asset.units.toFixed(4)} 份，当前市值 ¥{money(positionValue(asset))}。</p><div className="quick-amounts">{[.25,.5,.75,1].map(n=><button key={n} aria-pressed={saleFraction===n} onClick={()=>setSaleFraction(n)}>{n===1?'全部卖出':`卖出${n*100}%`}</button>)}</div><p>以当前报价估算市值 ¥{money(Math.max(0,effectiveUnits)*asset.price)}；这是扣费前的市值，净到账见下方。全部卖出会使用精确持仓份额。</p></>}
  </div>
  <div className="trade-order-summary"><div className="trade-order-details"><div className={`quote-breakdown ${lesson==='costs'?'lesson-focus':''}`} data-lesson-field="costs"><div><span>手续费</span><span className="mono">¥{quote?quote.fee.toFixed(2):'—'}</span></div><div><span>预计成交冲击</span><span className="mono">¥{quote?quote.impact.toFixed(2):'—'}</span></div><div><span>{side==='buy'?'预计买入份额':'预计卖出份额'}</span><span className="mono">{quote?quote.units.toFixed(2):'—'}</span></div><div><span>当前手头现金</span><span className="mono">¥{orderMoney(game.cash)}</span></div><div><span>交易后现金</span><span className="mono">¥{quote?orderMoney(game.cash+(side==='buy'?-quote.total:quote.total)):'—'}</span></div></div>
  {side==='sell'&&quote&&<div className="sell-result-preview"><span>预计净到账 <b>¥{quote.total.toFixed(2)}</b></span><span>其中对应买入成本 ¥{(asset.basis*quote.units/Math.max(asset.units,1e-12)).toFixed(2)}</span><span>预计本次已实现盈亏 <b>¥{(quote.total-asset.basis*quote.units/Math.max(asset.units,1e-12)).toFixed(2)}</b></span></div>}
  {quote&&(()=>{const impact=orderImpact(game,asset,side,orderAmount);return <details className="portfolio-impact"><summary>{side==='buy'?'这笔投入':'这次卖出'}，对总财富有多大影响？</summary><p>成交后证券市值约占净资产 {(impact.exposure*100).toFixed(1)}%，可用现金 ¥{orderMoney(impact.afterCash)}。本季与下季已约定付款共 ¥{orderMoney(impact.due)}。</p><p>{side==='buy'?'只作演算：这次买入的份额若涨跌10%，约影响总财富':'卖出后这部分份额不再承担涨跌；假如继续持有，涨跌10%约影响总财富'} ¥{orderMoney(impact.tenPercentMove)}（{(impact.totalWealthMove*100).toFixed(1)}%）。{side==='buy'?'增加投入会同时放大收益和损失。':'实际剩余持仓与现金见上方。'}</p></details>;})()}{error&&<p className="trade-error" role="status">{error}</p>}</div>
  <button data-lesson-field="confirm" className={`primary-button full ${lesson==='confirm'?'lesson-focus':''}`} disabled={!quote||game.finished||(training&&lesson!=='confirm')} onClick={submit}>{training&&lesson!=='confirm'?'先完成上方教学':`确认${side==='buy'?'买入':'卖出'}${quote?` · ¥${orderMoney(quote.total)}`:''}`}<ArrowRight size={16}/></button>
  <p className="order-execution-note">确认后立即成交；结束本季才推进行情。</p></div></div></div>
  <div className="trade-reading"><details className="trade-history-drawer" open={deskView==='facts'||undefined}><summary>经营事项 / 逐季对比 / 分红到账</summary><CompanyHistory game={game} asset={asset} onResearch={onResearch}/></details>
  <p className="form-note">费用已包含在总额中。确认后立即成交，季末再推进市场。</p><details className="trade-practice-drawer"><summary>不确定收益怎么算？先作一次演算</summary><TradePractice game={game} asset={asset} budget={Number(amount)||3000}/></details>
 </div></div>;
}

function GuidedTrade({game,asset,lesson,amount,quote,error,onAmount,onLesson,onSkip,onSubmit,onCompanies}:{game:Game;asset:Asset;lesson:Lesson;amount:string;quote:ReturnType<typeof quoteTrade>|null;error:string;onAmount:(v:string)=>void;onLesson:(v:Lesson)=>void;onSkip:()=>void;onSubmit:()=>void;onCompanies:()=>void;onResearch?:(id:string)=>void}){
 const step=TRADE_LESSONS.indexOf(lesson),analysis=step<4,impact=quote?orderImpact(game,asset,'buy',Number(amount)):null;
 const [compared,setCompared]=useState(false);
 const facts=[{id:'business',label:'靠什么赚钱',value:asset.industry,unit:'',text:asset.description,why:'先说清它卖什么、谁会付钱，再去看报价。'},
  {id:'revenue',label:'披露营业收入',value:money(asset.revenue),unit:'万元',text:'这是这期卖出产品与服务的收入规模。营收不是利润，也不代表钱已经全部到账。',why:'只记住：生意做了多少，和最后留下多少钱，是两件事。'},
  {id:'cashflow',label:'经营现金流',value:money(asset.cashflow),unit:'万元',text:asset.cashflow>=0?'这期日常经营有现金净流入。不过，设备投入和到期偿债仍可能占用现金。':'这期日常经营的现金净流出。需要结合营收、投入和偿债安排继续看，不能仅凭这个数字预测股价。',why:'把它与刚才的营收放在一起看，别把销售额全当成可用的钱。'},
  {id:'debt',label:'负债水平',value:asset.debtRatio.toFixed(1),unit:'%',text:'这是已经披露的负债水平。要和现金流、投入需求一起看；高低都不是买入后会盈利的保证。',why:'资料有时间差。你已经读过经营情况，接下来只练习一笔自己能承担的小额订单。'}];
 const current=facts[Math.min(3,step)],future=game.promises.filter(p=>p.status==='pending'&&p.kind==='payment'&&p.due<=game.quarter+1).reduce((n,p)=>n+p.amount,0);
 const labels=['业务','营收','现金流','债务','比较','盈亏','金额','费用','确认'];
 const previous=step>0?TRADE_LESSONS[step-1]:null;
 return <div className="guided-trade trade-lesson-form is-learning" data-lesson={lesson}>
  <header className="guided-trade-heading"><span className="paper-kicker">营业室 · 第一笔买入</span><h2>{asset.name}</h2><p>读清资料，再决定一笔小额投入。学习过程不会下单。</p></header>
  <ol className="trade-learning-steps" aria-label="分析与买入步骤">{labels.map((label,i)=><li key={label} aria-current={i===step?'step':undefined} className={i<step?'completed':''}><span>{i<step?<Check size={11}/>:i+1}</span><small>{label}</small></li>)}</ol>
  <div className="guided-trade-content">
   <section className="guided-trade-intent"><span>{analysis?'先看经营':'准备下单'} · {step+1} / {TRADE_LESSONS.length}</span><h3>{LESSON_COPY[lesson].title}</h3><p>{LESSON_COPY[lesson].text}</p><button className="lesson-explore" onClick={onSkip}>结束教学，自行查看资料</button></section>
   <section className="guided-trade-work" data-lesson-field={lesson} aria-label={LESSON_COPY[lesson].title}>
    {analysis?<article className="company-reading" key={lesson}><span>{current.label}</span><strong className={step?'mono':''}>{current.value}<small>{current.unit}</small></strong><p>{current.text}</p><div className="reading-observation">{current.why}</div>{step===3&&<dl className="reading-summary"><div><dt>营收</dt><dd>{money(asset.revenue)} 万元</dd></div><div><dt>经营现金流</dt><dd>{money(asset.cashflow)} 万元</dd></div><div><dt>负债水平</dt><dd>{asset.debtRatio.toFixed(1)}%</dd></div></dl>}</article>:
     lesson==='compare'?<CompanyComparison game={game} asset={asset} onUnderstood={()=>setCompared(true)}/>:lesson==='scenario'?<TradePractice game={game} asset={asset}/>:lesson==='amount'?<div className="learning-budget"><div className="learning-cash"><span>现在能用的现金</span><strong>¥{orderMoney(game.cash)}</strong></div>{future>0&&<p className="budget-promise">本季和下季已有约定支出 ¥{money(future)}，还需要给生活留钱。</p>}<label className="amount-label">这笔投入的总预算，包含费用<div className="amount-input"><span>¥</span><input type="number" min="1" step="100" value={amount} onChange={e=>onAmount(e.target.value)} inputMode="decimal" aria-label="教学买入总预算"/><span className="mono">CNY</span></div></label><div className="quick-amounts">{[1000,3000,5000].map(n=><button key={n} aria-pressed={Number(amount)===n} onClick={()=>onAmount(String(n))}>{money(n)}</button>)}</div><p className="form-note">第一次可以练习 ¥3,000；也可以改成自己愿意承担的金额。这笔钱来自当前存档，投资可能亏损。</p></div>:
     <div className="learning-review"><div className="order-company"><span>{lesson==='confirm'?'准备确认':'尚未成交'}</span><h3>{asset.name} · 买入</h3><strong>¥{quote?orderMoney(quote.total):money(Number(amount)||0)}</strong><small>含手续费的总预算</small></div><dl className="learning-quote"><div><dt>手续费</dt><dd>¥{quote?.fee.toFixed(2)??'—'}</dd></div><div><dt>预计成交冲击</dt><dd>¥{quote?.impact.toFixed(2)??'—'}</dd></div><div><dt>预计买到</dt><dd>{quote?.units.toFixed(2)??'—'} 份</dd></div><div><dt>买入后现金</dt><dd>¥{quote?orderMoney(game.cash-quote.total):'—'}</dd></div></dl>{impact&&<p className="form-note learning-exposure">成交后证券市值占净资产 {(impact.exposure*100).toFixed(1)}%。只作演算：这次买入的份额若涨跌10%，约影响总财富 ¥{orderMoney(impact.tenPercentMove)}；小额投入的收益与损失影响都会较小。</p>}<p className="form-note">{lesson==='confirm'?'点击下方“确认买入”才会扣款并成交。买入不会推进季度。':'先核对费用、份额和剩余现金。此时仍可以返回修改金额。'}</p><button className="paper-back-link" onClick={()=>onLesson('amount')}>修改投入金额<ArrowLeft size={13}/></button></div>}
    {!analysis&&error&&<p className="trade-error" role="status">{error} 请返回修改金额，也可以保留现金、自行探索。</p>}
   </section>
  </div>
  <footer className="guided-trade-navigation"><button onClick={()=>previous?onLesson(previous):onCompanies()}><ArrowLeft size={14}/>{previous?'上一步':'重新选公司'}</button><button className="ink-button" disabled={game.finished||(!analysis&&!quote)||(lesson==='compare'&&!compared)} onClick={()=>lesson==='confirm'?onSubmit():onLesson(nextLesson(lesson))}>{lesson==='confirm'?`确认买入 · ¥${quote?orderMoney(quote.total):'—'}`:lesson==='amount'?'金额选好了，核对费用':LESSON_COPY[lesson].action??'继续'}<ArrowRight size={16}/></button></footer>
 </div>;
}
