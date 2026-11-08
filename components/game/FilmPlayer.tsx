'use client';
import{useEffect,useMemo,useRef,useState}from'react';
import{ArrowRight,BookOpen,Pause,Play,RotateCcw,Subtitles,Volume2,VolumeX}from'lucide-react';
import{currentFilmCue,subtitlesForFilm,type FilmMedia}from'@/lib/game/films';
import{publicPath,imageURL}from'@/lib/game/assets';
import type{FilmScript}from'@/lib/game/film-scripts';
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

/** Prepared for real rendered film assets; no still-image animation fallback. */
export function FilmPlayer({media,script,onFinish,onFallback,sound=false,onSound,paused=false,reducedMotion=false,onAudioFocus}:{media:FilmMedia;script:FilmScript;onFinish:()=>void;onFallback:()=>void;sound?:boolean;onSound?:()=>void;paused?:boolean;reducedMotion?:boolean;onAudioFocus?:(active:boolean)=>void}){
 const video=useRef<HTMLVideoElement>(null),resume=useRef(false),attempted=useRef(false);
 const[time,setTime]=useState(0),[duration,setDuration]=useState(media.duration),[playing,setPlaying]=useState(false),[buffering,setBuffering]=useState(false),[error,setError]=useState(false),[blocked,setBlocked]=useState(reducedMotion),[subtitles,setSubtitles]=useState(true);
 const cues=useMemo(()=>subtitlesForFilm(script,media),[script,media]),caption=subtitles?currentFilmCue(cues,time):'';
 useEffect(()=>{const v=video.current;if(!v)return;if(paused){resume.current=!v.paused;v.pause();}else if(resume.current){resume.current=false;void v.play().catch(()=>setBlocked(true));}},[paused]);
 useEffect(()=>{const active=playing&&!paused&&sound&&media.hasAudio;onAudioFocus?.(active);return()=>onAudioFocus?.(false);},[playing,paused,sound,media.hasAudio,onAudioFocus]);
 useEffect(()=>{const hidden=()=>{if(document.hidden)video.current?.pause();};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
 function play(){if(paused||error)return;void video.current?.play().then(()=>setBlocked(false)).catch(()=>setBlocked(true));}
 function toggle(){if(video.current?.paused)play();else video.current?.pause();}
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(paused||e.repeat||(e.target as HTMLElement)?.closest('input,button,select,textarea,a'))return;if(e.code==='Space'){e.preventDefault();toggle();}else if(e.code==='Escape'){video.current?.pause();setBlocked(true);}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);});
 function retry(){setError(false);setBlocked(false);attempted.current=false;video.current?.load();}
 return <section className="motion-film" aria-label={`${script.title} · 影片`} data-film={script.id}>
  <video ref={video} src={publicPath(media.src)} poster={imageURL(media.poster)} muted={!sound} playsInline preload="metadata" onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d)&&d>0)setDuration(d);}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onWaiting={()=>setBuffering(true)} onPlaying={()=>{setBuffering(false);setPlaying(true);setBlocked(false);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onCanPlay={()=>{setBuffering(false);if(!attempted.current){attempted.current=true;if(!reducedMotion&&!paused)play();else setBlocked(true);}}} onEnded={onFinish} onError={()=>{setError(true);setBuffering(false);setPlaying(false);}}/>
  <div className="motion-film-shade"/>
  <header><span>{script.kind==='opening'?'均衡之渊':script.title}<small>{script.kind==='opening'?'AEQUILIBRIUM':'三年以后'}</small></span><button onClick={onFinish}>{script.kind==='opening'?'跳过片头':'跳至复盘'}<ArrowRight size={15}/></button></header>
  {error?<div className="film-play-prompt" role="alert"><p>影片暂时无法播放。</p><button onClick={retry}><RotateCcw size={18}/>重新载入</button><button onClick={onFallback}>用文字继续<ArrowRight size={16}/></button></div>:<>
   {(!playing&&(blocked||reducedMotion||time>0))&&<div className="film-play-prompt"><button onClick={play} disabled={paused}><Play size={25}/>{time>0?'继续影片':'播放影片'}</button>{reducedMotion&&time===0&&<p>已尊重减少动态偏好，影片由你主动开启。</p>}</div>}
   {buffering&&<span className="film-buffering" role="status">正在缓冲这一幕…</span>}
   <p className="motion-film-caption" aria-live="off">{caption}</p>
  </>}
  <footer><div className="film-playback-controls"><button onClick={toggle} disabled={error||paused} aria-label={playing?'暂停影片':'播放影片'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>{onSound&&<button onClick={onSound} aria-label={sound?'关闭声音':'开启声音'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>}<button onClick={()=>setSubtitles(v=>!v)} aria-label={subtitles?'关闭字幕':'开启字幕'} aria-pressed={subtitles}><Subtitles size={18}/></button><button onClick={onFallback} aria-label={script.kind==='opening'?'直接进入故事':'重读当年的文字'}><BookOpen size={17}/></button><span>{clock(time)} / {clock(duration)}</span></div><input className="film-seek" aria-label="影片播放位置" type="range" min={0} max={duration} step={.1} value={Math.min(time,duration)} disabled={error||paused} onChange={e=>{const next=Number(e.target.value);if(video.current)video.current.currentTime=next;setTime(next);}}/></footer>
 </section>;
}
