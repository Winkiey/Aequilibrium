// Original miniature scores; order follows the story: autumn first.
export type AudioScene={season:number;rain:boolean;outdoors:boolean;night:boolean};
export type Score={name:string;pace:number;chords:number[][];melody:(number|null)[];air:number;birds:number;insects:number};
export const SEASON_SCORES:readonly Score[]=[
 {name:'秋 · 纸窗',pace:3.2,chords:[[48,55,62,64],[45,52,59,60],[41,48,55,57],[43,50,57,62]],melody:[76,null,74,71,69,null,67,null,72,71,null,67,69,null,64,null],air:.022,birds:0,insects:0},
 {name:'冬 · 炉边',pace:4,chords:[[38,50,57,62],[43,50,57,60],[46,53,60,65],[45,52,57,64]],melody:[69,null,null,65,64,null,62,null,67,null,null,65,62,null,null,null],air:.016,birds:0,insects:0},
 {name:'春 · 新枝',pace:2.8,chords:[[48,55,59,64],[53,60,64,69],[50,57,60,65],[43,55,62,67]],melody:[72,76,null,79,76,null,74,null,69,72,null,76,74,null,72,null],air:.018,birds:.025,insects:0},
 {name:'夏 · 树影',pace:3.6,chords:[[43,50,57,59],[48,55,62,64],[45,52,59,64],[41,53,60,65]],melody:[71,null,74,null,76,74,null,69,67,null,69,null,64,null,67,null],air:.014,birds:0,insects:.008},
];
export const seasonIndex=(index:number)=>Number.isFinite(index)?((Math.trunc(index)%4)+4)%4:0;
export const noteHz=(midi:number)=>440*2**((midi-69)/12);
export function ambienceFor(scene:AudioScene){
 const score=SEASON_SCORES[seasonIndex(scene.season)],distance=scene.outdoors?1:.38;
 return {air:score.air*distance,rain:scene.rain?(scene.outdoors?.085:.038):0,birds:score.birds*distance*(scene.night?0:1),insects:score.insects*distance*(scene.night?1:.35)};
}
