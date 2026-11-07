import { existsSync, readdirSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const bundled=resolve('.sites-runtime/video-tools/imageio_ffmpeg/binaries');
const executable=process.env.FFMPEG_PATH||(existsSync(bundled)?resolve(bundled,readdirSync(bundled).find(f=>f.endsWith('.exe')||f.startsWith('ffmpeg-'))):'ffmpeg');
const work=resolve('.sites-runtime/film');mkdirSync(work,{recursive:true});mkdirSync('public/video',{recursive:true});
const scenes=['old-street','factory','attic','bookshop-night','reading-room','bookshop-night'];
function ffmpeg(args){const result=spawnSync(executable,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:10*1024*1024});if(result.status!==0)throw new Error(result.stderr||result.error?.message||'Video encoding failed');}
for(const [index,scene] of scenes.entries()){
 const source=resolve(`public/art/backgrounds/${scene}.webp`),destination=resolve(work,`shot-${index}.mp4`);
 if(!existsSync(source))throw new Error(`Missing original scene ${scene}`);
 const camera="scale=2304:1296:force_original_aspect_ratio=increase,crop=2304:1296,zoompan=z='1.015+0.00030*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=132:s=1920x1080:fps=24";
 const fade='fade=t=in:st=0:d=0.6,fade=t=out:st=5.0:d=0.5,setsar=1';
 const input=['-i',source];
 if(index===3||index===5){
  input.push('-i',resolve('public/art/characters/cheng.webp'));
  const column=index===3?0:1;
  input.push('-filter_complex',`[0:v]${camera}[room];[1:v]crop=iw/3:ih:${column}*iw/3:0,scale=360:720,format=rgba,colorchannelmixer=aa=0.92[person];[room][person]overlay=x=1280:y=285:eof_action=repeat,${fade}[out]`,'-map','[out]');
 }else input.push('-vf',`${camera},${fade}`);
 ffmpeg([...input,'-frames:v','132','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',destination]);
 console.log(`Opening shot ${index+1}/6: ${scene}`);
}
writeFileSync(resolve(work,'shots.ffconcat'),scenes.map((_,i)=>`file 'shot-${i}.mp4'`).join('\n'));
const output=resolve('public/video/prologue.mp4');
ffmpeg(['-f','concat','-safe','0','-i',resolve(work,'shots.ffconcat'),'-c','copy','-movflags','+faststart',output]);
writeFileSync('docs/OPENING_FILM.json',JSON.stringify({file:'/video/prologue.mp4',durationSeconds:33,width:1920,height:1080,fps:24,source:'Original generated hand-painted scene art, original fixed character atlas, local FFmpeg camera and dissolve montage. In-game atmosphere is synthesized by Web Audio.',shots:scenes,bytes:statSync(output).size},null,2)+'\n');
console.log(`Opening film ready: ${statSync(output).size} bytes`);
