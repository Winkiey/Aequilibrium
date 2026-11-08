import type { CSSProperties } from 'react';
import type { SceneId } from '@/lib/game/cinematic-content';
import { imageURL } from '@/lib/game/assets';
import { SEASON_PLACEMENTS,seasonForQuarter,seasonPropFrame } from '@/lib/game/seasons';
export function SeasonalLayer({scene,quarter,visible}:{scene:SceneId;quarter:number;visible:{left:number;right:number;top:number;bottom:number}}){
 const season=seasonForQuarter(quarter),p=SEASON_PLACEMENTS[scene],{x,y,width}=seasonPropFrame(scene,visible),[left,top,w,h]=p.window;
 return <div className={`season-layer season-${season.id} ${p.outdoors?'season-outdoors':'season-indoors'} ${p.night?'season-night':''}`} aria-hidden="true">
  <div className="season-light"/><div className="season-window" style={{left:left+'%',top:top+'%',width:w+'%',height:h+'%'}}><div className="season-window-glow"/>{Array.from({length:7},(_,i)=><i key={i} className="season-mote" style={{'--i':i,left:(7+i*13)%100+'%',top:(i*17)%72+'%',animationDelay:-i*3.7+'s'} as CSSProperties}/>)}</div>
  {!p.outdoors&&<img className="season-prop" src={imageURL(season.art)} alt="" draggable={false} decoding="async" style={{left:x+'%',top:y+'%',width:width+'%'}}/>}
 </div>;
}
