import type {ReadingProgress} from './presentation';
type KeyState={paused:boolean;repeat:boolean;modified:boolean;editable:boolean;interactive:boolean;advanceControl:boolean};
/** Preserve native keyboard behavior for choices, fields and tools. */
export function readingKey(code:string,s:KeyState):'advance'|'previous'|'close'|null{
 if(s.paused||s.repeat||s.modified)return null;
 if(code==='Escape'&&!s.editable)return 'close';
 if(s.editable||s.interactive&&!s.advanceControl)return null;
 if(code==='Space'||code==='Enter')return 'advance';
 return code==='ArrowLeft'?'previous':null;
}
export function sideInvitation(finished:boolean,answered:boolean,eventId:string,reading:ReadingProgress|null){
 const continuing=reading?.eventId===eventId;
 return{visible:!finished&&(!answered||continuing),continuing};
}
