import{readFile,writeFile,mkdir}from'node:fs/promises';
import sharp from'sharp';
const manifest=JSON.parse(await readFile('docs/ASSET_MANIFEST.json','utf8'));
const files=['EXPANSION_ART_A.json','EXPANSION_ART_B.json','SEASON_ART_PROMPTS.json'];const additions=[];
for(const file of files){const doc=JSON.parse(await readFile(`docs/${file}`,'utf8'));for(const asset of doc.assets){
 const meta=await sharp(`public${asset.path}`).metadata();if(meta.width!==asset.width||meta.height!==asset.height)throw Error(`尺寸不一致 ${asset.id}`);
 if(asset.kind==='background'&&meta.width/meta.height<1.7)throw Error(`横屏比例错误 ${asset.id}`);
 if(asset.kind==='seasonal-prop'&&!meta.hasAlpha)throw Error(`季节素材丢失透明层 ${asset.id}`);
 manifest.assets[asset.id]={id:asset.id,kind:asset.kind,path:asset.path,source:asset.source??asset.sourceFile,width:meta.width,height:meta.height,alpha:meta.hasAlpha,status:'ready',promptSource:`docs/${file}`};additions.push(asset);
}}
await writeFile('docs/ASSET_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
await mkdir('../.artifacts',{recursive:true});
const tileWidth=418,tileHeight=235,columns=4,rows=Math.ceil(additions.length/columns);
const layers=await Promise.all(additions.map(async(a,i)=>({input:await sharp(`public${a.path}`).resize(tileWidth,tileHeight,{fit:a.kind==='background'?'cover':'contain',background:'#727a73'}).flatten({background:'#727a73'}).png().toBuffer(),left:(i%columns)*tileWidth,top:Math.floor(i/columns)*tileHeight})));
await sharp({create:{width:columns*tileWidth,height:rows*tileHeight,channels:3,background:'#727a73'}}).composite(layers).jpeg({quality:90}).toFile('../.artifacts/seasons-expansion-art.jpg');
console.log(`Registered ${additions.length} paintings. QA contact sheet: ../.artifacts/seasons-expansion-art.jpg`);
