'use client';
import {useState} from 'react';
import {READING_STUDY} from '@/lib/game/reading-study';

/** Original schematic figures; their assumptions are separate from the game market. */
export default function ReadingFigure({chapter}:{chapter:string}){
 const [alternative,setAlternative]=useState(false);
 const study=READING_STUDY[chapter];
 if(chapter==='prices'){
  const x=alternative?184.5:115.5,y=82;
  return <figure className="reader-diagram reader-working-figure"><figcaption><span>同样涨价，不同来由</span><span>点选条件</span></figcaption><div className="reader-figure-controls"><button aria-pressed={!alternative} onClick={()=>setAlternative(false)}>纸张供给减少</button><button aria-pressed={alternative} onClick={()=>setAlternative(true)}>读者需求增加</button></div><svg viewBox="0 0 310 190" role="img" aria-label={alternative?'需求增加，示意均衡价格和成交量都上升':'供给减少，示意均衡价格上升、成交量下降'}><path className="figure-axis" d="M35 14V160H280"/><text x="8" y="21">价</text><text x="283" y="177">量</text><path className="figure-ghost" d="M35 40L265 160M35 160L265 40"/><path className="figure-demand" d={alternative?'M58 16L265 124':'M35 40L265 160'}/><path className="figure-supply" d={alternative?'M35 160L265 40':'M35 124L242 16'}/><path className="figure-guide" d={`M35 ${y}H${x}V160`}/><circle className="figure-old-point" cx="150" cy="100" r="3"/><circle className="figure-new-point" cx={x} cy={y} r="4"/><text x={x+10} y={y-8}>现在</text><text x="155" y="117">原来</text><text x="40" y="183">其他条件不变的示意</text></svg><div className="reader-figure-result" aria-live="polite">{alternative?'价格上升 · 成交量增加':'价格上升 · 成交量减少'}</div><p>曲线为编者绘制的简化关系。多种条件同时变化时，需要重新比较；它不能直接预测股价。</p></figure>;
 }
 if(chapter==='portfolio'){
  const results=alternative?[[20,-20,0],[-20,20,0]]:[[20,20,20],[-20,-20,-20]];
  return <figure className="reader-diagram reader-working-figure"><figcaption><span>各持一半，结果怎样</span><span>点选关系</span></figcaption><div className="reader-figure-controls"><button aria-pressed={!alternative} onClick={()=>setAlternative(false)}>同涨同跌</button><button aria-pressed={alternative} onClick={()=>setAlternative(true)}>反向变动</button></div><div className="reader-scenario-chart">{results.map((values,s)=><div key={s}><span>情景{s===0?'甲':'乙'} · 概率 ½</span><svg viewBox="0 0 270 155" role="img" aria-label={`资产甲${values[0]}%，资产乙${values[1]}%，等权组合${values[2]}%`}><path className="figure-axis" d="M15 74H255"/>{values.map((v,i)=>{const x=39+i*82;return <g key={i}><rect className={i===2?'figure-combined':'figure-asset'} x={x} y={v>=0?74-v*2:74} width="28" height={Math.abs(v)*2||1.5}/><text x={x+14} y={v>=0?24:128} textAnchor="middle">{v>0?'+':''}{v}%</text><text x={x+14} y="151" textAnchor="middle">{['资产甲','资产乙','组合'][i]}</text></g>;})}</svg></div>)}</div><p>两种等可能的单期情景，初始各持一半，忽略费用。共同变动不同，组合波动就不同；现实关系可能改变。</p></figure>;
 }
 if(chapter==='cycle'){
  const price=alternative?108:103,real=(105/price-1)*100;
  return <figure className="reader-diagram reader-working-figure"><figcaption><span>数字与购买力</span><span>点选物价</span></figcaption><div className="reader-figure-controls"><button aria-pressed={!alternative} onClick={()=>setAlternative(false)}>物价上涨 3%</button><button aria-pressed={alternative} onClick={()=>setAlternative(true)}>物价上涨 8%</button></div><div className="reader-purchasing-bars">{[['一年前的一篮',100],['一年后的账户',105],['同一篮的现价',price]].map(([label,value])=><div key={label}><span>{label}</span><div><i style={{width:`${Number(value)/120*100}%`}}/></div><b>{value} 元</b></div>)}</div><div className="reader-figure-result" aria-live="polite">实际购买力 {real>0?'+':''}{real.toFixed(2)}%<small>105 ÷ {price} − 1</small></div><p>账户名义增加5元。一期购买力要与同期物价比较；图中是编者设定的同一篮商品。</p></figure>;
 }
 return <figure className="reader-diagram"><figcaption><span>关系小图</span><span>编者绘制</span></figcaption><ol>{study.chain.map((node,i)=><li key={node}><span>{i+1}</span><p>{node}</p></li>)}</ol><p>{study.chainNote}</p></figure>;
}
