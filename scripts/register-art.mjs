import { mkdir, readFile, writeFile, open, unlink } from 'node:fs/promises';
import { basename, resolve, dirname } from 'node:path';
import sharp from 'sharp';
const [id,source,kind='background']=process.argv.slice(2);
if(!id||!source||!['background','character','reference','prop'].includes(kind)||!/^[a-z0-9-]+$/.test(id))throw new Error('Expected asset id, source image and kind');
const directory=kind==='character'?'characters':kind==='reference'?'references':kind==='prop'?'props':'backgrounds';
const destination=resolve('public/art',directory,`${id}.webp`);
await mkdir(dirname(destination),{recursive:true});
await sharp(source).webp({quality:88,alphaQuality:100,effort:5}).toFile(destination);
const metadata=await sharp(destination).metadata();
const manifestPath=resolve('docs/ASSET_MANIFEST.json');
const entry={id,kind,path:`/art/${directory}/${id}.webp`,source:basename(source),width:metadata.width,height:metadata.height,alpha:!!metadata.hasAlpha,status:'ready'};
await mkdir('docs/assets',{recursive:true});
await writeFile(`docs/assets/${id}.json`,JSON.stringify(entry,null,2)+'\n');
await mkdir('.sites-runtime',{recursive:true});
const lockPath=resolve('.sites-runtime/art-register.lock');let lock;
for(let attempt=0;attempt<100;attempt++){try{lock=await open(lockPath,'wx');break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,50));}}
if(!lock)throw new Error('Asset manifest registration busy; individual metadata retained');
try{let manifest={version:2,assets:{}};try{manifest=JSON.parse(await readFile(manifestPath,'utf8'));}catch{}
manifest.assets[id]=entry;await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}finally{await lock.close();await unlink(lockPath);}
console.log(JSON.stringify(entry));
