'use client';
import{useEffect,useMemo,useRef,useState}from'react';
import{ArrowRight,BookOpen,Pause,Play,RotateCcw,Subtitles,Volume2,VolumeX}from'lucide-react';
import{currentFilmCue,subtitlesForFilm,filmVoiceLevel,filmRendition,type FilmMedia}from'@/lib/game/films';
import{FilmPlayback,type FilmPlaybackState}from'@/lib/game/film-playback';
import{publicPath,imageURL}from'@/lib/game/assets';
import type{FilmScript}from'@/lib/game/film-scripts';
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

/** Same motion and narration, with a small streaming rendition and optional original. */
export function FilmPlayer({media,script,onFinish,onFallback,sound=false,onSound,paused=false,reducedMotion=false,onAudioFocus,voiceVolume=.7}:{media:FilmMedia;script:FilmScript;onFinish:()=>void;onFallback:()=>void;sound?:boolean;onSound?:()=>void;paused?:boolean;reducedMotion?:boolean;onAudioFocus?:(active:boolean)=>void;voiceVolume?:number}){
 const video=useRef<HTMLVideoElement>(null),session=useRef<FilmPlayback|null>(null);
 const[time,setTime]=useState(0),[duration,setDuration]=useState(media.duration),[original,setOriginal]=useState(false),[subtitles,setSubtitles]=useState(true);
 const[state,setState]=useState<FilmPlaybackState>({playing:false,buffering:!paused&&!reducedMotion,blocked:reducedMotion,slow:false,error:false});
 const{playing,buffering,blocked,slow,error}=state;
 const rendition=filmRendition(media,original),cues=useMemo(()=>subtitlesForFilm(script,media),[script,media]),caption=subtitles?currentFilmCue(cues,time):'';
 const level=filmVoiceLevel(voiceVolume),gutter=media.captionPlacement==='gutter';
 useEffect(()=>{if(video.current)video.current.volume=level;},[level]);
 useEffect(()=>{
  const v=video.current;if(!v)return;const current=new FilmPlayback(v,patch=>setState(s=>({...s,...patch})));session.current=current;
  current.suspend(paused||document.hidden);current.source(publicPath(filmRendition(media).src),0,!reducedMotion);
  return()=>{current.dispose();if(session.current===current)session.current=null;};
 // Source changes are explicit actions; prop pause/visibility never recreate a decoder.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[media]);
 useEffect(()=>{const sync=()=>session.current?.suspend(paused||document.hidden);sync();document.addEventListener('visibilitychange',sync);return()=>document.removeEventListener('visibilitychange',sync);},[paused]);
 useEffect(()=>{const active=playing&&!paused&&sound&&media.hasAudio&&level>0;onAudioFocus?.(active);return()=>onAudioFocus?.(false);},[playing,paused,sound,media.hasAudio,level,onAudioFocus]);
 function play(){if(!paused)session.current?.play();}
 function toggle(){if(!paused)session.current?.toggle();}
 function changeQuality(next:boolean){if(next===original)return;const current=session.current;if(!current)return;const keepPlaying=current.wantsPlayback;const position=video.current?.currentTime??time;setOriginal(next);current.source(publicPath(filmRendition(media,next).src),position,keepPlaying);}
 function retry(){session.current?.source(publicPath(rendition.src),video.current?.currentTime??time,true);}
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(paused||e.repeat||(e.target as HTMLElement)?.closest('input,button,select,textarea,a'))return;if(e.code==='Space'){e.preventDefault();toggle();}else if(e.code==='Escape')session.current?.pause();};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);});
 const picture=<video ref={video} poster={imageURL(rendition.poster)} muted={!sound||level===0} playsInline preload={reducedMotion?'metadata':'auto'} aria-label={`${script.title} · 有声影片`} onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d)&&d>0)setDuration(d);session.current?.metadata();}} onTimeUpdate={e=>{setTime(e.currentTarget.currentTime);session.current?.progress();}} onWaiting={()=>session.current?.waiting()} onStalled={()=>session.current?.waiting()} onPlaying={()=>session.current?.playing()} onPause={()=>session.current?.paused()} onCanPlay={()=>session.current?.metadata()} onEnded={()=>{if(session.current?.ended())onFinish();}} onError={()=>session.current?.fail()}/>;
 return <section className={`motion-film${gutter?' film-gutter':''}`} aria-label={`${script.title} · 影片`} data-film={script.id}>
  {gutter?<div className="film-picture-area"><div className="film-picture">{picture}{!error&&<p className="motion-film-caption" aria-live="off">{caption}</p>}</div></div>:picture}
  <div className="motion-film-shade"/>
  <header><span>{script.kind==='opening'?'均衡之渊':script.title}<small>{script.kind==='opening'?'AEQUILIBRIUM':'三年以后'}</small></span><button onClick={onFinish}>{script.kind==='opening'?'跳过片头':'跳至复盘'}<ArrowRight size={15}/></button></header>
  {error||slow?<div className="film-play-prompt film-load-help" role={error?'alert':'status'}><p>{error?'影片暂时无法播放。':'连接有些慢，可以重试，或先走进故事。'}</p><div>{original&&media.stream&&<button disabled={paused} onClick={()=>changeQuality(false)}>换成流畅版</button>}<button disabled={paused} onClick={retry}><RotateCcw size={16}/>重新载入</button><button onClick={onFallback}>用文字继续<ArrowRight size={16}/></button></div></div>:<>
   {(!playing&&(blocked||reducedMotion||time>0)&&!buffering)&&<div className="film-play-prompt"><button onClick={play} disabled={paused}><Play size={25}/>{time>0?'继续影片':'播放影片'}</button>{reducedMotion&&time===0&&<p>已尊重减少动态偏好，影片由你主动开启。</p>}</div>}
   {buffering&&<span className="film-buffering" role="status">正在缓冲这一幕…</span>}
   {!gutter&&<p className="motion-film-caption" aria-live="off">{caption}</p>}
  </>}
  <footer><div className="film-playback-controls"><button onClick={toggle} disabled={error||paused} aria-label={playing?'暂停影片':'播放影片'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>{onSound&&<button onClick={onSound} aria-label={sound?'关闭声音':'开启声音'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>}<button onClick={()=>setSubtitles(v=>!v)} aria-label={subtitles?'关闭字幕':'开启字幕'} aria-pressed={subtitles}><Subtitles size={18}/></button><button onClick={onFallback} aria-label={script.kind==='opening'?'直接进入故事':'重读当年的文字'}><BookOpen size={17}/></button>{media.stream&&<label className="film-quality"><span className="sr-only">影片画质</span><select aria-label="影片画质" value={original?'original':'stream'} disabled={paused} onChange={e=>changeQuality(e.target.value==='original')}><option value="stream">流畅 · 720p</option><option value="original">原画 · 2K</option></select></label>}<span>{clock(time)} / {clock(duration)}</span></div><input className="film-seek" aria-label="影片播放位置" type="range" min={0} max={duration} step={.1} value={Math.min(time,duration)} disabled={error||paused} onChange={e=>{const next=Number(e.target.value);if(video.current)video.current.currentTime=next;setTime(next);session.current?.progress();}}/></footer>
 </section>;
}
