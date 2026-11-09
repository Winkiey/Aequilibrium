import {money,quoteTrade,type Asset,type Game,type Option} from './engine';
import {effectiveCash,evidenceFor,researchTarget} from './research';
export const orderMoney=(n:number)=>n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
/** Public facts and hypothetical orders only. Never read the hidden price model. */
export function tradePractice(game:Game,id:string,budget:number,change:number){
 const buy=quoteTrade(game,id,'buy',budget),a=game.assets.find(a=>a.id===id)!;
 const received=(price:number)=>{
  const isolated={...game,finished:false,transactions:[],assets:game.assets.map(x=>x.id===id?{...x,price,units:buy.units,basis:buy.total}:x)};
  return quoteTrade(isolated,id,'sell',buy.units*price).total;
 };
 const price=a.price*(1+change),proceeds=received(price);
 let lo=a.price,hi=a.price*2;for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(received(mid)<buy.total)lo=mid;else hi=mid;}
 return{units:buy.units,cost:buy.total,buyFee:buy.fee,price,proceeds,profit:proceeds-buy.total,breakEven:(lo+hi)/2,currentPrice:a.price};
}
export function companyObservation(a:Asset){
 return{cashShare:a.revenue>0?a.cashflow/a.revenue*100:0,
  strength:a.cashflow>0?'本期经营有现金净流入':'本期经营需要消耗现金',
  question:a.debtRatio>=55?'债务较重，后续偿付与融资条件要继续核对。':a.cashflow<=0?'先查清现金流出是短期投入还是经营困难。':'仍要关注设备投入、回款和下一期经营是否延续。'};
}
export function decisionFacts(option:Option,game?:Game){
 const e=option.effects,now=(game?effectiveCash(game,e):e.cash??0)-(e.buy?.budget??0),facts:{label:string;text:string}[]=[];
 facts.push({label:'现在',text:e.sell?'会卖出部分持仓，净到账按成交回单核对':now<0?`支付 ¥${money(-now)}`:now>0?`收到 ¥${money(now)}`:'没有即时现金收支'});
 if(e.research&&game){const id=researchTarget(game,e.research);facts.push({label:'材料',text:evidenceFor(game,id)?'本季同一份材料已核验，不重复收费':`核验 ${game.assets.find(a=>a.id===id)?.name??id} 本季材料，文件会保存在公司资料中`});}
 if(e.buy)facts.push({label:'投入',text:`其中 ¥${money(e.buy.budget)} 用于买入股份，之后会随价格变化`});
 for(const p of e.promises??[])facts.push({label:'以后',text:`第${p.due}季${p.kind==='payment'?'须付':'预计收回'} ¥${money(p.amount)} · ${p.label}${p.kind==='receipt'&&(p.chance??.7)<1?'（可能无法收回）':''}`});
 for(const p of game?.promises??[])if(p.status==='pending'&&p.kind==='payment'&&p.due<=game!.quarter&&!(e.cancelPayment&&p.id.includes(e.cancelPayment)))facts.push({label:'已约定',text:`本季结算仍须付 ¥${money(p.amount)} · ${p.label}`});
 if((e.fraud??0)>0)facts.push({label:'责任',text:'会留下违规行为的记录，后续可能被调查'});
 if(e.closeClaim||e.extendClaim)facts.push({label:'旧约定',text:'原有债权将结束或改约，请与新收款条件一起核对'});
 if(e.cancelPayment)facts.push({label:'旧约定',text:'修订原付款安排，以答复后的账本为准'});
 return facts;
}
export function firstPurchaseReview(game:Game,quarter:number){
 const buys=game.transactions.filter(t=>t.quarter===quarter&&t.side==='buy');
 if(!buys.length)return null;
 const t=buys[0],a=game.assets.find(a=>a.id===t.asset)!;
 const isolated={...game,finished:false,transactions:[],assets:game.assets.map(x=>x.id===a.id?{...x,units:t.units,basis:t.amount}:x)};
 const sale=quoteTrade(isolated,a.id,'sell',t.units*a.price);
 return{name:a.name,cost:t.amount,units:t.units,market:t.units*a.price,netSale:sale.total,profit:sale.total-t.amount};
}
