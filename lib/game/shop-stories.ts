import type {Beat} from './cinematic-content';
import type {Game,StoryEvent,Effects} from './engine';
import {shopDepositValue} from './shop';

const b=(speaker:Beat['speaker'],text:string,focus:Beat['focus']='contract'):Beat=>({speaker,text,camera:speaker==='narrator'?'wide':'medium',focus,emotion:'quiet'});
/** Called once on a new offer, never on a saved reply or collection replay. */
export function materializeShop(event:StoryEvent,game:Game):StoryEvent{
 if(!game.shop||event.shopRevision===1)return event;
 const owner=!!game.flags.shop,a=event.options[0],z=event.options[1];
 const change=(option:typeof a,shop:NonNullable<Effects['shop']>)=>{option.effects.shop=shop;};
 if(event.id==='main-1'){
  event.shopRevision=1;
  a.detail='总支出 18,000 元：12,000 元为可退押金，6,000 元为不退的整理费。期满交接退押金，未付书屋费用可依原约抵扣；继续经营时仍占用这笔钱。';
  change(a,{deposit:12000,cost:true,takeover:true});
 }else if(event.id==='main-2'){
  event.shopRevision=1;change(a,{cost:true});
  a.detail='支出 3,000 元布置费用，放弃本次加急稿；之后的来访与购书会进入经营记录，不保证每次活动都赚钱。';
 }else if(event.id==='main-4'&&owner){
  event.shopRevision=1;
  for(const option of event.options)for(const p of option.effects.promises??[])if(p.label==='书店屋顶修缮'){p.shopKind='repair';p.shopRoof='sound';}
 }else if(event.id==='main-5'){
  event.shopRevision=1;
  if(owner){
   a.detail='季末支付已约定的 24,000 元；付款验收后，下一季起按完整修缮状态营业，减少漏雨书损和停业风险。';
   a.response='曹师傅把整修范围写进验收单。你再次圈好两万四的付款日期，等季末核对完工与支付。';
   z.detail='改签为本季支付 9,000 元；完成后保留部分漏雨风险。以后补完需 15,000 元余下工程及 2,000 元返场费，可在后续来信再决定。';
   z.response='你们在原单上签下改项，把这次工程缩到九千元。余下屋面另列清单，窗边的书暂时挪开。';
   change(a,{roof:'sound'});change(z,{roof:'patched'});
   for(const p of z.effects.promises??[]){p.shopKind='repair';p.shopRoof='patched';}
  }else{
   change(a,{cost:true,roof:'sound'});change(z,{roof:'sound'});
   a.detail='自愿支付 4,000 元添阅览角，费用不退；主体修缮仍由程姨付款，不因此取得经营权。';
   z.detail='不出资，留下时间擦窗；主体修缮由程姨付款，店仍由她经营。';
  }
 }else if(event.id==='main-6'){
  event.shopRevision=1;
  const held=shopDepositValue(game),topup=Math.max(0,15000-held);
  a.detail=held>0?`续租保证金总额 15,000 元，已有 ${held.toFixed(0)} 元；第十季只补 ${topup.toFixed(0)} 元。期满交接退回，继续经营时保留为押金资产。`:'第十季支付 15,000 元可退押金，之后承担书屋经营；期满交接退回，继续经营时这笔钱仍占用。';
  for(const p of a.effects.promises??[]){p.amount=topup;p.shopKind='deposit';p.label=held>0?'续租保证金补足款':'书屋接手保证金';}
  change(a,{takeover:!owner,plan:'continue'});change(z,{plan:'handover'});
  z.detail='不新增保证金义务。期满按约交接并退回已登记的押金；已经承担的付款仍需履行。';
 }else if(event.id==='main-11'){
  event.shopRevision=1;change(a,{cost:true,...(owner?{plan:'continue' as const}:{})});change(z,{plan:'handover'});
  a.detail=owner?'支出 8,000 元维护与备货费用，款项不退；期满继续经营，已登记押金保留为资产，不在本局退现金。':'自愿支付 8,000 元支持书屋维护与备货，款项不退；这笔赠与不会自动取得经营权。';
  z.detail='不再新增投入，期满交接；已登记押金会先抵书屋未付费用、再退回余额。股票持仓另行安排。';
 }else if(event.id==='chapter-10'){
  event.shopRevision=1;change(a,{shared:true});change(z,{cost:true});
  a.detail='共同登记费用、轮值与退出办法；若由你经营，之后每季减少 300 元付费整理与闭店支出，也让出部分决定权。';
 }else if(['s07','s09','s12','s43','s44','s52','s55'].includes(event.id)){
  event.shopRevision=1;for(const option of event.options)if(option.effects.cash)change(option,{cost:true});
 }else if(event.id==='s49'&&owner&&game.shop.roof==='patched'){
  event.shopRevision=1;event.title='余下的那一片屋面';
  event.paragraphs=['局部修补后的书屋仍照常开门，窗边有一排书暂时搬到了里面。曹师傅带着上次留下的工程清单回来。','余下屋面材料与工钱一万五，重新进场两千，总计一万七。你可以现在补完，也可以继续保留现金、承担未修部分的雨季风险。'];
  a.label='补完余下屋面';a.detail='立即支付 17,000 元，含 15,000 元余下工程及 2,000 元返场费；完成后按完整修缮状态营业。';
  a.response='曹师傅把余下工程逐项勾完。你收好一万七的收据，把窗边的书搬回原位。';
  a.effects={cash:-17000,flags:{roof:1},stress:-3,shop:{cost:true,roof:'sound'}};
  z.label='继续使用局部修补，先保留现金';z.detail='不支出这笔工程款；本季仍可能发生书损与临时停业，经营单会记录实际结果。';
  z.response='你们把剩余工程单收进账本，仍按局部修补后的范围使用书架。窗边那排书继续留在里面。';
  event.opening=[b('narrator','上次改签的工程只修了最重的一处，窗边仍有一排书搬在里面。','window'),b('cao','这张是余下清单。工程一万五，返场两千，总共一万七。'),b('self','补完可以减少之后的漏雨损失，今天也会少掉一万七的现金。','ledger'),b('cao','先不做也行。收好原单，后面哪一处动过，就照着哪一处验。')];
 }
 return event;
}

