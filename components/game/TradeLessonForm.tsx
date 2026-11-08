'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {money,positionValue,quoteTrade,type Asset,type Game} from '@/lib/game/engine';
import {LESSON_COPY,nextLesson,TRADE_LESSONS,type Lesson} from '@/lib/game/tutorial';
import {LessonCoach} from './LessonCoach';
import {Sparkline} from './FinancialPanels';

export function TradeLessonForm({game,asset,onTrade,lesson='done',onLesson,onSkip,initialSide='buy'}:{game:Game;asset:Asset;onTrade:(side:'buy'|'sell',amount:number)=>boolean;lesson?:Lesson;onLesson:(step:Lesson)=>void;onSkip:()=>void;initialSide?:'buy'|'sell'}){
 const training=TRADE_LESSONS.includes(lesson),root=useRef<HTMLDivElement>(null);
 const [side,setSide]=useState<'buy'|'sell'>(training?'buy':initialSide),[amount,setAmount]=useState(training?'3000':'5000');
 let quote:ReturnType<typeof quoteTrade>|null=null,error='';try{quote=quoteTrade(game,asset.id,side,Number(amount));}catch(e){error=(e as Error).message;}
 const trades=game.transactions.filter(t=>t.quarter===game.quarter&&t.amount>0).length;
 const change=(asset.price/asset.history.at(-2)!-1)*100;
 useEffect(()=>{if(!training)return;const field=lesson==='confirm'?'confirm':lesson==='costs'?'costs':lesson==='amount'?'amount':lesson;root.current?.querySelector(`[data-lesson-field="${field}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'});},[lesson,training]);
 const detail=lesson==='revenue'?`本期披露营收 ${money(asset.revenue)} 万元。这是收入规模，不是利润，也不是现金余额。`:
  lesson==='cashflow'?`本期经营现金${asset.cashflow>=0?'净流入':'净流出'} ${money(Math.abs(asset.cashflow))} 万元。它已扣去日常经营流出；与营收的差额不能直接当作欠款。还需要留意设备投入与到期债务。`:
  lesson==='debt'?`本期负债水平 ${asset.debtRatio.toFixed(1)}%。把它和现金流一起看，不能仅凭比例高低判断能否买入。`:
  lesson==='costs'&&quote?`这笔总预算为 ¥${money(quote.total)}；手续费 ¥${quote.fee.toFixed(2)}，成交冲击约 ¥${quote.impact.toFixed(2)}。预计买到 ${quote.units.toFixed(2)} 份，交易后现金 ¥${money(game.cash-quote.total)}。确认这笔钱不会挤掉生活和付款约定。`:undefined;
 function selectAmount(value:string){setAmount(value);if(lesson==='amount')onLesson('costs');}
 return <div className={`trade-lesson-form ${training?'is-learning':''}`} ref={root}>
  {training&&<LessonCoach lesson={lesson} detail={detail} onAction={LESSON_COPY[lesson].action?()=>onLesson(nextLesson(lesson)):undefined} onSkip={onSkip}/>}
  <section data-lesson-field="business" className={lesson==='business'?'lesson-focus':''}><span className="eyebrow">{asset.code} · {asset.industry}</span><h2 id="dialog-title">{asset.name}</h2><p className="modal-description compact">{asset.description}</p></section>
  <div className="trade-price"><strong className="mono">{asset.price.toFixed(2)}</strong><span className={`mono change ${change>=0?'up':'down'}`}>{change>=0?'+':''}{change.toFixed(2)}%</span><span>最近公开报价 · 每份</span></div>
  <Sparkline large values={asset.history}/><div className="chart-labels mono"><span>早些时候</span><span>本季</span></div>
  <div className="company-facts">{[['revenue','披露营收',money(asset.revenue),'万'],['cashflow','经营现金流',money(asset.cashflow),'万'],['debt','负债水平',asset.debtRatio.toFixed(1),'%']].map(([field,label,value,unit])=><div key={field} data-lesson-field={field} className={lesson===field?'lesson-focus':''}><span>{label}</span><strong className="mono">{value}<small>{unit}</small></strong></div>)}</div>
  <p className="form-note">已披露资料存在时间差，经营信息不会预告下一季的价格。</p>
  <div className="trade-tabs"><button className={side==='buy'?'selected':''} onClick={()=>setSide('buy')}>买入</button><button disabled={training} className={side==='sell'?'selected':''} onClick={()=>setSide('sell')}>卖出</button><span>本季已调整 <b className="mono">{trades} / 3</b></span></div>
  <div data-lesson-field="amount" className={lesson==='amount'?'lesson-focus':''}><label className="amount-label">{side==='buy'?'投入总额，含手续费':'拟卖出的当前市值'}<div className="amount-input"><span>¥</span><input type="number" min="1" step="100" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" aria-label="交易金额"/><span className="mono">CNY</span></div></label>
   <div className="quick-amounts">{[3000,5000,10000].map(n=><button key={n} className={lesson==='amount'&&n===3000?'guided-amount':''} onClick={()=>selectAmount(String(n))}>{money(n)}</button>)}{side==='sell'&&asset.units>0&&<button onClick={()=>setAmount(String(positionValue(asset)))}>全部</button>}</div>
   {lesson==='amount'&&<button className="lesson-custom-amount" disabled={!quote} onClick={()=>onLesson('costs')}>检查我填写的金额<ArrowRight size={14}/></button>}
  </div>
  <div className={`quote-breakdown ${lesson==='costs'?'lesson-focus':''}`} data-lesson-field="costs"><div><span>手续费</span><span className="mono">¥{quote?quote.fee.toFixed(2):'—'}</span></div><div><span>预计成交冲击</span><span className="mono">¥{quote?quote.impact.toFixed(2):'—'}</span></div><div><span>{side==='buy'?'预计买入份额':'预计卖出份额'}</span><span className="mono">{quote?quote.units.toFixed(2):'—'}</span></div><div><span>当前手头现金</span><span className="mono">¥{money(game.cash)}</span></div><div><span>交易后现金</span><span className="mono">¥{quote?money(game.cash+(side==='buy'?-quote.total:quote.total)):'—'}</span></div></div>
  {error&&<p className="trade-error" role="status">{error}</p>}
  <button data-lesson-field="confirm" className={`primary-button full ${lesson==='confirm'?'lesson-focus':''}`} disabled={!quote||game.finished||(training&&lesson!=='confirm')} onClick={()=>onTrade(side,Number(amount))}>{training&&lesson!=='confirm'?'先完成上方教学':`确认${side==='buy'?'买入':'卖出'}${quote?` · ¥${money(quote.total)}`:''}`}<ArrowRight size={16}/></button>
  <p className="form-note">费用已包含在总额中。确认后立即成交，季末再推进市场。</p>
 </div>;
}
