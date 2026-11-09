import {money,REGIMES,type Asset,type Disclosure,type Game} from './engine';
import {publicBusiness} from './market';

export const COMPANY_QUESTIONS:Record<string,string>={
 harbor:'扩建需要的投入，与客户回款的日期是否撞在一起？订单增加以后，钱何时收到？',
 power:'设备检修还要投入多少？经营现金净额能否持续支持日常经营和偿债？',
 retail:'增长来自新增门店，还是原有门店？目前的汇总营收，还不能回答每家店的盈利情况。',
 medical:'完成验收和实际付款相隔多久？已交付的产品，有多少已经转成到账现金？',
 signal:'合同分几年履行，前期要投入多少？合同总金额不能直接当成本季收入。',
 urban:'土地估价怎样变成可用现金？银行续贷与出售安排是否已经确认？',
};
const signed=(n:number,digits=1)=>`${n>0?'+':''}${n.toFixed(digits)}`;
const growth=(now:number,before:number)=>before===0?null:(now-before)/Math.abs(before)*100;
export const disclosureDate=(quarter:number)=>quarter===0?'开局披露':`第${quarter}季末披露`;
export function companyNews(asset:Asset){
 const entries=[...(asset.disclosures??[])].sort((a,b)=>a.quarter-b.quarter),last=entries.at(-1),previous=entries.at(-2);
 // Only published observations are read. Private fundamental/true* fields never
 // enter newspaper copy; older saves are not given invented disclosure dates.
 const current:Pick<Disclosure,'revenue'|'cashflow'|'debtRatio'|'price'>=last??asset;
 const revenueGrowth=previous?growth(current.revenue,previous.revenue):null;
 const cashChange=previous?current.cashflow-previous.cashflow:null;
 const debtChange=previous?current.debtRatio-previous.debtRatio:null;
 const priceChange=previous?growth(current.price,previous.price):null;
 const baseline:Record<string,string>={harbor:'冷库扩建，客户账期仍需跟踪',power:'设备改造与供能收入并行',retail:'十二家门店，汇总收入之外还有成本',medical:'验收通过以后，仍要等待付款',signal:'合同写着未来，投入发生在眼前',urban:'土地与厂房背后，可用现金仍需核对'};
 const headline=current.cashflow<0?'经营现金出现净流出':revenueGrowth!==null&&revenueGrowth>0&&cashChange!==null&&cashChange<0?'营收增加，经营现金净额走弱':debtChange!==null&&debtChange>1?'负债水平上移，偿付安排值得继续核对':revenueGrowth!==null&&revenueGrowth<0?'营收回落，继续跟踪回款':baseline[asset.id]??'最新经营资料已披露';
 const comparison=previous?`与${disclosureDate(previous.quarter)}相比，营收变化${revenueGrowth===null?'原基数为零，无法计算增幅':signed(revenueGrowth)+'%'}，经营现金净额变动${signed(cashChange!,0)}万元，负债水平变动${signed(debtChange!)}个百分点。`:'尚无上一份披露可供对照。这些数字是观察的起点，不能据此认定正在增长。';
 return{business:publicBusiness(asset),id:asset.id,name:asset.name,industry:asset.industry,description:asset.description,current,previous,asOf:last?disclosureDate(last.quarter):'当前可查资料 · 旧档未保留披露日期',asOfShort:last?disclosureDate(last.quarter).replace('披露',''):'当前资料',headline,comparison,priceChange,
  facts:`营收${money(current.revenue)}万元，经营现金净额${money(current.cashflow)}万元，负债水平${current.debtRatio.toFixed(1)}%。`,
  interpretation:current.cashflow>=0?'日常经营目前有现金净流入；它不是账户现金余额，也没有替你扣完设备投入和未来到期本金。':'日常经营目前需要消耗现金；还需核对现有资金、后续融资与到期付款，不能只凭营收规模判断。',
  question:COMPANY_QUESTIONS[asset.id]??'回款、经营投入和偿债的日期是否匹配？'};
}
export function seasonalNews(game:Game){
 const companies=game.assets.map(companyNews),featured=companies[(game.quarter-1)%companies.length];
 const comparable=companies.filter(c=>c.priceChange!==null),up=comparable.filter(c=>c.priceChange!>0).length,down=comparable.filter(c=>c.priceChange!<0).length;
 const market=comparable.length?`最近两个已记录的披露时点之间，${up}家公司报价上涨，${down}家下跌，${comparable.length-up-down}家持平。报价变化记录的是已经发生的结果。`:'开局资料已公开，尚无本局上一季末的对照。六家公司的业务、规模和回款方式不同，低单价不等于便宜。';
 const street=game.flags.handover||game.flags.retired?{title:'书屋开始为交接留出时间',body:'交接清单与既有约定仍需分别完成。停止新增投入，不会让原来的付款责任自动消失。'}:game.flags.readers?{title:'周五的长桌，仍给街坊留着位置',body:'活动带来往来，也需要开门、收拾和补充物品。先前答应的时间，与新的工作安排需要一起核对。'}:game.flags.shop?{title:'书屋的钥匙，有了新的照看者',body:'校对工作与店里的营业安排并行。经营收入、生活费用和已经答应的付款，各有各的日期。'}:{title:'老街的日子，照原来的步调往前',body:'书屋还在等一个正式答复。暂不接手保留了考虑时间，之后仍可以重新安排。'};
 const notes=[street];
 if(game.flags.roof)notes.push({title:'屋顶整修已列入安排',body:'完整修缮的选择已经记下；实际付款仍以账本中到期约定的状态为准。'});
 else if(game.flags.temporaryRoof)notes.push({title:'漏雨处先作局部修补',body:'局部工程减轻了眼前支出，后续维护仍需留出时间与预算。'});
 const claim=game.promises.find(p=>p.id==='main-3-0');
 if(claim)notes.push({title:'印坊的旧往来，仍有一页记录',body:claim.status==='pending'?`原借据记着第${claim.due}季的回收安排。约定收回不等于已经到账，交货与付款仍是两件事。`:claim.status==='paid'?'这笔往来已按实际收回数额入账，后续安排可以另行决定。':claim.status==='cancelled'?'旧约定已修订或清偿，实际收到的款项与损失可以在账本核对。':'原回收安排未按期实现；书面约定没有消除回款风险。'});
 const past=[...game.history].reverse().find(h=>h.quarter<game.quarter);
 if(past)notes.push({title:`第${past.quarter}季留下的回声 · ${past.title}`,body:past.response});
 const commitments=game.promises.filter(p=>p.status==='pending'&&p.due<=game.quarter+1).sort((a,b)=>a.due-b.due);
 const marketTitle=game.quarter===1?'新港区改造公示，商铺将分段施工':comparable.length?`${up}家上涨、${down}家下跌，最新报价公布`:`${REGIMES[game.regime]} · 季度资料重新汇编`;
 const marketBody=game.quarter===1?'沿线商铺将分阶段施工，具体安排尚待确认。雾港冷链新增库容预计分批投用，客户的付款安排仍受关注。':market;
 const marketNote=game.quarter===1?'开局报价是这段记录的起点。第一份季末对照，会在结束本季以后出现。':`本季市况：${REGIMES[game.regime]}。${game.regime===3?'续贷条件趋紧，部分企业推迟投资。':'本版只比较已记录的披露，不把报价变化当作经营改善。'}`;
 return{companies,featured,market:marketBody,marketTitle,marketQuestion:marketNote,street,notes,commitments};
}
