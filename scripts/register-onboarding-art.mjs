import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile('docs/ASSET_MANIFEST.json','utf8'));
const source=JSON.parse(await readFile('docs/ONBOARDING_ART_PROMPTS.json','utf8'));
const text=await readFile('lib/game/assets.generated.ts','utf8');
const assets=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf(' as const')).trim().replace(/;$/,''));
for(const a of source.assets){
 const path=`/art/backgrounds/${a.id}.webp`,input=await readFile(`public${path}`),meta=await sharp(input).metadata();
 if(meta.width/meta.height<1.7)throw Error(`Not landscape art: ${a.id}`);
 manifest.assets[a.id]={id:a.id,kind:'background',path,source:a.source,width:meta.width,height:meta.height,alpha:false,status:'ready',promptSource:'docs/ONBOARDING_ART_PROMPTS.json'};
 const variants=[];
 for(const width of [1440,960]){
  const buffer=await sharp(input).resize({width}).webp({quality:74,effort:6}).toBuffer();
  const hash=createHash('sha256').update(buffer).digest('hex').slice(0,10),file=`${a.id}-${width}.${hash}.webp`;
  await writeFile(`public/art/runtime/${file}`,buffer);variants.push({src:`/art/runtime/${file}`,width,bytes:buffer.length});
 }
 assets[path]={...variants[0],height:Math.round(meta.height*1440/meta.width),small:variants[1],placeholder:`data:image/webp;base64,${(await sharp(input).resize({width:48}).webp({quality:35}).toBuffer()).toString('base64')}`};
}
source.registrationStatus='Registered in ASSET_MANIFEST, fingerprinted 1440/960 runtime variants, scene/season/branch mapping and authored staging.';
await writeFile('docs/ONBOARDING_ART_PROMPTS.json',JSON.stringify(source,null,2)+'\n');
await writeFile('docs/ASSET_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('lib/game/assets.generated.ts',`// Generated runtime image registry; masters and prompts retained.\nexport const ASSETS = ${JSON.stringify(assets,null,2)} as const;\n`);
let originalBytes=0,runtimeBytes=0;
for(const [path,a]of Object.entries(assets)){originalBytes+=(await readFile(`public${path}`)).length;runtimeBytes+=a.bytes;}
await writeFile('docs/ART_PERFORMANCE.json',JSON.stringify({originalBytes,runtimeBytes,reduction:1-runtimeBytes/originalBytes,assets},null,2)+'\n');
console.log(`Registered ${source.assets.length} branch paintings; runtime reduction ${Math.round((1-runtimeBytes/originalBytes)*100)}%.`);
