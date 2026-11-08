import {borrow,repay,trade,type Game} from './engine';
export type Place='hub'|'street'|'broker'|'bank';
export function tradeAt(place:Place,game:Game,id:string,side:'buy'|'sell',amount:number){if(place!=='broker')throw new Error('请到证券营业室办理买卖。');return trade(game,id,side,amount);}
export function borrowAt(place:Place,game:Game){if(place!=='bank')throw new Error('请到银行办理借款。');return borrow(game);}
export function repayAt(place:Place,game:Game){if(place!=='bank')throw new Error('请到银行办理还款。');return repay(game);}
