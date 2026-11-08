import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {coverFrame,HUB_ANCHORS} from '../.sites-runtime/test-modules/assets.mjs';

const sizes=[[1440,1000],[844,390],[667,375],[2560,720]];
const out='../.artifacts/desk-check';await mkdir(out,{recursive:true});
const atlas=sharp('public/art/props/objects.webp');const meta=await atlas.metadata();
const tileWidth=meta.width/4,tileHeight=Math.floor(meta.height/3);
const report=[];
for(const scene of ['bookshop-night','bookshop-day','reading-room'])for(const [width,height] of sizes){
 const frame=coverFrame(width,height,1672,941,0,1),points=HUB_ANCHORS[scene];
 const background=await sharp(`public/art/backgrounds/${scene}.webp`).resize(Math.ceil(frame.width),Math.ceil(frame.height)).extract({left:0,top:Math.ceil(frame.height)-height,width,height}).toBuffer();
 const layers=[];
 for(const [object,cell,min,coefficient,max,scale,angle]of [['ledger',2,58,.07,108,.55,-9],['newspaper',11,70,.08,126,.55,7]]){
  const size=Math.round(Math.max(min,Math.min(max,width*coefficient))),tile=await atlas.clone().extract({left:(cell%4)*tileWidth,top:Math.floor(cell/4)*tileHeight,width:tileWidth,height:tileHeight}).resize(size,Math.round(size/1.125*scale)).rotate(angle,{background:'#00000000'}).toBuffer();
  const m=await sharp(tile).metadata();const x=frame.left+frame.width*points[object][0]/100,y=frame.top+frame.height*points[object][1]/100;
  layers.push({input:tile,left:Math.round(x-m.width/2),top:Math.round(y-m.height/2)});
  assert.ok(x>m.width/2&&x<width-m.width/2&&y>m.height/2&&y<height-m.height/2,`${scene} ${object} ${width}x${height}`);
 }
 const letterX=frame.width*points.letter[0]/100,letterY=frame.top+frame.height*points.letter[1]/100;
 // Include the ring and its breathing halo, rather than testing only its center.
 assert.ok(letterX>=24&&letterY>=24&&letterX<=width-24&&letterY<=height-24,`clipped letter ring: ${scene} ${width}x${height}`);
 layers.push({input:Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><circle cx="${letterX}" cy="${letterY}" r="15" fill="#273c2e22" stroke="#e3dbc2" stroke-width="1.5"/><circle cx="${letterX}" cy="${letterY}" r="3" fill="#e3dbc2"/></svg>`),left:0,top:0});
 await sharp(background).composite(layers).jpeg({quality:90}).toFile(`${out}/${scene}-${width}x${height}.jpg`);
 report.push({scene,width,height,letter:{x:letterX,y:letterY,radiusWithHalo:24},objectsFullyVisible:true});
}
await writeFile('docs/DESK_LAYOUT_CHECK.json',JSON.stringify({method:'Painting-coordinate composition check; not a browser screenshot',cases:report},null,2)+'\n');
console.log(`Verified ${report.length} desk compositions; letter rings and both paper objects stay inside the frame.`);
