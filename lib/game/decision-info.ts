import type {Game,Option} from './engine';
import {decisionFacts} from './learning';
import {evidenceFor} from './research';
export function decisionSections(option:Option,game?:Game){
 const facts=decisionFacts(option,game);
 return[
  {id:'now',title:'眼前收支',facts:facts.filter(f=>f.label==='现在'),empty:''},
  {id:'due',title:'到期安排',facts:facts.filter(f=>f.label==='以后'||f.label==='已约定'),empty:'此项没有新增到期款项；已有约定仍请核对账本。'},
  {id:'terms',title:'条件与责任',facts:facts.filter(f=>!['现在','以后','已约定'].includes(f.label)),empty:'背景与条件见答复说明和原始条款。'},
 ];
}
/** A pre-purchase description, never the still-unpaid contract result or future price. */
export function researchOffer(game:Game,id:string){
 const asset=game.assets.find(a=>a.id===id);if(!asset)return null;
 const existing=evidenceFor(game,id),cost=existing?0:300;
 const error=existing?null:game.finished?'故事已经结束，不能购买新的资料。':game.market?.version!==3?'本季旧记录没有这套附件，下一季再查看。':game.cash<cost?'现金不足以支付本次核验费用。':null;
 return{asset:id,name:asset.name,quarter:game.quarter,cost,alreadyPaid:!!existing,afterCash:game.cash-cost,error,
  subject:asset.business?.notice.title??'本季已披露的经营记录',
  scope:['对照本季已披露营收与经营现金净额。','核对已提供附件的签署状态、覆盖范围和仍需完成的条件。','留下有季度、来源和未确定事项的文件，可反复阅读。'],
  limits:['不提供未来股价，不保证订单落实、回款或投资收益。','没有披露的资料会记为缺失，不会替公司补造材料。',...(asset.id==='retail'?['若未单列同店收入，不能靠总营收证明老店增长。']:[])],
 };
}
