import type {Asset,Effects,Game,StoryEvent} from './engine';
export type BusinessTerms={quarter:number;status:'confirmed'|'conditional'|'unconfirmed';coverage:number;source:string};
export type EvidenceRecord={id:string;asset:string;quarter:number;cost:number;eventId?:string;title:string;source:string;facts:string[];unresolved:string;terms?:BusinessTerms};
const choices:Record<string,string>={'main-9':'harbor',s19:'harbor',s21:'retail',s23:'signal',s51:'held'};
export function researchTarget(game:Game,target:string){return target==='held'?[...game.assets].filter(a=>a.units>0).sort((a,b)=>b.units*b.price-a.units*a.price)[0]?.id??'harbor':target;}
export function choiceResearch(game:Game,event:StoryEvent,index:number){
 const effect=event.options[index].effects;
 return effect.research??(index===0&&(effect.cash??0)<0&&effect.flags?.verified?choices[event.id]:undefined);
}
export function evidenceFor(game:Game,asset:string,quarter=game.quarter){return game.evidence?.find(e=>e.asset===asset&&e.quarter===quarter);}
export function effectiveCash(game:Game,effect:Effects){return effect.research&&evidenceFor(game,researchTarget(game,effect.research))&&(effect.cash??0)<0?0:effect.cash??0;}
export function recordEvidence(game:Game,assetId:string,cost:number,eventId?:string){
 const existing=evidenceFor(game,assetId);if(existing)return existing;
 const asset=game.assets.find(a=>a.id===assetId);if(!asset)throw new Error('没有这家公司的资料。');
 const terms=game.market?.version===3&&asset.business?.terms?.quarter===game.quarter?asset.business.terms:undefined;
 const status=terms?.status==='confirmed'?'附件已确认并签署':terms?.status==='conditional'?'附有待完成的验收或补充条件':'仍为意向或待确认文件';
 const record:EvidenceRecord={id:`evidence-${game.quarter}-${assetId}`,asset:assetId,quarter:game.quarter,cost,eventId,title:`${asset.name} · 本季核验文件`,source:terms?.source??'已披露经营报表及原记录',facts:[
  `已披露营收 ${asset.revenue.toFixed(1)} 万元；经营现金净额 ${asset.cashflow.toFixed(1)} 万元，两者分别核对。`,
  ...(terms?[`文件状态：${status}。`,`附件覆盖本季这项经营计划的 ${terms.coverage}%，不代表公司全部业务。`]:['这份旧季度记录没有合同附件；本次只核对已有公开报表，不补造过去的文件。']),
  ...(assetId==='retail'?['现有披露未单列同店收入，无法据总营收证明老店增长；门店扩张与现金净额须分别核对。']:[]),
  ...(terms?[asset.business?.notice.kind==='collection'?'对账、验收和实际到账是不同步骤；文件没有保证所有款项在本季到账。':asset.business?.notice.kind==='credit'?'续贷受理与实际放款分别确认；原到期债务仍须处理。':asset.business?.notice.kind==='orders'?'新增计划仍要完成交付，计划金额不能直接当作已经收到的钱。':'报价覆盖范围有限，未覆盖的采购仍按后续实际执行条件核对。']:[])
 ],unresolved:'这些材料说明当前条件；最终落实、其他业务和市场报价仍有不确定性。',...(terms?{terms:{...terms}}:{})};
 game.evidence??=[];game.evidence.push(record);return record;
}
export function validEvidence(game:Game){
 if(game.evidence===undefined)return true;if(!Array.isArray(game.evidence)||game.evidence.length>72)return false;
 const ids=new Set<string>();
 return game.evidence.every(e=>{
  if(!e||typeof e.id!=='string'||e.id!==`evidence-${e.quarter}-${e.asset}`||ids.has(e.id)||!game.assets.some(a=>a.id===e.asset)||!Number.isInteger(e.quarter)||e.quarter<1||e.quarter>game.quarter||!Number.isFinite(e.cost)||e.cost<0||typeof e.title!=='string'||typeof e.source!=='string'||typeof e.unresolved!=='string'||!Array.isArray(e.facts)||!e.facts.every(t=>typeof t==='string')||e.eventId!==undefined&&typeof e.eventId!=='string')return false;
  if(e.cost>0&&!game.journal.some(j=>j.quarter===e.quarter&&j.asset===e.asset&&Math.abs(j.amount+e.cost)<.001&&['event','research'].includes(j.category)))return false;
  ids.add(e.id);return !e.terms||validTerms(e.terms,e.quarter);
 });
}
export function validTerms(value:BusinessTerms,quarter:number){return value&&value.quarter===quarter&&['confirmed','conditional','unconfirmed'].includes(value.status)&&Number.isInteger(value.coverage)&&value.coverage>=40&&value.coverage<=90&&typeof value.source==='string';}
