'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {Volume2} from 'lucide-react';
import {DialogueVoice,type VoiceCue,type VoiceStatus} from '@/lib/game/dialogue-voice';
import type {VoiceSession,BufferedVoice} from '@/lib/game/voice-session';

export const VoiceSessionContext=createContext<VoiceSession|null>(null);

/** The full displayed beat is the input. Typing progress never enters this hook. */
export function CharacterSpeech({cue,upcoming=[],enabled,paused,volume,name,onEnable,onActivity}:{cue:VoiceCue|null;upcoming?:readonly VoiceCue[];enabled:boolean;paused:boolean;volume:number;name:string;onEnable?:()=>void;onActivity?:(playing:boolean)=>void}){
 const session=useContext(VoiceSessionContext);
 const player=useRef<DialogueVoice|BufferedVoice|null>(null),activity=useRef(onActivity);
 activity.current=onActivity;
 const [status,setStatus]=useState<VoiceStatus>('idle');
 const [latency,setLatency]=useState<number|null>(null);
 useEffect(()=>{
  const report=(next:VoiceStatus)=>{setStatus(next);setLatency(next==='playing'&&player.current&&'startupMs'in player.current?player.current.startupMs:null);activity.current?.(next==='playing');};
  const channel=session?session.createChannel(report):new DialogueVoice(()=>new Audio(),report);
  player.current=channel;
  const visibility=()=>{if(document.hidden)channel.stop();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);player.current=null;channel.dispose();activity.current?.(false);};
 },[session]);
 useEffect(()=>{player.current?.set(cue,{enabled,paused,volume});},[session,cue?.key,cue?.src,enabled,paused,volume]);
 const warmKey=upcoming.map(c=>c.src).join('|');
 useEffect(()=>{if(enabled&&volume>0)session?.warm([...(cue?[cue]:[]),...upcoming]);},[session,enabled,volume,cue?.src,warmKey]);
 if(!cue)return null;
 const label=!enabled?'开启声音':status==='blocked'?'听这一句':status==='unavailable'?'重试语音':status==='loading'?'正在取语音':'重听这一句';
 const muted=volume<=0;
 return <button type="button" className="dialogue-voice-button" data-voice-status={status} data-voice-latency-ms={latency??undefined} disabled={paused||muted} title={muted?'人物对白音量为零，可在声音与偏好中调整。':`${label} · ${name}`} aria-label={`${label} · ${name}`} onClick={()=>{if(!enabled)onEnable?.();else player.current?.replay();}}><Volume2 size={13}/><span>{status==='playing'?'重听':label}</span></button>;
}