export const SHOP_OUTCOMES:Record<string,[Beat[],Beat[]]>={
 'main-5':[
  [b('narrator','整修范围和付款日期写进同一张验收单。'),b('cao','季末把付款和完工核对好，再按修好的屋面安排下一季。')],
  [b('narrator','原付款单注明改签，未修的部分另列一页。'),b('cao','这次九千。以后补完还有返场费，窗边先留出搬书的位置。')]
 ],
 s49:[
  [b('narrator','工程清单最后一项勾完，收据放到干燥的柜台上。','receipt'),b('cao','这一回把剩下的屋面接好了，窗边的书可以搬回去。','window')],
  [b('narrator','你把余下的工程单收回账本，窗边那排书继续摆在里面。','ledger'),b('cao','那就按现有范围用。这段租期先照这个安排，余下的地方仍要避雨。')]
 ]
};
const APPROVED_SHOP_REPLIES:Record<string,readonly [string,string]>={
 'main-5':['曹师傅把整修范围写进验收单。你再次圈好两万四的付款日期，等季末核对完工与支付。','你们在原单上签下改项，把这次工程缩到九千元。余下屋面另列清单，窗边的书暂时挪开。'],
 s49:['曹师傅把余下工程逐项勾完。你收好一万七的收据，把窗边的书搬回原位。','你们把剩余工程单收进账本，仍按局部修补后的范围使用书架。窗边那排书继续留在里面。']
};
export function shopOutcomeBeats(event:StoryEvent,index:0|1){
 if(event.shopRevision!==1||APPROVED_SHOP_REPLIES[event.id]?.[index]!==event.options[index].response)return undefined;
 if(event.id==='main-5'&&!event.options[0].effects.shop?.roof)return undefined;
 return SHOP_OUTCOMES[event.id]?.[index];
}
