import {INITIAL_CASH,investments,investmentProfit,netWealth,positionValue,quoteTrade,type Asset,type Game} from './engine';
export function companyReturn(game:Game,asset:Asset){
 const transactions=game.transactions.filter(t=>t.asset===asset.id);
 const bought=transactions.filter(t=>t.side==='buy').reduce((sum,t)=>sum+t.amount,0),sold=transactions.filter(t=>t.side==='sell').reduce((sum,t)=>sum+t.amount,0);
 const dividends=game.journal.filter(j=>j.category==='dividend'&&(j.asset===asset.id||!j.asset&&j.label===`${asset.name} 分红`)).reduce((sum,j)=>sum+j.amount,0);
 const research=(game.evidence??[]).filter(e=>e.asset===asset.id).reduce((sum,e)=>sum+e.cost,0);
 const market=positionValue(asset),total=market+sold+dividends-bought-research;
 return {id:asset.id,name:asset.name,bought,sold,dividends,research,market,total,closed:bought>0&&asset.units<1e-8,priceOnly:market+sold-bought};
}
export function investmentSummary(game:Game){
 const companies=game.assets.map(a=>companyReturn(game,a)),closed=companies.filter(c=>c.closed),total=investmentProfit(game);
 const change=netWealth(game)-INITIAL_CASH;
 const cashBy=(categories:string[])=>game.journal.filter(j=>categories.includes(j.category)).reduce((sum,j)=>sum+j.amount,0);
 const research=(game.evidence??[]).reduce((sum,e)=>sum+e.cost,0),storyResearch=(game.evidence??[]).filter(e=>e.eventId).reduce((sum,e)=>sum+e.cost,0);
 return {companies,closed,total,research,storyResearch,dividends:companies.reduce((sum,c)=>sum+c.dividends,0),priceOnly:companies.reduce((sum,c)=>sum+c.priceOnly,0),wins:closed.filter(c=>c.total>0).length,
  currentExposure:netWealth(game)>0?investments(game)/netWealth(game):0,initial:INITIAL_CASH,wealth:netWealth(game),change,
  sameCashflowBaseline:netWealth(game)-total,life:cashBy(['salary','living']),story:cashBy(['event','promise','receipt'])+storyResearch,
 };
}
export function orderImpact(game:Game,asset:Asset,side:'buy'|'sell',amount:number){
 const quote=quoteTrade(game,asset.id,side,amount),current=netWealth(game);
 const afterMarket=investments(game)+(side==='buy'?1:-1)*quote.units*asset.price;
 const afterWealth=current+(side==='buy'?-quote.total:quote.total)+(side==='buy'?1:-1)*quote.units*asset.price;
 const afterCash=game.cash+(side==='buy'?-quote.total:quote.total);
 const due=game.promises.filter(p=>p.status==='pending'&&p.kind==='payment'&&p.due<=game.quarter+1).reduce((sum,p)=>sum+p.amount,0);
 return {quote,afterMarket,afterWealth,afterCash,due,exposure:afterWealth>0?afterMarket/afterWealth:0,tenPercentMove:quote.units*asset.price*.1,totalWealthMove:current>0?quote.units*asset.price*.1/current:0};
}
