import {ending,netWealth,debtTotal,investmentProfit,investments,money,type Game} from './engine';
type Compare='gte'|'gt'|'lte'|'lt'|'eq'|'truthy';
type Unit='记录分'|'分'|'次'|'人'|'元'|'%'|'状态';
export type EndingCheck={label:string;actual:string;target:string;met:boolean;gap:string};
const amount=(value:number,unit:Unit)=>unit==='元'?'¥'+value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}):unit==='状态'?value?'已形成':'未形成':`${Number(value.toFixed(unit==='%'?4:2))} ${unit}`;
function check(label:string,value:number,op:Compare,target:number,unit:Unit):EndingCheck{
 const met=op==='gte'?value>=target:op==='gt'?value>target:op==='lte'?value<=target:op==='lt'?value<target:op==='eq'?value===target:!!value;
 const rule=op==='gte'?'至少':op==='gt'?'高于':op==='lte'?'不超过':op==='lt'?'低于':op==='eq'?'等于':'需要';
 let gap=met?'符合此项条件':op==='gte'?'尚差 '+amount(Math.max(0,target-value),unit):op==='lte'?'超出上限 '+amount(Math.max(0,value-target),unit):op==='truthy'?'本局没有形成这项安排':op==='eq'&&target===0?'本局仍有 '+amount(value,unit):'尚未满足；严格高于/低于的边界不含相等';
 return{label,actual:amount(value,unit),target:op==='truthy'?'已形成这项安排':rule+' '+amount(target,unit),met,gap};
}
type EvidenceGroup={id:string;title:string;mode:'all'|'any'|'none';checks:EndingCheck[];relevant:boolean};
/** Read-only debrief. The existing engine ending() remains the sole selector.
 * Named unseen endings and unchosen story text are never returned as a guide.
 */
export function endingEvidence(game:Game){
 if(!game.finished)return null;
 const name=ending(game).name,broken=game.promises.filter(p=>p.kind==='payment'&&p.status==='missed').length;
 const flag=(key:string)=>game.flags[key]??0,debt=debtTotal(game),wealth=netWealth(game);
 const promise=()=>check('到期付款未兑现',broken,'lte',1,'次');
 const groups:Record<string,EvidenceGroup>={
  '铁窗四季':{id:'responsibility',title:'账目责任',mode:'all',relevant:false,checks:[check('违规记录',flag('fraud'),'gte',3,'记录分'),check('调查进展',game.investigation,'gte',3,'记录分')]},
  '余烬重燃':{id:'finance',title:'财务状态',mode:'any',relevant:false,checks:[check('期末净资产',wealth,'lt',10000,'元'),check('未还本金',debt,'gt',wealth+20000,'元')]},
  '知止乘潮':{id:'investment',title:'投资与回撤',mode:'all',relevant:false,checks:[check('投资净损益',investmentProfit(game),'gt',65000,'元'),check('投资损益回撤',game.drawdown*100,'lt',18,'%')]},
  '激流勇退':{id:'retired',title:'退出市场的安排',mode:'all',relevant:!!flag('retired'),checks:[check('已作退出安排',flag('retired'),'truthy',1,'状态'),check('未还本金',debt,'eq',0,'元'),check('剩余持仓市值',investments(game),'lt',1,'元')]},
  '纸上春秋':{id:'proof',title:'校样与署名',mode:'all',relevant:flag('proofCraft')>0,checks:[check('校样相关记录',flag('proofCraft'),'gte',2,'记录分'),check('诚信相关记录',flag('integrity'),'gte',2,'记录分'),promise()]},
  '同灯共守':{id:'shared',title:'共同轮值',mode:'all',relevant:flag('mutual')>0,checks:[check('互助相关记录',flag('mutual'),'gte',2,'记录分'),check('与阿棠的往来',game.relations.tang,'gte',55,'分'),promise()]},
  '归途有约':{id:'family',title:'与沈禾的约定',mode:'all',relevant:flag('familyTime')>0,checks:[check('相处时间记录',flag('familyTime'),'gte',2,'记录分'),check('与沈禾的往来',game.relations.he,'gte',65,'分')]},
  '潮声入梦':{id:'coast',title:'沿海出行',mode:'all',relevant:flag('coast')>0,checks:[check('沿海出行记录',flag('coast'),'gte',2,'记录分'),check('未还本金',debt,'eq',0,'元'),check('与陆川的往来',game.relations.lu,'gte',60,'分')]},
  '泊灯长明':{id:'shop',title:'书屋的去留',mode:'all',relevant:!!flag('shop'),checks:[check('已接手书屋',flag('shop'),'truthy',1,'状态'),check('选择继续经营',flag('keepShop'),'truthy',1,'状态'),promise(),check('期末可用现金',game.cash,'gt',15000,'元')]},
  '长桌人间':{id:'community',title:'长桌与街坊',mode:'all',relevant:flag('community')>0,checks:[check('街坊活动记录',flag('community'),'gte',2,'记录分'),check('与阿棠的往来',game.relations.tang,'gt',60,'分')]},
  '独自抵达':{id:'distance',title:'承诺与往来',mode:'any',relevant:false,checks:[check('到期付款未兑现',broken,'gte',3,'次'),check('往来低于35分的人数',Object.values(game.relations).filter(v=>v<35).length,'gte',2,'人')]},
 };
 const selected=groups[name]??{id:'ordinary',title:'日常的延续',mode:'none' as const,checks:[],relevant:false};
 const paths=Object.values(groups).filter(g=>g.relevant&&g.id!==selected.id).map(({id,title,mode,checks})=>({id,title,mode,checks,satisfied:checks.every(c=>c.met)}));
 return{name,selected:{id:selected.id,title:selected.title,mode:selected.mode,checks:selected.checks},paths,
  explanation:selected.mode==='none'?'这一局没有命中优先收束的特殊条件，故事于是落在日常的延续。它没有给你的三年打低分，账目与往来仍完整留在复盘里。':'这份结局由下方条件在本局的实际记录共同决定。财富不是唯一尺度，已经兑现的约定与具体经历也参与收束。',
  priority:'结局沿用既定顺序：先核对重大责任和财务状态，再核对投资、退出安排与生活经历；首次命中后收束。几个方向同时成立，不代表其他付出被抹去。',
 };
}
