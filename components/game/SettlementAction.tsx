import {ArrowRight} from 'lucide-react';
export function SettlementAction({finished,onContinue}:{finished:boolean;onContinue:()=>void}){
 return <footer className="paper-fixed-action"><span>{finished?'十二季的账目已经归档。':'这一季的收支已记好。'}</span><button className="ink-button" onClick={onContinue}>{finished?'回望这三年':'走进下一季'}<ArrowRight size={17}/></button></footer>;
}
