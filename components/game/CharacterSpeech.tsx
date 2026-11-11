'use client';
import {useEffect,useRef,useState} from 'react';
import {Volume2} from 'lucide-react';
import {DialogueVoice,type VoiceCue,type VoiceStatus} from '@/lib/game/dialogue-voice';

/** The full displayed beat is the input. Typing progress never enters this hook. */
export function CharacterSpeech({cue,enabled,paused,volume,name,onEnable,onActivity}:{cue:VoiceCue|null;enabled:boolean;paused:boolean;volume:number;name:string;onEnable?:()=>void;onActivity?:(playing:boolean)=>void}){
 const player=useRef<DialogueVoice|null>(null),activity=useRef(onActivity);
 activity.current=onActivity;
 const [status,setStatus]=useState<VoiceStatus>('idle');
 useEffect(()=>{
  const channel=new DialogueVoice(()=>new Audio(),next=>{setStatus(next);activity.current?.(next==='playing');});
  player.current=channel;
  const visibility=()=>{if(document.hidden)channel.stop();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);player.current=null;channel.dispose();activity.current?.(false);};
 },[]);
 useEffect(()=>{player.current?.set(cue,{enabled,paused,volume});},[cue?.key,cue?.src,enabled,paused,volume]);
 if(!cue)return null;
 const label=!enabled?'开启声音':status==='blocked'?'听这一句':status==='unavailable'?'重试语音':status==='loading'?'正在取语音':'重听这一句';
 const muted=volume<=0;
 return <button type="button" className="dialogue-voice-button" data-voice-status={status} disabled={paused||muted} title={muted?'人物对白音量为零，可在声音与偏好中调整。':`${label} · ${name}`} aria-label={`${label} · ${name}`} onClick={()=>{if(!enabled)onEnable?.();else player.current?.replay();}}><Volume2 size={13}/><span>{status==='playing'?'重听':label}</span></button>;
}
