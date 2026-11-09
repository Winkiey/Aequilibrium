import type {Asset,Game} from './engine';

export type BusinessKind='orders'|'collection'|'cost'|'credit';
export type BusinessNotice={quarter:number;kind:BusinessKind;direction:1|-1;title:string;fact:string;uncertainty:string;check:string};
export type BusinessOutcome={quarter:number;title:string;description:string;revenueChange:number;cashChange:number;debtChange:number;priceChange:number};
export type CompanyBusiness={referenceRevenue:number;referenceCashRatio:number;referenceDebt:number;referencePrice:number;notice:BusinessNotice;outcomes:BusinessOutcome[]};
export type MarketState={version:2;startedQuarter:number};
type Entropy=(seed:number,quarter:number,channel:string)=>number;
const bound=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const round=(value:number)=>Math.round(value*100)/100;
const PROFILES:Record<string,{exposure:number;topics:BusinessKind[];activity:string}>={
 harbor:{exposure:1.1,topics:['collection','orders','cost','credit'],activity:'冷库扩建与生鲜运输'},
 power:{exposure:.45,topics:['cost','orders','credit','collection'],activity:'设备检修与供能合同'},
 retail:{exposure:1.05,topics:['orders','cost','collection','credit'],activity:'门店销售与补货'},
 medical:{exposure:.65,topics:['collection','orders','credit','cost'],activity:'器材交付与医院付款'},
 signal:{exposure:1.3,topics:['orders','collection','cost','credit'],activity:'网络工程验收与交付'},
 urban:{exposure:1.5,topics:['credit','collection','orders','cost'],activity:'旧城项目与融资安排'},
};
function notice(seed:number,quarter:number,id:string,random:Entropy):BusinessNotice{
 const profile=PROFILES[id],kind=profile.topics[(quarter-1)%profile.topics.length];
 const direction:1|-1=id==='harbor'&&(quarter===1||quarter===4||quarter===9)?-1:random(seed,quarter,id+'-business-notice')>.5?1:-1;
 const selectedKind=id==='harbor'&&(quarter===4||quarter===9)?'collection':kind;
 const copy:Record<BusinessKind,[string,string,string,string]>={
  orders:direction===1?['新增需求进入排期','客户提交了新增需求，尚需完成交付和验收。','新增需求可能改期；交付前还要安排人手和材料。','核对实际营收是否增加，以及新增业务有没有带来现金。']:['部分交付重新排期','客户调整了本季交付安排，原订单仍需逐项确认。','延期范围和补单数量尚未确定，不能直接认定全部收入消失。','核对营收变化、待交付安排和对应回款。'],
  collection:direction===1?['客户提出分批结清','客户交来分批付款安排，具体到账仍以回单为准。','承诺的日期不等于已经收到现金；也可能只收到一部分。','核对经营现金净额是否改善，以及负债是否仍在上升。']:['回款日期需要再确认','部分客户申请延长付款期限，交付与收款可能分属不同季度。','延期能否缩短、剩余款项何时到账，仍需跟踪。','把营收和经营现金净额放在一起看，继续核对融资压力。'],
  cost:direction===1?['采购开始重新议价','公司正在重新议价采购与维护合同。','新报价尚未覆盖全部采购，也未必能抵消其他成本。','核对现金净额是否改善，而不是只看采购消息。']:['采购与维护报价上移','供应商提交了更高的采购或维护报价。','最终采购量与执行价仍待确认，涨价不会等比例变成全部成本。','核对经营现金与债务变化，确认公司能否消化成本。'],
  credit:direction===1?['续贷材料进入审查','银行已受理续贷材料，额度和条件等待最终确认。','受理不等于放款；原有债务仍须按期处理。','核对融资压力是否缓解，并继续观察现金回收。']:['续贷要求增加担保','银行要求补充担保和回款材料，再确认续贷条件。','公司仍可能获得其他安排，补充材料也不代表一定违约。','核对负债水平、经营现金和后续融资安排。'],
 };
 const [title,fact,uncertainty,check]=copy[selectedKind];
 return {quarter,kind:selectedKind,direction,title,fact:`${profile.activity}：${fact}`,uncertainty,check};
}

/** Called at a new game's entry, or only after a legacy quarter has closed. */
export function openMarketQuarter(game:Game,random:Entropy){
 const migrating=!game.market;
 game.market??={version:2,startedQuarter:game.quarter};
 for(const asset of game.assets){
  asset.business??={referenceRevenue:asset.revenue,referenceCashRatio:bound(asset.cashflow/asset.revenue,.02,.2),referenceDebt:asset.debtRatio,referencePrice:asset.price,notice:notice(game.seed,game.quarter,asset.id,random),outcomes:[]};
  asset.business.notice=notice(game.seed,game.quarter,asset.id,random);
 }
 return migrating;
}

