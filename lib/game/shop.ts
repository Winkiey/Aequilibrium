import type {Game,StoryEvent,Effects,PromiseEntry} from './engine';

export type RoofCondition='unrepaired'|'patched'|'sound';
export type ShopEffect={deposit?:number;cost?:boolean;takeover?:boolean;roof?:RoofCondition;plan?:'continue'|'handover';shared?:boolean};
export type ShopDeposit={id:string;label:string;amount:number;quarter:number;status:'held'|'settled';returned?:number;applied?:number};
export type ShopPeriod={quarter:number;sales:number;purchases:number;rent:number;utilities:number;care:number;damage:number;lostSales:number;profit:number;cash:number;unpaid:number;rain:boolean;heavy:boolean;roof:RoofCondition;notes:string[]};
export type ShopState={version:1;startedQuarter:number;legacy:boolean;openedQuarter?:number;roof:RoofCondition;plan:'undecided'|'continue'|'handover';shared:boolean;deposits:ShopDeposit[];periods:ShopPeriod[]};
type Entropy=(seed:number,quarter:number,channel:string)=>number;
type Cash=(game:Game,amount:number,label:string,category:string,asset?:string,shopRef?:string)=>void;
const round=(v:number)=>Math.round(v*100)/100;
export const shopDepositValue=(game:Game)=>(game.shop?.deposits??[]).filter(d=>d.status==='held').reduce((sum,d)=>sum+d.amount,0);

/** Legacy quarters close unchanged. Only future operations receive the new model. */
export function openShopQuarter(game:Game){
 if(game.shop||game.finished)return false;
 const ownership=game.history.find(h=>(h.eventId==='main-1'||h.eventId==='main-6')&&h.optionIndex===0&&h.snapshot?.options[0].effects.flags?.shop);
 const pastRepair=game.promises.some(p=>p.status==='paid'&&(p.id.startsWith('main-4-')||p.label==='屋顶局部修补'));
 game.shop={version:1,startedQuarter:game.quarter,legacy:game.quarters.length>0,...(game.flags.shop?{openedQuarter:ownership?.quarter??game.quarter}:{}),roof:game.quarter>5&&!ownership?'sound':pastRepair&&game.flags.roof?'sound':game.flags.temporaryRoof?'patched':'unrepaired',plan:game.flags.retired||game.flags.handover?'handover':game.flags.keepShop?'continue':'undecided',shared:false,deposits:[],periods:[]};
 return true;
}

export function postShopChoiceCash(game:Game,event:StoryEvent,amount:number,effect:ShopEffect,write:Cash){
 const deposit=effect.deposit??0;
 if(deposit>0){
  const id=`${event.id}-${game.quarter}`,remaining=round(amount+deposit);
  if(remaining)write(game,remaining,event.title+' · 整理与布置','shop-investment');
  write(game,-deposit,'书屋接手押金','shop-deposit',undefined,id);
  game.shop!.deposits.push({id,label:'接手合约押金',amount:deposit,quarter:game.quarter,status:'held'});
 }else write(game,amount,event.title,effect.cost?(amount<0?'shop-investment':'shop-receipt'):'event');
}

export function applyShopChoice(game:Game,event:StoryEvent,index:number,effects:Effects){
 if(!game.shop||event.shopRevision!==1)return;
 const change=effects.shop;if(!change)return;
 if(change.takeover&&game.shop.openedQuarter===undefined)game.shop.openedQuarter=game.quarter;
 if(change.plan){game.shop.plan=change.plan;if(change.plan==='handover')game.flags.keepShop=0;}
 if(change.shared)game.shop.shared=true;
 if(change.roof){
  if(event.id==='main-5'&&game.flags.shop){
   // A selected job is not a completed job. Protection starts after payment.
   const promise=game.promises.find(p=>p.status==='pending'&&p.due===5&&(p.id.startsWith('main-4-')||p.label==='屋顶局部修补'));
   if(promise){promise.shopKind='repair';promise.shopRoof=change.roof;}
  }else game.shop.roof=change.roof;
 }
}

export function shopPromisePayment(game:Game,promise:PromiseEntry,write:Cash){
 if(!game.shop||!promise.shopKind)return false;
 if(promise.shopKind==='deposit'){
  const id=promise.id;
  write(game,-promise.amount,promise.label,'shop-deposit',undefined,id);
  game.shop.deposits.push({id,label:promise.label,amount:promise.amount,quarter:game.quarter,status:'held'});
 }else{
  write(game,-promise.amount,promise.label,'shop-investment');
  if(promise.shopRoof)game.shop.roof=promise.shopRoof;
 }
 return true;
}

