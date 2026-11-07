'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { INTRO_CAPTIONS } from '@/lib/game/visuals';
export function OpeningFilm({onFinish,sound,onSound,paused=false}:{onFinish:()=>void;sound:boolean;onSound:()=>void;paused?:boolean}){
 const video=useRef<HTMLVideoElement>(null),[time,setTime]=useState(0),[playing,setPlaying]=useState(true),[error,setError]=useState(false);
 const resume=useRef(false);
 useEffect(()=>{const v=video.current;if(!v)return;if(paused){resume.current=!v.paused;v.pause();}else if(resume.current){resume.current=false;void v.play().catch(()=>setPlaying(false));}},[paused]);
 const caption=INTRO_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text??'';
 function toggle(){if(!video.current)return;if(playing){video.current.pause();setPlaying(false);}else{void video.current.play().then(()=>setPlaying(true));}}
 return <div className="opening-film"><video ref={video} autoPlay muted playsInline preload="auto" poster="/art/backgrounds/old-street.webp" onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={onFinish} onError={()=>setError(true)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} aria-label="均衡之渊开场影片"><source src="/video/prologue.mp4" type="video/mp4"/></video><div className="film-vignette"/><header><span>均衡之渊<small>AEQUILIBRIUM</small></span><button onClick={onFinish}>跳过开场<ArrowRight size={15}/></button></header>{error?<div className="film-error"><p>影片暂时未能播放。</p><button onClick={onFinish}>直接进入雨夜<ArrowRight size={16}/></button></div>:<p key={caption} className="film-caption">{caption}</p>}<footer><div><button onClick={toggle} aria-label={playing?'暂停影片':'继续影片'}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button onClick={onSound} aria-label={sound?'关闭声音':'开启环境声'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button></div><span>{String(Math.floor(time)).padStart(2,'0')} / 33</span><div className="film-progress"><i style={{width:`${Math.min(100,time/33*100)}%`}}/></div></footer></div>;
}