/** One shared business outcome changes accounts, valuation and the closing quote. */
export function settleCompany(asset:Asset,seed:number,quarter:number,regime:number,random:Entropy){
 const business=asset.business!,item=business.notice.quarter===quarter?business.notice:notice(seed,quarter,asset.id,random),profile=PROFILES[asset.id];
 const before={revenue:asset.revenue,cash:asset.cashflow,debt:asset.debtRatio,price:asset.price};
 const macro=[.012,.027,.038,-.055][regime];
 // The notice is known; completion and unrelated shocks are not known at entry.
 const completed=random(seed,quarter,asset.id+'-business-completion')<.72;
 const effect=item.direction*(completed?1:.15);
 const surprise=(random(seed,quarter,asset.id+'-business-operations')-.5)*.12;
 const growth=macro*profile.exposure+surprise+(item.kind==='orders'?effect*.09:item.kind==='collection'&&item.direction<0?.015:0);
 asset.revenue=round(Math.max(100,asset.revenue*(1+growth)));
 const cashEffect=item.kind==='collection'?effect*.035:item.kind==='cost'?effect*.025:item.kind==='orders'?effect*.008:effect*.012;
 const pressure=Math.max(0,asset.debtRatio-50)*.0008+(regime===3?.012:0);
 const margin=bound((before.cash/before.revenue)*.45+business.referenceCashRatio*.55+cashEffect+macro*.25-pressure+(random(seed,quarter,asset.id+'-business-cash')-.5)*.045,-.08,.25);
 asset.cashflow=round(asset.revenue*margin);
 asset.debtRatio=round(bound(asset.debtRatio+(asset.cashflow<0?1.8:-.3)+(regime===3?1.2:0)-(item.kind==='credit'?effect*3:0),5,95));
 asset.trueRevenue=asset.revenue;asset.trueCashflow=asset.cashflow;
 // Actual disclosed revenue, cash conversion and debt now all enter valuation.
 const relativeRevenue=asset.revenue/business.referenceRevenue;
 const cashRatio=asset.cashflow/asset.revenue;
 asset.fundamental=Math.max(.1,business.referencePrice*Math.pow(relativeRevenue,.6)*Math.exp((cashRatio-business.referenceCashRatio)*1.8-(asset.debtRatio-business.referenceDebt)*.006));
 const repricing=Math.log(asset.fundamental/asset.price)*.22;
 const noise=(random(seed,quarter,asset.id+'price')-.5)*.14;
 const tail=random(seed,quarter,asset.id+'tail')<.09?(random(seed,quarter,asset.id+'jump')-.65)*.55:0;
 asset.price=Math.max(.1,round(asset.price*Math.exp(bound(repricing+macro*.35+noise+tail,-.65,.4))));
 asset.history.push(asset.price);
 asset.disclosures=[...(asset.disclosures??[]),{quarter,price:asset.price,revenue:asset.revenue,cashflow:asset.cashflow,debtRatio:asset.debtRatio}];
 const result=completed?(item.direction>0?'部分有利条件在本季落实，经营数字仍包括其他业务与成本。':'本季受到这项压力影响，经营数字同时反映其他业务的变化。'):'季初所述条件未完全落实，本季影响较小；实际经营结果还包括其他业务与成本。';
 business.outcomes.push({quarter,title:item.title,description:result,revenueChange:round(asset.revenue-before.revenue),cashChange:round(asset.cashflow-before.cash),debtChange:round(asset.debtRatio-before.debt),priceChange:round((asset.price/before.price-1)*100)});
}

/** This view reads only entry notices and already-published closing outcomes. */
export function publicBusiness(asset:Asset){
 const business=asset.business;
 return business?{notice:{...business.notice},last:business.outcomes.at(-1)?{...business.outcomes.at(-1)!}:null}:null;
}
export function validMarket(game:Game){
 if(game.market===undefined)return game.assets.every(a=>a.business===undefined);
 if(game.market?.version!==2||!Number.isInteger(game.market.startedQuarter)||game.market.startedQuarter<1||game.market.startedQuarter>game.quarter)return false;
 return game.assets.every(asset=>{
  const b=asset.business;if(!b||![b.referenceRevenue,b.referenceCashRatio,b.referenceDebt,b.referencePrice].every(Number.isFinite)||b.referenceRevenue<=0||b.referencePrice<=0||b.referenceCashRatio<.02||b.referenceCashRatio>.2||b.referenceDebt<5||b.referenceDebt>95)return false;
  const n=b.notice;
  if(!n||!Number.isInteger(n.quarter)||n.quarter<game.market!.startedQuarter||n.quarter>game.quarter||!['orders','collection','cost','credit'].includes(n.kind)||![1,-1].includes(n.direction)||!['title','fact','uncertainty','check'].every(k=>typeof n[k as keyof BusinessNotice]==='string'))return false;
  return Array.isArray(b.outcomes)&&b.outcomes.length<=12&&b.outcomes.every((o,index,list)=>o&&Number.isInteger(o.quarter)&&o.quarter>=game.market!.startedQuarter&&o.quarter<=game.quarter&&(index===0||o.quarter>list[index-1].quarter)&&typeof o.title==='string'&&typeof o.description==='string'&&[o.revenueChange,o.cashChange,o.debtChange,o.priceChange].every(Number.isFinite));
 });
}