/** Purchases replenish books actually sold; there is no hidden inventory game. */
export function shopOperatingResult(game:Game,random:Entropy):ShopPeriod{
 const state=game.shop!,q=game.quarter,age=Math.max(0,q-(state.openedQuarter??q));
 const repeat=Math.min(3,Math.max(0,game.flags.readers??0))*900;
 const catalogue=Math.min(3,Math.max(0,game.flags.catalog??0))*650;
 const established=Math.min(4,age)*600;
 const seasonal=[1,.94,1.07,1.03][(q-1)%4];
 const climate=random(game.seed,q,'shop-rain')<[.45,.25,.65,.55][(q-1)%4];
 const heavy=climate&&random(game.seed,q,'shop-rain-strength')<.24;
 const demand=(.91+random(game.seed,q,'shop-demand')*.18)*(game.regime===3?.88:1)*seasonal;
 const opening=age===0?.72:age===1?.9:1;
 const planned=(9300+established+repeat+catalogue)*demand*opening;
 const vulnerable=state.roof==='unrepaired'?1:state.roof==='patched'?.45:0;
 const lostSales=round(climate?planned*vulnerable*(heavy?.28:.07):0);
 const damage=round(climate?vulnerable*((heavy?2800:650)+random(game.seed,q,'shop-book-damage')*(heavy?1800:650)):0);
 const sales=round(Math.max(0,planned-lostSales)),purchases=round(sales*.56);
 const rent=1500,utilities=400,care=state.shared?500:800;
 const profit=round(sales-purchases-rent-utilities-care-damage),notes:string[]=[];
 if(age<2)notes.push('接手初期保留了交接与整理时段，本季不是完整营业期。');
 if(repeat>0)notes.push('之前留下的读者活动让熟面孔再次来找书，售书收入已包含这些往来。');
 if(catalogue>0)notes.push('整理过的目录用于接找书和补书订单，本季销售也来自这些已完成的订单。');
 if(climate&&state.roof==='sound')notes.push('已验收的整修保护了窗边书架，本季没有发生漏雨书损或因此停业。');
 if(climate&&vulnerable>0)notes.push(`屋面仍有未完成的部分，本季移书和停业少卖约 ¥${lostSales.toFixed(2)}，另有书损与清理 ¥${damage.toFixed(2)}。`);
 if(!climate&&state.roof==='patched')notes.push('本季雨水较少，局部修补没有发生额外书损；余下屋面仍未完成。');
 if(state.shared)notes.push('共同轮值分担了整理与闭店，本季付费照看支出比原安排少 ¥300。');
 if(game.regime===3)notes.push('街区支出收紧，本季售书受到影响。');
 if(!notes.length)notes.push('日常开门、售书与补货照原安排进行，本季没有新增特殊收入。');
 return{quarter:q,sales,purchases,rent,utilities,care,damage,lostSales,profit,cash:0,unpaid:0,rain:climate,heavy,roof:state.roof,notes};
}

export function settleShop(game:Game,random:Entropy,write:Cash,liquidate:(game:Game,required:number)=>void){
 if(!game.shop||!game.flags.shop)return;
 if(game.shop.periods.some(p=>p.quarter===game.quarter))throw new Error('这一季书屋经营已经结算。');
 game.shop.openedQuarter??=game.quarter;
 const result=shopOperatingResult(game,random);
 if(result.profit<0)liquidate(game,-result.profit);
 const paid=result.profit<0?Math.max(result.profit,-game.cash):result.profit;
 write(game,paid,'泊灯书屋 · 本季营业','shop');
 result.cash=paid;result.unpaid=round(paid-result.profit);
 if(result.unpaid>0){game.debt.push({principal:result.unpaid,due:game.quarter+1,rate:0,source:'shop'});game.notices.push('书屋本季费用尚有欠款，已经单列为应付费用。');}
 game.shop.periods.push(result);
}

export function closeShopTerm(game:Game,write:Cash){
 if(!game.shop||game.quarter!==12||game.shop.plan==='continue')return;
 for(const deposit of game.shop.deposits.filter(d=>d.status==='held')){
  let available=deposit.amount,applied=0;
  for(const debt of game.debt.filter(d=>d.source==='shop')){const part=Math.min(available,debt.principal);debt.principal=round(debt.principal-part);available=round(available-part);applied=round(applied+part);}
  deposit.status='settled';deposit.returned=available;deposit.applied=applied;
  if(available)write(game,available,deposit.label+' · 期满退回','shop-refund',undefined,deposit.id);
  if(applied)game.notices.push(`${deposit.label}按合约抵付书屋未付费用 ¥${applied.toFixed(2)}；未抵私人借款。`);
 }
 game.debt=game.debt.filter(d=>d.principal>0);
}

