import{readFile,writeFile,mkdir,copyFile}from'node:fs/promises';
import{resolve}from'node:path';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import ts from'typescript';
import sharp from'sharp';
const output=resolve('outputs/film-production'),temp=resolve('.sites-runtime/film-production');await mkdir(temp,{recursive:true});
const source=await readFile('lib/game/film-scripts.ts','utf8');await writeFile(resolve(temp,'scripts.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
const{ALL_FILM_SCRIPTS,FILM_STYLE,filmCues}=await import(pathToFileURL(resolve(temp,'scripts.mjs')).href);
const assets=JSON.parse(await readFile('docs/ASSET_MANIFEST.json','utf8')).assets;
const references={};await mkdir(resolve(output,'references/backgrounds'),{recursive:true});await mkdir(resolve(output,'references/characters'),{recursive:true});
const scenes=[...new Set(ALL_FILM_SCRIPTS.flatMap(f=>f.shots.map(s=>s.scene)))],cast=[...new Set(ALL_FILM_SCRIPTS.flatMap(f=>f.shots.flatMap(s=>s.cast)))];
for(const id of scenes){const a=assets[id];if(!a)throw Error(`Missing scene ${id}`);const path=`references/backgrounds/${id}.webp`;await copyFile(resolve(`public${a.path}`),resolve(output,path));references[`scene:${id}`]={path,source:a.path,sha256:createHash('sha256').update(await readFile(resolve(output,path))).digest('hex')};}
for(const id of cast){const a=assets[id];if(!a)throw Error(`Missing cast ${id}`);const original=sharp(resolve(`public${a.path}`)),m=await original.metadata(),width=Math.floor(m.width/3),path=`references/characters/${id}.webp`;await original.extract({left:0,top:0,width,height:m.height}).webp({quality:94,alphaQuality:100}).toFile(resolve(output,path));references[`cast:${id}`]={path,source:a.path,note:'Only the original neutral pose, cropped without redrawing. Do not upload the three-pose atlas as three different people.',sha256:createHash('sha256').update(await readFile(resolve(output,path))).digest('hex')};}
const exactStyle='严格沿用所附游戏原画的写实手绘电影分镜风格，低饱和石板灰、烟草棕与苔绿，旧木、纸张和布料保留细微笔触，自然海港光，真实成人比例。角色脸型、年龄、发型、衣服配色与参考图完全一致。镜头稳定；画面内部有连续、符合物理的动作，人物有真实呼吸、眨眼、视线、手部接触与承重，衣料、水面、纸张和光影自然变化。不要把静态图片抖动、推拉或硬切换当作运动。不要卡纸人、照片真人化、动漫脸、3D塑料高光、夸张表演、生成文字、字幕、数字、品牌或水印。台词由后期字幕承接，角色以自然表情与手势演出，不做无声连续嘴型。音轨只生成贴合镜头的安静环境声，不生成陌生旁白与随机配乐。横屏16:9。';
const formatTime=t=>{const ms=Math.round(t*1000);return`${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
const films=[];
for(const f of ALL_FILM_SCRIPTS){const directory=resolve(output,f.id);await mkdir(directory,{recursive:true});const parts=[];
 for(let i=0;i<f.shots.length;i+=3){const shots=f.shots.slice(i,i+3),keys=[...new Set(shots.flatMap(s=>[`scene:${s.scene}`,...s.cast.map(c=>`cast:${c}`)]))],refs=keys.map((key,index)=>({index:index+1,key,...references[key]})),part=parts.length+1;let time=0;
  const prompt=`${exactStyle}\n\n参考图顺序：\n${refs.map(r=>`@图片${r.index}：${r.key.startsWith('scene:')?'场景与美术参考':'固定人物身份参考'} ${r.key.split(':')[1]}。`).join('\n')}\n\n《${f.title}》第${part}段，${shots.length*8}秒。以下镜头连贯演出，动作延续，声音自然衔接，不自行添加故事人物：\n${shots.map((s,n)=>{const start=time;time+=s.seconds;return`${start}–${time}秒｜${s.camera==='wide'?'全景':s.camera==='detail'?'近景':'中景'}｜场景${s.scene}｜${s.cast.length?`人物${s.cast.join('、')}｜`:''}${s.action}\n环境声：${s.sound}。字幕与叙事仅供表演理解，不要画进视频：${s.caption}`;}).join('\n\n')}\n\n本段结尾动作自然落稳，保留可供下一段衔接的完整构图。`;
  const file=`part-${String(part).padStart(2,'0')}.txt`;await writeFile(resolve(directory,file),prompt+'\n');parts.push({part,seconds:shots.length*8,shotStart:i+1,shotEnd:i+shots.length,prompt:`${f.id}/${file}`,references:refs});
 }
 const cues=filmCues(f);await writeFile(resolve(directory,'subtitles.srt'),cues.map((c,i)=>`${i+1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}\n`).join('\n'));
 films.push({...f,subtitles:`${f.id}/subtitles.srt`,parts,status:'awaiting-real-video-generation'});
}
const manifest={status:'prepared-not-generated',preferredModel:'Seedance, model/version and access to be confirmed in the chosen account',style:FILM_STYLE,styleChinese:exactStyle,films:films.length,shots:films.reduce((n,f)=>n+f.shots.length,0),parts:films.reduce((n,f)=>n+f.parts.length,0),seconds:films.reduce((n,f)=>n+f.duration,0),references,productions:films,pilot:{film:'opening',shots:[1,2,4],purpose:'Check rain/water motion, hand-paper contact and Cheng identity before full production.'}};
await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await mkdir('docs/films',{recursive:true});await writeFile('docs/films/SHOTLIST.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(output,'README.md'),'# 均衡之渊 · 视频制作包\n\n状态：脚本、固定原画参考与字幕已准备，真实视频尚未生成。\n\n片头64秒；12个结局各80秒。128个镜头按51段组织，避免只靠图片推拉。每一段的txt说明参考图上传顺序和逐镜头动作；references是现有原画及单姿态人物，未重绘人物。\n\n先生成opening的雨景、校样手部、程姨人物三个样片核对运动与身份，再制作整片。输出真实动态视频，保留16:9和可用帧率；不把旧prologue.mp4重新剪长冒充新片。生成服务权限、实际积分与费用必须按账户现场核对，本包不包含密钥或自动付费脚本。\n\n发布前检查人物容貌、手部接触、物体连续性、动作衔接、字幕留白及原画风格；生成素材逐段登记来源与实际参数，再剪辑和接入已准备的FilmPlayer。\n');
console.log(JSON.stringify({output,films:manifest.films,shots:manifest.shots,parts:manifest.parts,seconds:manifest.seconds,scenes:scenes.length,characters:cast.length,status:manifest.status}));
