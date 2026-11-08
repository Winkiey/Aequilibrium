import {ENDING_FILM_SCRIPTS,OPENING_FILM_SCRIPT,filmCues,type FilmScript} from './film-scripts';
import {VIDEO_ASSETS} from './video-assets.generated';
export type FilmCue={start:number;end:number;text:string};
export type FilmMedia={id:string;src:string;poster:string;duration:number;width:number;height:number;fps:number;hasAudio:boolean;sha256:string;sourceType:'generated-scene-motion';provider:string;captions?:FilmCue[]};
export const filmForEnding=(name:string)=>ENDING_FILM_SCRIPTS[name];
export function validFilmMedia(value:unknown):value is FilmMedia{
 if(!value||typeof value!=='object')return false;const a=value as FilmMedia;
 return typeof a.id==='string'&&typeof a.src==='string'&&/^\/video\/(?!.*\.\.)[\w./-]+\.mp4$/.test(a.src)&&typeof a.poster==='string'&&a.poster.startsWith('/')&&Number.isFinite(a.duration)&&a.duration>30&&Number.isInteger(a.width)&&a.width>=1280&&Number.isInteger(a.height)&&a.height>=720&&Math.abs(a.width/a.height-16/9)<.02&&Number.isFinite(a.fps)&&a.fps>=24&&typeof a.hasAudio==='boolean'&&/^[a-f0-9]{64}$/.test(a.sha256)&&a.sourceType==='generated-scene-motion'&&typeof a.provider==='string'&&a.provider.length>0&&(a.captions===undefined||(Array.isArray(a.captions)&&a.captions.every((c,i)=>c&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&c.end<=a.duration+.1&&typeof c.text==='string'&&(i===0||c.start>=a.captions![i-1].end))));
}
export function filmMedia(id:string):FilmMedia|undefined{const candidate=VIDEO_ASSETS[id];return validFilmMedia(candidate)&&candidate.id===id?candidate:undefined;}
export function subtitlesForFilm(script:FilmScript,media:FilmMedia):FilmCue[]{return media.captions??filmCues(script).map(c=>({...c,start:c.start*media.duration/script.duration,end:c.end*media.duration/script.duration}));}
export function currentFilmCue(cues:FilmCue[],time:number){return Number.isFinite(time)?cues.find(c=>time>=c.start&&time<c.end)?.text??'':'';}
export {OPENING_FILM_SCRIPT};