export function shopSummary(game:Game){
 const periods=game.shop?.periods??[],operating=round(periods.reduce((sum,p)=>sum+p.profit,0));
 const costs=round(-game.journal.filter(j=>j&&j.category==='shop-investment').reduce((sum,j)=>sum+j.amount,0));
 const receipts=round(game.journal.filter(j=>j&&j.category==='shop-receipt').reduce((sum,j)=>sum+j.amount,0));
 const deposits=game.shop?.deposits??[],held=shopDepositValue(game),returned=deposits.reduce((s,d)=>s+(d.returned??0),0),applied=deposits.reduce((s,d)=>s+(d.applied??0),0);
 const paid=deposits.reduce((s,d)=>s+d.amount,0),next=game.promises.filter(p=>p.status==='pending'&&p.kind==='payment'&&p.shopKind);
 return{periods,last:periods.at(-1),operating,costs,receipts,total:round(operating+receipts-costs),held,paid,returned,applied,next,unpaid:round(game.debt.filter(d=>d.source==='shop').reduce((s,d)=>s+d.principal,0)),legacy:game.shop?.legacy??true};
}

/** Includes earlier undivided operating entries without inventing old deposits. */
export function shopWealthContribution(game:Game){
 const current=new Set((game.shop?.periods??[]).map(p=>p.quarter));
 const earlier=game.journal.filter(j=>j.category==='shop'&&!current.has(j.quarter)).reduce((sum,j)=>sum+j.amount,0);
 return round(earlier+shopSummary(game).total);
}

export function validShop(game:Game){
 const shop=game.shop;if(shop===undefined)return true;
 if(!shop||shop.version!==1||!Number.isInteger(shop.startedQuarter)||shop.startedQuarter<1||shop.startedQuarter>game.quarter||typeof shop.legacy!=='boolean'||!['unrepaired','patched','sound'].includes(shop.roof)||!['undecided','continue','handover'].includes(shop.plan)||typeof shop.shared!=='boolean'||shop.openedQuarter!==undefined&&(!Number.isInteger(shop.openedQuarter)||shop.openedQuarter<1||shop.openedQuarter>game.quarter)||!Array.isArray(shop.deposits)||shop.deposits.length>3||!Array.isArray(shop.periods)||shop.periods.length>12)return false;
 const ids=new Set<string>();
 for(const d of shop.deposits){
  if(!d||typeof d.id!=='string'||ids.has(d.id)||typeof d.label!=='string'||!Number.isFinite(d.amount)||d.amount<=0||!Number.isInteger(d.quarter)||d.quarter<shop.startedQuarter||d.quarter>game.quarter||!['held','settled'].includes(d.status))return false;
  ids.add(d.id);
  if(!game.journal.some(j=>j&&j.category==='shop-deposit'&&j.shopRef===d.id&&j.quarter===d.quarter&&Math.abs(j.amount+d.amount)<.001))return false;
  if(d.status==='settled'&&(!Number.isFinite(d.returned)||!Number.isFinite(d.applied)||d.returned!<0||d.applied!<0||Math.abs(d.returned!+d.applied!-d.amount)>.001))return false;
  if(d.status==='held'&&(d.returned!==undefined||d.applied!==undefined))return false;
  if(d.status==='settled'&&d.returned!>0&&!game.journal.some(j=>j&&j.category==='shop-refund'&&j.shopRef===d.id&&Math.abs(j.amount-d.returned!)<.001))return false;
 }
 return shop.periods.every((p,i)=>p&&Number.isInteger(p.quarter)&&p.quarter>=shop.startedQuarter&&p.quarter<=game.quarter&&(i===0||p.quarter>shop.periods[i-1].quarter)&&['sales','purchases','rent','utilities','care','damage','lostSales','profit','cash','unpaid'].every(k=>Number.isFinite(p[k as keyof ShopPeriod]))&&[p.sales,p.purchases,p.rent,p.utilities,p.care,p.damage,p.lostSales,p.unpaid].every(v=>v>=0)&&Math.abs(p.sales-p.purchases-p.rent-p.utilities-p.care-p.damage-p.profit)<.03&&Math.abs(p.cash-p.profit-p.unpaid)<.03&&typeof p.rain==='boolean'&&typeof p.heavy==='boolean'&&['unrepaired','patched','sound'].includes(p.roof)&&Array.isArray(p.notes)&&p.notes.every(n=>typeof n==='string')&&game.journal.some(j=>j&&j.category==='shop'&&j.quarter===p.quarter&&Math.abs(j.amount-p.cash)<.001));
}

export function validShopEffect(value:unknown,cash=0):value is ShopEffect{
 if(!value||typeof value!=='object')return false;
 const e=value as ShopEffect;
 return (e.deposit===undefined||Number.isFinite(e.deposit)&&e.deposit>0&&e.deposit<=-cash)&&
 (e.cost===undefined||typeof e.cost==='boolean')&&(e.takeover===undefined||typeof e.takeover==='boolean')&&
 (e.shared===undefined||typeof e.shared==='boolean')&&(e.plan===undefined||['continue','handover'].includes(e.plan))&&
 (e.roof===undefined||['unrepaired','patched','sound'].includes(e.roof));
}
