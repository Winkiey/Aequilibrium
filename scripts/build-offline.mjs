import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,realpath,stat} from 'node:fs/promises';
import {resolve,relative,sep,join,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const digest=body=>createHash('sha256').update(body).digest('hex');
const templateFile=fileURLToPath(new URL('./offline-worker.template.txt',import.meta.url));
function validBase(value){
 if(typeof value!=='string'||!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(value)||value.split('/').some(p=>p==='.'||p==='..'))throw new Error('Invalid offline base path');
 return value;
}
function resourcePath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\?#\u0000]/.test(value))throw new Error('Unsafe offline resource path');
 let decoded;try{decoded=decodeURIComponent(value);}catch{throw new Error('Malformed offline resource path');}
 if(decoded!==value||decoded.split('/').some(p=>p==='.'||p==='..')||decoded.includes('//'))throw new Error('Unsafe encoded or traversing offline path');
 return value.slice(1);
}
function inside(parent,child){const rel=relative(parent,child);return rel!==''&&!isAbsolute(rel)&&!rel.startsWith('..'+sep)&&rel!=='..'&&!rel.startsWith(sep)&&!resolve(child).startsWith('\\\\');}
async function walk(folder){
 const result=[];
 for(const entry of await readdir(folder,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw new Error('Offline package may not follow symbolic links');
  const p=join(folder,entry.name);
  if(entry.isDirectory())result.push(...await walk(p));else if(entry.isFile())result.push(p);
 }
 return result;
}

/** Generate only deploy-time artefacts. No network, package installation or save changes. */
export async function buildOffline(root,{base='/Aequilibrium/',directory='dist-pages'}={}){
 root=await realpath(resolve(root));base=validBase(base);
 if(typeof directory!=='string'||directory.includes('\0')||directory.split(/[\\/]/).some(p=>p==='..'))throw new Error('Unsafe offline build directory');
 const output=await realpath(resolve(root,directory));if(!inside(root,output))throw new Error('Offline output must be inside the selected project');
 const template=await readFile(templateFile,'utf8');
 const registryText=await readFile(resolve(root,'lib/game/assets.generated.ts'),'utf8');
 const match=registryText.match(/export\s+const\s+ASSETS\s*=\s*(\{[\s\S]*\})\s+as\s+const\s*;/);
 if(!match)throw new Error('Runtime asset registry format was not recognised');
 const registry=JSON.parse(match[1]);
 const candidates=new Map();
 const add=(path,group)=>{path=resourcePath(path);const old=candidates.get(path);candidates.set(path,old==='shell'?'shell':group);};
 for(const entry of Object.values(registry)){
  for(const src of [entry?.src,entry?.small?.src].filter(Boolean)){
   const rel=resourcePath(src);if(!rel.startsWith('art/runtime/'))throw new Error('Only generated runtime artwork belongs in the offline pack');
   add(src,'media');
  }
 }
 const opening=await readFile(resolve(root,'components/game/OpeningFilm.tsx'),'utf8');
 const videos=[...opening.matchAll(/publicPath\(\s*['"](\/video\/[^'"]+\.mp4)['"]\s*\)/g)].map(m=>m[1]);
 if(videos.length===0)throw new Error('Opening film path must be explicitly listed for offline playback');
 for(const video of videos)add(video,'media');
 for(const file of await walk(resolve(output,'assets')))if(/\.(?:m?js|css)$/.test(file))add('/'+relative(output,file).split(sep).join('/'),'shell');
 for(const file of await walk(resolve(output,'fonts')))add('/'+relative(output,file).split(sep).join('/'),'shell');
 add('/favicon.svg','shell');add('/index.html','shell');add('/playtest/index.html','shell');
 const manifest={id:base,name:'均衡之渊 · Aequilibrium',short_name:'均衡之渊',description:'雨夜、来信和未定的三年。',start_url:base,scope:base,display:'standalone',orientation:'landscape',background_color:'#17201e',theme_color:'#17201e',icons:[{src:base+'favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]};
 await writeFile(resolve(output,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');add('/manifest.webmanifest','shell');
 const files=[];
 for(const [path,group] of [...candidates].sort(([a],[b])=>a.localeCompare(b,'en'))){
  const filename=resolve(output,path),actual=await realpath(filename);if(!inside(output,actual))throw new Error('Offline resource escaped the deployment directory');
  if(!(await stat(actual)).isFile())throw new Error('Offline resource is not a file');
  const body=await readFile(actual);files.push({url:base+path,bytes:body.byteLength,sha256:digest(body),group});
 }
 const version=digest(JSON.stringify({base,files,worker:digest(template)})).slice(0,20);
 const cachePrefix=`aequilibrium:${encodeURIComponent(base)}:`;
 const result={version,base,totalBytes:files.reduce((sum,f)=>sum+f.bytes,0),cachePrefix,shellCache:cachePrefix+'shell:'+version,mediaCache:cachePrefix+'media:'+version,completeMarker:base+'__offline_complete__',files};
 await writeFile(resolve(output,'offline-manifest.json'),JSON.stringify(result,null,2)+'\n');
 if(!template.includes('/*__OFFLINE_MANIFEST__*/'))throw new Error('Offline worker manifest placeholder missing');
 await writeFile(resolve(output,'sw.js'),template.replace('/*__OFFLINE_MANIFEST__*/',JSON.stringify(result)));
 console.log(`Offline package: ${files.length} verified resources, ${(result.totalBytes/1024/1024).toFixed(1)} MiB, version ${version}`);
 return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildOffline(process.cwd(),{base:process.env.PAGES_BASE_PATH??'/Aequilibrium/'});
